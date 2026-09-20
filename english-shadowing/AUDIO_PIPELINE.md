# English Shadowing — Audio Generation Pipeline

> A comprehensive guide to creating scenarios, generating audio, producing LRC subtitles, and managing `scenarios.json`.

---

## Overview

The pipeline converts human-authored **Markdown scenario files** into:

1. A **stitched MP3** (via Microsoft Edge TTS + ffmpeg) output directly to `dist/english-shadowing/scenarios/<id>/`
2. An **Enhanced LRC** subtitle file with word-level karaoke timestamps in `dist/english-shadowing/scenarios/<id>/`
3. An updated **`scenarios.json`** manifest
4. A synced `SCENARIOS_MANIFEST` constant injected into `index.html`

```
english-shadowing/scenarios/*.md  (source of truth, Markdown only)
        │
        ▼  python3 scripts/generate-scenario-audio.py
        ├── dist/english-shadowing/scenarios/<id>/audio.mp3        ← stitched speech
        ├── dist/english-shadowing/scenarios/<id>/subtitles.lrc    ← Enhanced LRC
        ├── english-shadowing/scenarios.json                       ← lightweight manifest
        └── english-shadowing/index.html                           ← SCENARIOS_MANIFEST updated
```

---

## 1. Scenario Authoring — Markdown Files

Scenarios can be authored as flat files or subdirectories:

```
english-shadowing/scenarios/
├── coffee-shop.md        ← flat authoring (drop as many as you want)
├── airport-security.md
└── job-interview.md
```

_(Alternatively, `english-shadowing/scenarios/<id>/scenario.md` subdirectories are also supported)._
**The source directory contains strictly Markdown files — all generated audio and subtitles live in `dist/`!**

### File Format

```markdown
---
id: job-interview
title: Software Engineering Behavioral Interview
category: workplace
level: B2
accent: US
collection: workplace
tags:
  - interview
  - career
  - experience
  - hiring
description: Job interview discussing past technical challenges, handling cross-team conflicts, system scalability, and career growth.
speakers:
  Interviewer: en-US-AvaMultilingualNeural
  Candidate: en-US-AndrewMultilingualNeural
---

**Interviewer**: Hello Alex, thank you for joining us today.

> Xin chào Alex, cảm ơn bạn đã tham gia buổi phỏng vấn hôm nay.

**Candidate**: Thank you for having me!

> Cảm ơn bạn đã mời tôi!
```

### Frontmatter Fields

| Field         | Required | Description                                     |
| :------------ | :------: | :---------------------------------------------- |
| `id`          |    ✅    | Folder name; used as the canonical scenario key |
| `title`       |    ✅    | Display title shown in the catalog              |
| `category`    |    ✅    | `daily` / `travel` / `workplace` / `academic`   |
| `level`       |    ✅    | CEFR level: `A1` `A2` `B1` `B2` `C1` `C2`       |
| `accent`      |    ✅    | `US` / `UK` / `AU` (for display only)           |
| `description` |    ✅    | 1–2 sentence catalog description                |
| `speakers`    |    ✅    | Map of `SpeakerName: EdgeTTSVoice`              |
| `collection`  |    ⬜    | Playlist grouping; defaults from `category`     |
| `tags`        |    ⬜    | YAML list of searchable tags                    |
| `rate`        |    ⬜    | Override CEFR speech rate, e.g. `+5%`           |

### Dialogue Body Syntax

**Multi-speaker dialogue:**

```markdown
**SpeakerName**: English sentence here.

> Vietnamese translation here.
```

**Monologue (single voice):**

```markdown
The text to be spoken.

> Bản dịch tiếng Việt.
```

> [!NOTE]
> Each English paragraph + translation block = one audio turn. Blank lines separate turns.
> The parser matches `**Name**:` against the `speakers` map in frontmatter to select the correct TTS voice per turn.

---

## 2. Voice Selection

The `speakers` map links character names to **Microsoft Edge TTS** neural voices:

| Voice                            |  Accent   | Use                            |
| :------------------------------- | :-------: | :----------------------------- |
| `en-US-AvaMultilingualNeural`    | US Female | Interviewer, Barista, Customer |
| `en-US-AndrewMultilingualNeural` |  US Male  | Candidate, Customer            |
| `en-GB-SoniaNeural`              | UK Female | Airport security, UK dialogues |
| `en-AU-NatashaNeural`            | AU Female | Doctor, AU dialogues           |

> [!TIP]
> All voices above are from the user's global TTS defaults per `user_rules`. For new US scenarios, default to `en-US-AvaMultilingualNeural` (Female) and `en-US-AndrewMultilingualNeural` (Male).

---

## 3. CEFR Speech Rate Calibration

The script automatically adjusts Edge TTS speaking rate based on the `level` field:

| Level | Rate Offset | WPM Target | Character                 |
| :---: | :---------: | :--------: | :------------------------ |
|  A1   |   `-25%`    |   ~40–55   | Deliberate, phoneme-clear |
|  A2   |   `-15%`    |   ~65–85   | Relaxed conversational    |
|  B1   |    `-5%`    |  ~95–120   | Standard clear speech     |
|  B2   |    `+0%`    |  ~120–145  | Native baseline           |
|  C1   |    `+8%`    |  ~140–170  | Fast with elisions        |
|  C2   |   `+15%`    |  ~160–185  | Rapid idiomatic native    |

Set `rate: +5%` in frontmatter to manually override the level default.

---

## 4. Audio Generation — How It Works

The script ([`scripts/generate-scenario-audio.py`](file:///Users/trile/dev/trile/html-standalone-tools/scripts/generate-scenario-audio.py)) follows this pipeline per turn:

```
For each dialogue turn:
  1. synthesize_turn_edge_tts(text, voice, rate)
     → Edge TTS streams raw MP3 bytes + SentenceBoundary metadata
     → Exact duration measured from last SentenceBoundary offset (not guessed)

  2. Insert silence gap
     → 0.5s between different speakers
     → 0.3s between consecutive turns from the same speaker

  3. compute_word_timings(text, start, duration)
     → Syllable-weighted per-word timing (no cumulative drift)

After all turns:
  4. stitch_audio_with_ffmpeg(temp_files, silence_gaps, output.mp3)
     → ffmpeg concat filter: sample-accurate stitching at 24kHz mono 48kbps
     → Silence injected as real audio frames (anullsrc), NOT mathematical offsets
```

### Silence Injection Detail

```
[turn_0.mp3] + [500ms silence] + [turn_1.mp3] + [300ms silence] + [turn_2.mp3]
                                 ↑ different speaker          ↑ same speaker
```

> [!IMPORTANT]
> Silence is injected as **real ffmpeg `anullsrc` frames**, not added as a number to the timeline. This eliminates cumulative LRC drift across long 1–5 minute tracks.

### Word Timing Algorithm

Each word's timing weight = `syllable_count × speed_modifier + punctuation_bonus`:

- **Fast function words** (`a`, `the`, `in`, `and`, …) → `× 0.7`
- **Comma / semicolon** → `+ 0.4s`
- **Period / exclamation / question** → `+ 0.6s`

Weights are proportionally distributed over the sentence's exact duration, anchored to the sentence's measured start offset.

---

## 5. Enhanced LRC Format — `subtitles.lrc`

The generated `.lrc` uses the **Enhanced LRC** format with word-level karaoke tokens (`<mm:ss.xx>word`) and bilingual pairs.

### Header

```lrc
[ti:Software Engineering Behavioral Interview]
[ar:English Shadowing]
[al:workplace]
[length:02:23.03]
```

### Body — One pair per turn

```lrc
[00:00.00]<00:00.00>Hello <00:00.40>Alex, <00:00.89>thank <00:01.09>you <00:01.23>for <00:01.37>joining <00:01.78>us <00:01.98>today.
[00:00.00]Xin chào Alex, cảm ơn bạn đã tham gia buổi phỏng vấn hôm nay.

[00:07.99]<00:07.99>Thank <00:08.22>you <00:08.38>for <00:08.54>having <00:09.00>me!
[00:07.99]Cảm ơn bạn đã mời tôi!
```

### LRC Line Structure

| Line                                          | Meaning                                                     |
| :-------------------------------------------- | :---------------------------------------------------------- |
| `[mm:ss.xx]<mm:ss.xx>word1 <mm:ss.xx>word2 …` | English sentence with per-word karaoke tags                 |
| `[mm:ss.xx]Vietnamese text`                   | Translation line (same timestamp as the English line above) |
| _(blank line)_                                | Turn separator                                              |

> [!NOTE]
> The player (`parseEnhancedLrc`) reads the first line of each pair as karaoke-highlighted English, and the second line (same timestamp, no `<>` tokens) as the translation. Blank lines delimit turns.

---

## 6. `scenarios.json` — The Manifest

[`scenarios.json`](file:///Users/trile/dev/trile/html-standalone-tools/english-shadowing/scenarios.json) is generated alongside the audio and contains **lightweight metadata only** — no LRC content, no audio bytes.

```json
[
  {
    "id": "job-interview",
    "title": "Software Engineering Behavioral Interview",
    "category": "workplace",
    "level": "B2",
    "accent": "US",
    "duration": 143,
    "description": "Job interview discussing past technical challenges...",
    "tags": ["interview", "career", "experience", "hiring"],
    "collection": "workplace",
    "sentenceCount": 18
  }
]
```

### Field Reference

| Field           |    Type    | Description                                                     |
| :-------------- | :--------: | :-------------------------------------------------------------- |
| `id`            |  `string`  | Matches `scenarios/<id>/` folder name                           |
| `title`         |  `string`  | Display title                                                   |
| `category`      |  `string`  | `daily` / `travel` / `workplace` / `academic`                   |
| `level`         |  `string`  | CEFR level                                                      |
| `accent`        |  `string`  | `US` / `UK` / `AU`                                              |
| `duration`      |  `number`  | Track length in **seconds**                                     |
| `description`   |  `string`  | Short catalog description                                       |
| `tags`          | `string[]` | Thematic tags                                                   |
| `collection`    |  `string`  | Playlist/collection key                                         |
| `sentenceCount` |  `number`  | Number of dialogue turns                                        |
| `audioUrl`      | `string?`  | Optional — omit to use canonical `scenarios/<id>/audio.mp3`     |
| `lrcUrl`        | `string?`  | Optional — omit to use canonical `scenarios/<id>/subtitles.lrc` |

> [!TIP]
> Per **ADR-0008**, `audioUrl` and `lrcUrl` are only needed for external/CDN overrides. Omitting them resolves to the canonical `scenarios/<id>/audio.mp3` and `scenarios/<id>/subtitles.lrc` paths automatically.

---

## 7. CLI Commands

```bash
# Generate audio + LRC + sync manifest for ALL scenarios
bun run audio:shadowing
# → python3 scripts/generate-scenario-audio.py --all

# Generate a single scenario
python3 scripts/generate-scenario-audio.py --scenario job-interview

# Dry-run: validate schema + estimate timing (instant, zero TTS calls)
bun run audio:shadowing:dry
# → python3 scripts/generate-scenario-audio.py --all --dry-run

# Ingest an external flat directory of *.md files and generate
python3 scripts/generate-scenario-audio.py --input-dir /path/to/my-scenarios --all

# Generate in Opus/WebM instead of MP3
python3 scripts/generate-scenario-audio.py --all --format opus

# Build + minify + package dist/
bun run build:shadowing
```

---

## 8. End-to-End: Adding a New Scenario

```
Step 1 — Author the Markdown
  Drop: english-shadowing/scenarios/my-new-scenario.md (or folder with scenario.md)
  Fill in frontmatter (id, title, level, speakers, …)
  Write dialogue turns (**Speaker**: text \n > translation)

Step 2 — Validate & Dry-run
  bun run audio:shadowing:dry
  → Validates schema, estimates timing, zero network calls

Step 3 — Generate audio & LRC directly to dist/
  python3 scripts/generate-scenario-audio.py --scenario my-new-scenario
  → writes audio.mp3 + subtitles.lrc directly into dist/english-shadowing/scenarios/<id>/
  → updates english-shadowing/scenarios.json
  → patches SCENARIOS_MANIFEST in english-shadowing/index.html

Step 4 — Verify & Build
  bun run test:shadowing -- --quiet
  bun run build:shadowing
```

---

## 9. Key Files Reference

| File                                                                                                                                                                                                      | Role                                                   |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- |
| [`scripts/generate-scenario-audio.py`](file:///Users/trile/dev/trile/html-standalone-tools/scripts/generate-scenario-audio.py)                                                                            | Main audio + LRC generation pipeline                   |
| [`english-shadowing/scenarios.json`](file:///Users/trile/dev/trile/html-standalone-tools/english-shadowing/scenarios.json)                                                                                | Lightweight manifest for catalog                       |
| [`english-shadowing/scenarios/<id>/scenario.md`](file:///Users/trile/dev/trile/html-standalone-tools/english-shadowing/scenarios/job-interview/scenario.md)                                               | Source of truth per scenario                           |
| [`english-shadowing/scenarios/<id>/audio.mp3`](file:///Users/trile/dev/trile/html-standalone-tools/english-shadowing/scenarios/job-interview/audio.mp3)                                                   | Generated stitched speech                              |
| [`english-shadowing/scenarios/<id>/subtitles.lrc`](file:///Users/trile/dev/trile/html-standalone-tools/english-shadowing/scenarios/job-interview/subtitles.lrc)                                           | Generated Enhanced LRC                                 |
| [`docs/adr/0006-...`](file:///Users/trile/dev/trile/html-standalone-tools/english-shadowing/docs/adr/0006-markdown-scenario-authoring-precision-acoustic-stitching-and-lrc-standardization.md)            | ADR: Markdown authoring + acoustic stitching decisions |
| [`docs/adr/0008-...`](file:///Users/trile/dev/trile/html-standalone-tools/english-shadowing/docs/adr/0008-manifest-driven-scenario-architecture-on-demand-lrc-streaming-and-curated-content-lifecycle.md) | ADR: Manifest-driven architecture decisions            |
