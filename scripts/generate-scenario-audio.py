#!/usr/bin/env python3
"""
Generate high-fidelity audio (MP3/Opus) and Enhanced LRC subtitles (.lrc)
from Token-Efficient Markdown Scenarios using Microsoft Edge TTS with
Precision Acoustic Silence Stitching and Syllable-Weighted Word Timing.
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

def parse_frontmatter(text):
    """
    Zero-dependency YAML frontmatter parser for scenario markdown files.
    Extracts scalar metadata and nested speaker voice dictionaries.
    """
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    frontmatter_str = parts[1].strip()
    body = parts[2].strip()

    meta = {}
    current_dict = None
    dict_name = None

    for line in frontmatter_str.split("\n"):
        line_clean = line.split("#")[0].rstrip()
        if not line_clean.strip():
            continue

        # Indented key-value line (nested dictionary entry, e.g. under speakers:)
        if line_clean.startswith(("  ", "\t")) and current_dict is not None:
            indent_match = re.match(r"^\s+([^:]+):\s*(.*)$", line_clean)
            if indent_match:
                k = indent_match.group(1).strip()
                v = indent_match.group(2).strip().strip("\"'")
                meta[dict_name][k] = v
            continue

        current_dict = None
        dict_name = None

        match = re.match(r"^([^:]+):\s*(.*)$", line_clean)
        if match:
            k = match.group(1).strip()
            v = match.group(2).strip()
            if not v:
                meta[k] = {}
                current_dict = meta[k]
                dict_name = k
            else:
                meta[k] = v.strip("\"'")

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

async def synthesize_turn_edge_tts(text, voice, voice_format="audio-24khz-48kbitrate-mono-mp3"):
    """
    Synthesizes a single dialogue turn using Microsoft Edge TTS,
    returning raw audio bytes and measured sentence duration from boundaries.
    """
    communicate = edge_tts.Communicate(text, voice)
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
        # Fallback estimation based on word count (~140 wpm)
        words_count = len(text.split())
        measured_dur = max(1.5, words_count * 0.42)

    return bytes(audio_bytes), measured_dur

def stitch_audio_with_ffmpeg(sentence_files, silence_durations, output_path, audio_format="mp3"):
    """
    Stitches individual sentence audio files with sample-accurate synthetic silence gaps
    using the ffmpeg concat filter to guarantee zero cumulative drift across 1-5 minute tracks.
    """
    # Build filter complex: [0:a][silence1][1:a][silence2]...concat
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
        cmd.extend(["-c:a", "libopus", "-b:a", "32k", output_path])
    else:
        cmd.extend(["-c:a", "libmp3lame", "-b:a", "48k", output_path])

    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

async def render_scenario(scenario_meta, turns, scenario_dir, public_audio_dir, audio_format="mp3", dry_run=False):
    """
    Renders a single scenario: synthesizes audio turns, inserts acoustic silence gaps,
    computes Enhanced LRC cues, writes output files, and returns compiled metadata.
    """
    sc_id = scenario_meta.get("id", "scenario")
    title = scenario_meta.get("title", sc_id)
    category = scenario_meta.get("category", "general")
    level = scenario_meta.get("level", "B1")
    accent = scenario_meta.get("accent", "US")
    description = scenario_meta.get("description", "")

    os.makedirs(scenario_dir, exist_ok=True)
    os.makedirs(public_audio_dir, exist_ok=True)

    ext = "webm" if audio_format == "opus" else "mp3"
    audio_filename = f"{sc_id}.{ext}"
    scenario_audio_path = os.path.join(scenario_dir, f"audio.{ext}")
    public_audio_path = os.path.join(public_audio_dir, audio_filename)
    lrc_path = os.path.join(scenario_dir, "subtitles.lrc")
    public_lrc_path = os.path.join(public_audio_dir, f"{sc_id}.lrc")

    print(f"🎙️ Processing scenario [{sc_id}]: '{title}' ({len(turns)} turns, level {level}, accent {accent})")

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
                # Approximate duration for dry runs
                word_count = len(text.split())
                dur = max(1.8, word_count * 0.42)
            else:
                audio_bytes, dur = await synthesize_turn_edge_tts(text, voice)
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
            # Copy to public audio dir as well
            with open(scenario_audio_path, "rb") as src, open(public_audio_path, "wb") as dst:
                dst.write(src.read())

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
        with open(public_lrc_path, "w", encoding="utf-8") as f:
            f.write(lrc_content)
        print(f"  ✅ Saved audio and Enhanced LRC (~{current_time:.1f}s)")
    else:
        print(f"  🔍 Dry-run complete: ~{current_time:.1f}s, {len(cues)} cues")

    return {
        "id": sc_id,
        "title": title,
        "category": category,
        "level": level,
        "accent": accent,
        "duration": round(current_time),
        "description": description,
        "audioUrl": f"audio/{audio_filename}",
        "lrcContent": lrc_content,
        "cues": cues
    }

def sync_scenarios_to_html(scenarios_data, html_path):
    """
    Fast, atomic synchronization of CURATED_SCENARIOS array in index.html
    with Enhanced LRC single-source-of-truth definitions (no srtContent).
    """
    if not os.path.exists(html_path):
        print(f"❌ index.html not found at: {html_path}")
        return False

    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    js_scenarios = []
    for sc in scenarios_data:
        escaped_lrc = sc["lrcContent"].replace("`", "\\`").replace("${", "\\${")
        escaped_desc = sc["description"].replace('"', '\\"')
        escaped_title = sc["title"].replace('"', '\\"')
        js_scenarios.append(f"""        {{
          id: "{sc['id']}",
          title: "{escaped_title}",
          category: "{sc['category']}",
          level: "{sc['level']}",
          accent: "{sc['accent']}",
          duration: {sc['duration']},
          description:
            "{escaped_desc}",
          audioUrl: "{sc['audioUrl']}",
          lrcContent: `{escaped_lrc}`,
        }}""")

    scenarios_array_code = "const CURATED_SCENARIOS = [\n" + ",\n".join(js_scenarios) + ",\n      ];"

    pattern = r"const CURATED_SCENARIOS\s*=\s*\[[\s\S]*?\];"
    if not re.search(pattern, html_content):
        print("❌ Could not find const CURATED_SCENARIOS array in index.html")
        return False

    updated_html = re.sub(pattern, scenarios_array_code, html_content, count=1)

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(updated_html)

    print(f"✨ Successfully synced {len(scenarios_data)} scenarios into {os.path.basename(html_path)}")
    return True

async def main_async():
    parser = argparse.ArgumentParser(description="English Shadowing Audio & LRC Generator")
    parser.add_argument("--scenario", help="Generate specific scenario ID (e.g. specialty-coffee)")
    parser.add_argument("--all", action="store_true", help="Generate all scenarios in scenarios/ directory")
    parser.add_argument("--dry-run", action="store_true", help="Validate scenarios without network TTS calls")
    parser.add_argument("--sync-only", action="store_true", help="Sync existing scenario files into index.html")
    parser.add_argument("--format", default="mp3", choices=["mp3", "opus"], help="Audio encoding format")
    args = parser.parse_args()

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    base_shadowing_dir = os.path.join(repo_root, "english-shadowing")
    scenarios_dir = os.path.join(base_shadowing_dir, "scenarios")
    public_audio_dir = os.path.join(base_shadowing_dir, "audio")
    html_path = os.path.join(base_shadowing_dir, "index.html")

    os.makedirs(scenarios_dir, exist_ok=True)
    os.makedirs(public_audio_dir, exist_ok=True)

    # Discover scenario directories with scenario.md
    scenario_folders = []
    if os.path.exists(scenarios_dir):
        for entry in sorted(os.listdir(scenarios_dir)):
            full_path = os.path.join(scenarios_dir, entry)
            md_path = os.path.join(full_path, "scenario.md")
            if os.path.isdir(full_path) and os.path.exists(md_path):
                scenario_folders.append((entry, full_path, md_path))

    if not scenario_folders:
        print(f"ℹ️ No scenario folders found in {scenarios_dir}")
        return

    if args.scenario:
        scenario_folders = [f for f in scenario_folders if f[0] == args.scenario]
        if not scenario_folders:
            print(f"❌ Scenario '{args.scenario}' not found in {scenarios_dir}")
            sys.exit(1)

    compiled_scenarios = []

    for sc_id, sc_dir, md_path in scenario_folders:
        with open(md_path, "r", encoding="utf-8") as f:
            content = f.read()

        meta, turns = parse_markdown_scenario(content)
        if "id" not in meta:
            meta["id"] = sc_id

        if args.sync_only:
            # Read existing subtitles.lrc if available
            lrc_path = os.path.join(sc_dir, "subtitles.lrc")
            if os.path.exists(lrc_path):
                with open(lrc_path, "r", encoding="utf-8") as f:
                    lrc_content = f.read()
            else:
                lrc_content = ""

            ext = "webm" if args.format == "opus" else "mp3"
            compiled_scenarios.append({
                "id": meta["id"],
                "title": meta.get("title", sc_id),
                "category": meta.get("category", "daily"),
                "level": meta.get("level", "B1"),
                "accent": meta.get("accent", "US"),
                "duration": int(meta.get("duration", 60)),
                "description": meta.get("description", ""),
                "audioUrl": f"audio/{sc_id}.{ext}",
                "lrcContent": lrc_content,
                "cues": []
            })
        else:
            result = await render_scenario(
                meta,
                turns,
                sc_dir,
                public_audio_dir,
                audio_format=args.format,
                dry_run=args.dry_run
            )
            compiled_scenarios.append(result)

    if not args.dry_run:
        sync_scenarios_to_html(compiled_scenarios, html_path)

    print(f"\n🎉 Finished processing {len(compiled_scenarios)} scenarios.")

def main():
    asyncio.run(main_async())

if __name__ == "__main__":
    main()
