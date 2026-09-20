#!/usr/bin/env python3
"""
Generate high-fidelity audio (MP3/Opus) and Enhanced LRC subtitles (.lrc)
from Token-Efficient Markdown Scenarios using Microsoft Edge TTS with
CEFR Natural Speaking Rate Calibration, Precision Acoustic Silence Stitching,
and Syllable-Weighted Word Timing.
"""

import argparse
import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile
import edge_tts

# Common unstressed English function words spoken rapidly in connected speech
FAST_WORDS = {
    "a", "an", "the", "to", "in", "on", "at", "of", "for", "is", "it",
    "as", "or", "and", "my", "we", "i", "you", "he", "she", "they",
    "by", "so", "up", "out", "if", "but", "not", "do", "did", "be",
    "am", "are", "was", "were", "has", "had", "have"
}

COLLECTION_DEFAULTS = {
    "daily": "daily-social",
    "workplace": "workplace",
    "travel": "travel",
    "academic": "academic",
}

# CEFR benchmark natural speaking rates mapped to Edge TTS rate offsets
LEVEL_SPEECH_RATES = {
    "A1": "-25%",   # ~40-55 WPM (Phoneme clarity, deliberate pacing)
    "A2": "-15%",   # ~65-85 WPM (Slightly relaxed conversational pace)
    "B1": "-5%",    # ~95-120 WPM (Standard clear speech)
    "B2": "+0%",    # ~120-145 WPM (Baseline native delivery)
    "C1": "+8%",    # ~140-170 WPM (Connected fast speech with elisions)
    "C2": "+15%",   # ~160-185 WPM (Rapid, idiomatic native delivery)
}

def parse_rate_factor(rate_str):
    """Parses Edge TTS rate string (e.g., '-25%', '+10%') to duration speed multiplier."""
    try:
        clean = rate_str.strip().rstrip("%")
        val = float(clean)
        return max(0.4, 1.0 + (val / 100.0))
    except (ValueError, TypeError, AttributeError):
        return 1.0

def parse_frontmatter(text):
    """
    Zero-dependency YAML frontmatter parser for scenario markdown files.
    Extracts scalar metadata, inline/multiline lists, and nested speaker voice dictionaries.
    """
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    frontmatter_str = parts[1].strip()
    body = parts[2].strip()

    meta = {}
    current_key = None

    for line in frontmatter_str.split("\n"):
        line_clean = line.split("#")[0].rstrip()
        if not line_clean.strip():
            continue

        # Indented line
        if line_clean.startswith(("  ", "\t", " -", "- ")):
            stripped = line_clean.strip()
            if stripped.startswith("- "):
                val = stripped[2:].strip().strip("\"'")
                if current_key is not None:
                    if not isinstance(meta.get(current_key), list):
                        meta[current_key] = []
                    meta[current_key].append(val)
                continue
            dict_match = re.match(r"^([^:]+):\s*(.*)$", stripped)
            if dict_match and current_key is not None:
                dk = dict_match.group(1).strip()
                dv = dict_match.group(2).strip().strip("\"'")
                if not isinstance(meta.get(current_key), dict):
                    meta[current_key] = {}
                meta[current_key][dk] = dv
                continue

        current_key = None

        match = re.match(r"^([^:]+):\s*(.*)$", line_clean)
        if match:
            k = match.group(1).strip()
            v = match.group(2).strip()
            if not v:
                meta[k] = {}
                current_key = k
            elif v.startswith("[") and v.endswith("]"):
                items = [x.strip().strip("\"'") for x in v[1:-1].split(",") if x.strip()]
                meta[k] = items
            else:
                raw_val = v.strip("\"'")
                if raw_val.isdigit():
                    meta[k] = int(raw_val)
                else:
                    meta[k] = raw_val

    return meta, body

def parse_markdown_scenario(content):
    """
    Parses a scenario markdown file into metadata and a list of dialogue/monologue turns.
    Supports:
      - Multi-speaker dialogue: **SpeakerName**: Text \\n > Translation
      - Monologue: Text \\n > Translation
    """
    meta, body = parse_frontmatter(content)
    speakers = meta.get("speakers", {})
    default_voice = (
        next(iter(speakers.values()))
        if isinstance(speakers, dict) and speakers
        else "en-US-AvaMultilingualNeural"
    )

    turns = []
    blocks = [b.strip() for b in re.split(r"\n\s*\n", body) if b.strip()]

    for block in blocks:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if not lines:
            continue

        en_text = ""
        vi_text = ""
        speaker_name = None

        for line in lines:
            if line.startswith(">"):
                vi_text = line.lstrip(">").strip()
            else:
                sp_match = re.match(r"^\*{0,2}([A-Za-z0-9_\- ]+?)\*{0,2}\s*:\s*(.*)$", line)
                if sp_match and isinstance(speakers, dict) and sp_match.group(1) in speakers:
                    speaker_name = sp_match.group(1).strip("* ")
                    en_text = sp_match.group(2).strip()
                elif not en_text:
                    en_text = line.strip()
                else:
                    en_text += " " + line.strip()

        if en_text:
            voice = (
                speakers.get(speaker_name, default_voice)
                if isinstance(speakers, dict) and speaker_name
                else default_voice
            )
            turns.append({
                "speaker": speaker_name or "Speaker",
                "voice": voice,
                "en": en_text,
                "vi": vi_text
            })

    return meta, turns

def count_syllables(word):
    """
    Approximates phonetic syllable count in an English word using vowel grouping rules.
    """
    w = re.sub(r"[^a-zA-Z]", "", word).lower()
    if not w:
        return 1
    if len(w) <= 3:
        return 1
    if w.endswith("e") and not w.endswith(("le", "ee", "oe", "ye")):
        w_sub = w[:-1]
    else:
        w_sub = w
    vowels = re.findall(r"[aeiouy]+", w_sub)
    count = len(vowels)
    return max(1, count)

def compute_word_timings(text, sentence_start, sentence_duration):
    """
    Calculates intra-sentence word-level karaoke timing tags using syllable count,
    unstressed function-word compression, and punctuation pause modeling.
    Anchored strictly to sentence_start and sentence_duration for zero cumulative drift.
    """
    words = text.split()
    if not words:
        return []

    raw_weights = []
    for w in words:
        clean = re.sub(r"[^a-zA-Z]", "", w).lower()
        sylls = count_syllables(clean)
        mult = 0.7 if clean in FAST_WORDS else 1.0
        weight = sylls * mult
        if w.endswith((",", ";", ":", "—", "-")):
            weight += 0.4
        elif w.endswith((".", "!", "?")):
            weight += 0.6
        raw_weights.append(weight)

    total_weight = sum(raw_weights) or 1.0
    word_objs = []
    curr = sentence_start

    for i, (w, weight) in enumerate(zip(words, raw_weights)):
        dur = (weight / total_weight) * sentence_duration
        if i == len(words) - 1:
            w_end = sentence_start + sentence_duration
        else:
            w_end = min(sentence_start + sentence_duration, curr + dur)

        word_objs.append({
            "w": w,
            "start": round(curr, 2),
            "end": round(w_end, 2)
        })
        curr = w_end

    return word_objs

def format_lrc_timestamp(seconds):
    """Formats float seconds into standard [mm:ss.xx] LRC timecode."""
    if seconds < 0:
        seconds = 0
    mins = int(seconds // 60)
    secs = seconds % 60
    return f"{mins:02d}:{secs:05.2f}"

async def synthesize_turn_edge_tts(text, voice, rate="+0%", voice_format="audio-24khz-48kbitrate-mono-mp3"):
    """
    Synthesizes a single dialogue turn using Microsoft Edge TTS with dynamic rate control,
    returning raw audio bytes and measured sentence duration from boundaries.
    """
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    audio_bytes = bytearray()
    sentence_boundaries = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_bytes.extend(chunk["data"])
        elif chunk["type"] == "SentenceBoundary":
            sentence_boundaries.append(chunk)

    if sentence_boundaries:
        last_sb = sentence_boundaries[-1]
        measured_dur = (last_sb["offset"] + last_sb["duration"]) / 10000000.0
    else:
        # Fallback estimation scaled by speech rate multiplier
        speed_factor = parse_rate_factor(rate)
        words_count = len(text.split())
        measured_dur = max(1.5, (words_count * 0.42) / speed_factor)

    return bytes(audio_bytes), measured_dur

def stitch_audio_with_ffmpeg(sentence_files, silence_durations, output_path, audio_format="mp3"):
    """
    Stitches individual sentence audio files with sample-accurate synthetic silence gaps
    using the ffmpeg concat filter to guarantee zero cumulative drift across 1-5 minute tracks.
    """
    inputs = []
    filter_parts = []
    filter_idx = 0

    for i, s_file in enumerate(sentence_files):
        inputs.extend(["-i", s_file])
        filter_parts.append(f"[{filter_idx}:a]")
        filter_idx += 1

        if i < len(sentence_files) - 1:
            gap = silence_durations[i]
            if gap > 0:
                inputs.extend([
                    "-f", "lavfi", "-t", str(gap),
                    "-i", "anullsrc=r=24000:cl=mono"
                ])
                filter_parts.append(f"[{filter_idx}:a]")
                filter_idx += 1

    total_segments = len(filter_parts)
    concat_filter = f"{''.join(filter_parts)}concat=n={total_segments}:v=0:a=1[outa]"

    cmd = ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", concat_filter,
        "-map", "[outa]"
    ]

    if audio_format == "opus":
        mp3_fallback_path = os.path.join(os.path.dirname(output_path), "audio.mp3")
        cmd.extend([
            "-c:a", "libopus", "-b:a", "32k", output_path,
            "-map", "[outa]",
            "-c:a", "libmp3lame", "-b:a", "48k", mp3_fallback_path,
        ])
    else:
        cmd.extend(["-c:a", "libmp3lame", "-b:a", "48k", output_path])

    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

async def render_scenario(scenario_meta, turns, dest_dir, audio_format="mp3", dry_run=False, mirror_dirs=None):
    """
    Renders a single scenario: synthesizes audio turns with CEFR-calibrated speaking rate,
    inserts acoustic silence gaps, computes Enhanced LRC cues, and writes output files
    directly to dist/english-shadowing/scenarios/<id>/ (with optional mirror directories).
    """
    sc_id = scenario_meta.get("id", "scenario")
    title = scenario_meta.get("title", sc_id)
    category = scenario_meta.get("category", "general")
    level = str(scenario_meta.get("level", "B1")).upper()
    accent = scenario_meta.get("accent", "US")
    description = scenario_meta.get("description", "")

    # Frontmatter rate overrides level-based defaults if explicitly set
    rate = scenario_meta.get("rate") or LEVEL_SPEECH_RATES.get(level, "+0%")

    os.makedirs(dest_dir, exist_ok=True)

    ext = "webm" if audio_format == "opus" else "mp3"
    audio_filename = f"audio.{ext}"
    scenario_audio_path = os.path.join(dest_dir, audio_filename)
    lrc_path = os.path.join(dest_dir, "subtitles.lrc")

    print(f"🎙️ Processing scenario [{sc_id}]: '{title}' ({len(turns)} turns, level {level}, rate {rate}, accent {accent})")

    cues = []
    current_time = 0.0
    silence_gaps = []
    temp_files = []

    with tempfile.TemporaryDirectory() as tmp_dir:
        for idx, turn in enumerate(turns):
            text = turn["en"]
            vi = turn["vi"]
            voice = turn["voice"]

            if dry_run:
                speed_factor = parse_rate_factor(rate)
                word_count = len(text.split())
                dur = max(1.8, (word_count * 0.42) / speed_factor)
            else:
                audio_bytes, dur = await synthesize_turn_edge_tts(text, voice, rate=rate)
                t_file = os.path.join(tmp_dir, f"turn_{idx:03d}.mp3")
                with open(t_file, "wb") as f:
                    f.write(audio_bytes)
                temp_files.append(t_file)

            cue_start = current_time
            cue_end = current_time + dur
            words = compute_word_timings(text, cue_start, dur)

            cues.append({
                "index": idx + 1,
                "speaker": turn["speaker"],
                "start": round(cue_start, 2),
                "end": round(cue_end, 2),
                "en": text,
                "vi": vi,
                "words": words
            })

            # Inter-turn silence gap: 0.5s between turns, 0.3s if same speaker
            if idx < len(turns) - 1:
                next_speaker = turns[idx + 1]["speaker"]
                gap = 0.3 if next_speaker == turn["speaker"] else 0.5
                silence_gaps.append(gap)
                current_time = cue_end + gap
            else:
                current_time = cue_end

        if not dry_run and temp_files:
            stitch_audio_with_ffmpeg(temp_files, silence_gaps, scenario_audio_path, audio_format)

    # Build Enhanced LRC text
    lrc_lines = [
        f"[ti:{title}]",
        f"[ar:English Shadowing]",
        f"[al:{category}]",
        f"[length:{format_lrc_timestamp(current_time)}]",
        ""
    ]

    for c in cues:
        words_lrc = " ".join([
            f"<{format_lrc_timestamp(w['start'])}>{w['w']}"
            for w in c["words"]
        ])
        lrc_lines.append(f"[{format_lrc_timestamp(c['start'])}]{words_lrc}")
        if c["vi"]:
            lrc_lines.append(f"[{format_lrc_timestamp(c['start'])}]{c['vi']}")
        lrc_lines.append("")

    lrc_content = "\n".join(lrc_lines)

    if not dry_run:
        with open(lrc_path, "w", encoding="utf-8") as f:
            f.write(lrc_content)
        if mirror_dirs:
            import shutil as _sh
            for mdir in mirror_dirs:
                os.makedirs(mdir, exist_ok=True)
                for a_name in ["audio.mp3", "audio.webm"]:
                    src_a = os.path.join(dest_dir, a_name)
                    if os.path.exists(src_a):
                        _sh.copy2(src_a, os.path.join(mdir, a_name))
                _sh.copy2(lrc_path, os.path.join(mdir, "subtitles.lrc"))
        print(f"  ✅ Saved audio and Enhanced LRC to dist (~{current_time:.1f}s)")
    else:
        print(f"  🔍 Dry-run complete: ~{current_time:.1f}s, {len(cues)} cues")

    return {
        "id": sc_id,
        "title": title,
        "category": category,
        "level": level,
        "accent": accent,
        "rate": rate,
        "duration": round(current_time),
        "description": description,
        "audioUrl": f"scenarios/{sc_id}/{audio_filename}",
        "lrcContent": lrc_content,
        "cues": cues
    }

def build_manifest_entry(meta, turns, duration=0, audio_url=None):
    """
    Constructs a lightweight manifest dictionary conforming to ADR-0008 schema.
    Omits raw lrcContent/srtContent/cues to prevent bundle bloat.
    """
    sc_id = meta.get("id", "scenario")
    category = meta.get("category", "daily")
    collection = meta.get("collection") or COLLECTION_DEFAULTS.get(category, category)
    level = str(meta.get("level", "B1")).upper()

    tags = meta.get("tags")
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]
    elif not isinstance(tags, list) or not tags:
        tags = [category]

    dur = int(duration) if duration else int(meta.get("duration", 60))
    sentence_count = len(turns) if turns else int(meta.get("sentenceCount", 0))

    entry = {
        "id": sc_id,
        "title": meta.get("title", sc_id),
        "category": category,
        "level": level,
        "accent": meta.get("accent", "US"),
        "duration": dur,
        "description": meta.get("description", ""),
        "tags": tags,
        "collection": collection,
        "sentenceCount": sentence_count,
    }

    if audio_url:
        entry["audioUrl"] = audio_url
    elif "audioUrl" in meta and meta["audioUrl"]:
        entry["audioUrl"] = meta["audioUrl"]
    if "lrcUrl" in meta and meta["lrcUrl"]:
        entry["lrcUrl"] = meta["lrcUrl"]

    return entry

def export_scenarios_manifest(manifest_entries, json_path):
    """Exports clean JSON manifest file for external distribution & PWA checks."""
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(manifest_entries, f, indent=2, ensure_ascii=False)
    print(f"📄 Exported {len(manifest_entries)} scenario manifest items to {os.path.basename(json_path)}")

def sync_scenarios_to_html(manifest_entries, html_path):
    """
    Fast, atomic synchronization of lightweight SCENARIOS_MANIFEST array in index.html
    (conforming to ADR-0008, metadata only without inlined lrcContent).
    """
    if not os.path.exists(html_path):
        print(f"❌ index.html not found at: {html_path}")
        return False

    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    js_scenarios = []
    for sc in manifest_entries:
        escaped_desc = sc["description"].replace('"', '\\"')
        escaped_title = sc["title"].replace('"', '\\"')
        tags_json = json.dumps(sc.get("tags", []))

        extra_urls = ""
        if "audioUrl" in sc and sc["audioUrl"]:
            extra_urls += f'\n          audioUrl: "{sc["audioUrl"]}",'
        if "lrcUrl" in sc and sc["lrcUrl"]:
            extra_urls += f'\n          lrcUrl: "{sc["lrcUrl"]}",'

        js_scenarios.append(f"""        {{
          id: "{sc['id']}",
          title: "{escaped_title}",
          category: "{sc['category']}",
          level: "{sc['level']}",
          accent: "{sc['accent']}",
          duration: {sc['duration']},{extra_urls}
          description:
            "{escaped_desc}",
          tags: {tags_json},
          collection: "{sc.get('collection', sc['category'])}",
          sentenceCount: {sc.get('sentenceCount', 0)},
        }}""")

    scenarios_array_code = (
        "const SCENARIOS_MANIFEST = [\n"
        + ",\n".join(js_scenarios)
        + ",\n      ];\n      const CURATED_SCENARIOS = SCENARIOS_MANIFEST;"
    )

    pattern = r"const (?:SCENARIOS_MANIFEST|CURATED_SCENARIOS)\s*=\s*\[[\s\S]*?\];(?:[\s\n]*const CURATED_SCENARIOS\s*=\s*SCENARIOS_MANIFEST;)?(?:[\s\n]*const INLINED_SCENARIOS_LRC\s*=\s*\{[\s\S]*?\};)?"
    if not re.search(pattern, html_content):
        print("❌ Could not find const SCENARIOS_MANIFEST or CURATED_SCENARIOS array in index.html")
        return False

    updated_html = re.sub(pattern, lambda m: scenarios_array_code, html_content, count=1)

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(updated_html)

    print(f"✨ Successfully synced {len(manifest_entries)} scenario manifests into {os.path.basename(html_path)}")
    return True

async def main_async():
    parser = argparse.ArgumentParser(description="English Shadowing Audio & LRC Generator with Level Pacing")
    parser.add_argument("--scenario", help="Generate specific scenario ID (e.g. specialty-coffee)")
    parser.add_argument("--all", action="store_true", help="Generate all scenarios in scenarios/ directory")
    parser.add_argument("--dry-run", action="store_true", help="Validate scenarios without network TTS calls")
    parser.add_argument("--format", default="mp3", choices=["mp3", "opus"], help="Audio encoding format")
    parser.add_argument(
        "--input-dir",
        help="Flat directory of *.md scenario files to copy into english-shadowing/scenarios/",
    )
    args = parser.parse_args()

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    base_shadowing_dir = os.path.join(repo_root, "english-shadowing")
    scenarios_dir = os.path.join(base_shadowing_dir, "scenarios")
    html_path = os.path.join(base_shadowing_dir, "index.html")

    # Direct output target in dist (clean source tree)
    dist_scenarios_dir = os.path.join(repo_root, "dist", "english-shadowing", "scenarios")
    tool_dist_scenarios_dir = os.path.join(base_shadowing_dir, "dist", "scenarios")
    os.makedirs(dist_scenarios_dir, exist_ok=True)
    os.makedirs(tool_dist_scenarios_dir, exist_ok=True)

    # ── Flat input-dir ingestion ──────────────────────────────────────────────
    # Copies *.md files from external --input-dir into english-shadowing/scenarios/
    if args.input_dir:
        import shutil
        input_dir = os.path.abspath(args.input_dir)
        if not os.path.isdir(input_dir):
            print(f"❌ --input-dir '{input_dir}' does not exist or is not a directory.")
            sys.exit(1)

        md_files = sorted(f for f in os.listdir(input_dir) if f.endswith(".md"))
        if not md_files:
            print(f"ℹ️ No .md files found in {input_dir}")
        else:
            print(f"📂 Ingesting {len(md_files)} flat .md files from {input_dir}")
            for md_file in md_files:
                src = os.path.join(input_dir, md_file)
                dest = os.path.join(scenarios_dir, md_file)
                shutil.copy2(src, dest)
                print(f"  → {md_file}  →  english-shadowing/scenarios/{md_file}")
    # ─────────────────────────────────────────────────────────────────────────

    CURATED_ORDER = [
        "specialty-coffee",
        "airport-security",
        "doctor-consultation",
        "tech-standup",
        "job-interview",
        "academic-ai-future",
    ]

    def get_sort_key(entry):
        return (CURATED_ORDER.index(entry) if entry in CURATED_ORDER else 999, entry)

    # ── Discover scenario sources (.md files or folders with scenario.md) ────
    scenario_sources = {}
    if os.path.exists(scenarios_dir):
        # 1. Directory-based (<id>/scenario.md)
        for entry in os.listdir(scenarios_dir):
            full_path = os.path.join(scenarios_dir, entry)
            md_path = os.path.join(full_path, "scenario.md")
            if os.path.isdir(full_path) and os.path.exists(md_path):
                with open(md_path, "r", encoding="utf-8") as f:
                    meta, _ = parse_frontmatter(f.read())
                sc_id = meta.get("id") or entry
                scenario_sources[sc_id] = md_path

        # 2. Flat *.md files in scenarios_dir
        for entry in os.listdir(scenarios_dir):
            if entry.endswith(".md"):
                md_path = os.path.join(scenarios_dir, entry)
                with open(md_path, "r", encoding="utf-8") as f:
                    meta, _ = parse_frontmatter(f.read())
                sc_id = meta.get("id") or os.path.splitext(entry)[0]
                if sc_id not in scenario_sources:
                    scenario_sources[sc_id] = md_path

    if not scenario_sources:
        print(f"ℹ️ No scenario files found in {scenarios_dir}")
        return

    sorted_sc_ids = sorted(scenario_sources.keys(), key=get_sort_key)

    if args.scenario:
        if args.scenario not in scenario_sources:
            print(f"❌ Scenario '{args.scenario}' not found in {scenarios_dir}")
            sys.exit(1)
        sorted_sc_ids = [args.scenario]

    manifest_entries = []

    for sc_id in sorted_sc_ids:
        md_path = scenario_sources[sc_id]
        with open(md_path, "r", encoding="utf-8") as f:
            content = f.read()

        meta, turns = parse_markdown_scenario(content)
        if "id" not in meta:
            meta["id"] = sc_id

        dest_sc_dir = os.path.join(dist_scenarios_dir, sc_id)
        mirror_sc_dirs = [os.path.join(tool_dist_scenarios_dir, sc_id)]

        result = await render_scenario(
            meta,
            turns,
            dest_sc_dir,
            audio_format=args.format,
            dry_run=args.dry_run,
            mirror_dirs=mirror_sc_dirs,
        )
        audio_url = None
        if args.format == "opus":
            audio_url = f"scenarios/{sc_id}/audio.webm"
        elif args.format != "mp3":
            audio_url = f"scenarios/{sc_id}/audio.{args.format}"
        entry = build_manifest_entry(meta, turns, duration=result["duration"], audio_url=audio_url)
        manifest_entries.append(entry)

    manifest_json_path = os.path.join(base_shadowing_dir, "scenarios.json")
    export_scenarios_manifest(manifest_entries, manifest_json_path)

    # Also mirror scenarios.json to dist directories
    for dist_dir in [os.path.join(repo_root, "dist", "english-shadowing"), os.path.join(base_shadowing_dir, "dist")]:
        if os.path.exists(dist_dir):
            export_scenarios_manifest(manifest_entries, os.path.join(dist_dir, "scenarios.json"))

    if not args.dry_run:
        sync_scenarios_to_html(manifest_entries, html_path)

    print(f"\n🎉 Finished processing {len(manifest_entries)} scenarios directly to dist.")

def main():
    asyncio.run(main_async())

if __name__ == "__main__":
    main()