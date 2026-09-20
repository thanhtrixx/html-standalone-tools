const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

async function runTests() {
  console.log(
    "🎙️ Running Python Markdown Scenario Parser & Audio Generator Tests...\n"
  );
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  const scriptPath = path.join(
    __dirname,
    "..",
    "scripts",
    "generate-scenario-audio.py"
  );
  assert(
    fs.existsSync(scriptPath),
    "scripts/generate-scenario-audio.py exists"
  );

  const pyTestCode = `
import sys, json, importlib.util
spec = importlib.util.spec_from_file_location("gen", r"${scriptPath}")
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)

# Test Dialogue Parsing
sample_dialogue_md = """---
id: coffee-test
title: Coffee Test Dialogue
category: daily
level: A2
accent: US
description: Test dialogue ordering coffee.
speakers:
  Barista: en-US-AvaMultilingualNeural
  Customer: en-US-AndrewMultilingualNeural
---

**Barista**: Good morning! What can I get started for you today?
> Chào buổi sáng! Tôi có thể chuẩn bị gì cho bạn hôm nay?

**Customer**: Hi there! I would like a medium oat milk latte with an extra shot of espresso, please.
> Xin chào! Cho tôi một ly latte sữa yến mạch cỡ vừa thêm một shot espresso nhé.
"""

meta_d, turns_d = gen.parse_markdown_scenario(sample_dialogue_md)
assert meta_d["id"] == "coffee-test"
assert meta_d["level"] == "A2"
assert meta_d["speakers"]["Barista"] == "en-US-AvaMultilingualNeural"
assert len(turns_d) == 2
assert turns_d[0]["speaker"] == "Barista"
assert turns_d[0]["voice"] == "en-US-AvaMultilingualNeural"
assert turns_d[0]["en"] == "Good morning! What can I get started for you today?"
assert turns_d[0]["vi"] == "Chào buổi sáng! Tôi có thể chuẩn bị gì cho bạn hôm nay?"
assert turns_d[1]["speaker"] == "Customer"
assert turns_d[1]["voice"] == "en-US-AndrewMultilingualNeural"

# Test Monologue Parsing
sample_mono_md = """---
id: mono-test
title: Academic Monologue
category: academic
level: C1
speakers:
  Speaker: en-US-AndrewMultilingualNeural
---

The shift toward distributed remote work has fundamentally transformed organizational dynamics.
> Sự chuyển dịch sang làm việc từ xa phân tán đã thay đổi căn bản động lực vận hành.

Indeed, asynchronous communication fosters deeper uninterrupted focus.
> Thật vậy, giao tiếp bất đồng bộ thúc đẩy sự tập trung sâu.
"""

meta_m, turns_m = gen.parse_markdown_scenario(sample_mono_md)
assert meta_m["id"] == "mono-test"
assert len(turns_m) == 2
assert turns_m[0]["speaker"] == "Speaker"
assert turns_m[0]["voice"] == "en-US-AndrewMultilingualNeural"

# Test Syllable Counting
assert gen.count_syllables("cat") == 1
assert gen.count_syllables("game") == 1
assert gen.count_syllables("table") == 2
assert gen.count_syllables("espresso") == 3
assert gen.count_syllables("communication") == 5

# Test Word Timing Distribution & Zero Cumulative Drift
words = gen.compute_word_timings("Hi there! I would like coffee, please.", 10.0, 3.5)
assert len(words) == 7
assert words[0]["w"] == "Hi"
assert words[0]["start"] == 10.0
assert words[-1]["w"] == "please."
assert words[-1]["end"] == 13.5

# Test LRC Timestamp Formatting
assert gen.format_lrc_timestamp(0.0) == "00:00.00"
assert gen.format_lrc_timestamp(65.4) == "01:05.40"
assert gen.format_lrc_timestamp(125.89) == "02:05.89"

# Test Frontmatter Parsing with Tags & Collection
md_with_tax = """---
id: taxonomy-test
title: Taxonomy Test Dialogue
category: workplace
level: B2
accent: UK
collection: career-foundations
tags:
  - interview
  - behavioral
  - tech
description: Testing metadata parsing for tags and collections.
speakers:
  Interviewer: en-GB-RyanNeural
  Candidate: en-GB-SoniaNeural
---

**Interviewer**: Tell me about a challenging project you delivered.
> Hãy kể cho tôi nghe về một dự án đầy thách thức bạn từng thực hiện.

**Candidate**: At my previous role, we migrated legacy microservices to event-driven architectures.
> Tại vị trí trước, chúng tôi đã chuyển đổi các microservices cũ sang kiến trúc hướng sự kiện.
"""

meta_tax, turns_tax = gen.parse_markdown_scenario(md_with_tax)
assert meta_tax["id"] == "taxonomy-test"
assert meta_tax["collection"] == "career-foundations"
assert isinstance(meta_tax["tags"], list)
assert "interview" in meta_tax["tags"]
assert len(turns_tax) == 2

# Test Manifest Entry Compilation (Lightweight schema without lrcContent)
if hasattr(gen, "build_manifest_entry"):
    entry = gen.build_manifest_entry(meta_tax, turns_tax, 45)
    assert entry["id"] == "taxonomy-test"
    assert entry["title"] == "Taxonomy Test Dialogue"
    assert entry["category"] == "workplace"
    assert entry["level"] == "B2"
    assert entry["accent"] == "UK"
    assert entry["collection"] == "career-foundations"
    assert "interview" in entry["tags"]
    assert entry["sentenceCount"] == 2
    assert entry["duration"] == 45
    assert "lrcContent" not in entry
    assert "cues" not in entry

# Test Default Fallbacks when optional frontmatter omitted
md_minimal = """---
id: minimal-test
title: Minimal Monologue
category: travel
---

We boarded the bullet train just before departure.
> Chúng tôi lên tàu cao tốc ngay trước giờ khởi hành.
"""

meta_min, turns_min = gen.parse_markdown_scenario(md_minimal)
assert meta_min["id"] == "minimal-test"
if hasattr(gen, "build_manifest_entry"):
    min_entry = gen.build_manifest_entry(meta_min, turns_min, 20)
    assert min_entry["level"] in ["B1", "A2"]
    assert min_entry["accent"] == "US"
    assert min_entry["collection"] == "travel"
    assert isinstance(min_entry["tags"], list)
    assert min_entry["sentenceCount"] == 1
    assert "lrcContent" not in min_entry

print(json.dumps({"success": True, "turns_dialogue": len(turns_d), "turns_monologue": len(turns_m)}))
`;

  try {
    const pyOutput = execSync("python3 -", {
      input: pyTestCode,
      encoding: "utf-8",
    });
    const parsedPyResult = JSON.parse(pyOutput);
    assert(
      parsedPyResult.success === true,
      "Python scenario parser & syllable engine executes without error"
    );
    assert(
      parsedPyResult.turns_dialogue === 2,
      "Python parser successfully extracts 2 dialogue turns with speaker mappings"
    );
    assert(
      parsedPyResult.turns_monologue === 2,
      "Python parser successfully extracts 2 monologue turns with fallback speaker"
    );
  } catch (err) {
    assert(false, `Python engine tests threw an error: ${err.message}`);
  }

  console.log(`\n==================================================`);
  console.log(
    `📊 Python Generator Tests Completed: ${passCount} Passed, ${failCount} Failed`
  );
  console.log(`==================================================\n`);

  if (failCount > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
