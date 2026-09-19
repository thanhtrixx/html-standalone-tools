# Hyperframes Video Script 2: In-Depth Product & Architectural Demo

> **Format**: Widescreen 16:9 ($1920 \times 1080$)  
> **Target Platforms**: YouTube, LinkedIn, trile.dev, X (Twitter)  
> **Duration**: 3 Minutes (~180 Seconds)  
> **Tone**: Authoritative, thoughtful, developer-crafted, inspiring, masterclass  
> **Theme**: Obsidian Glow (`#0b0f19` canvas, Emerald `#10b981`, Cyan `#06b6d4`, Violet `#8b5cf6`, Amber `#f59e0b`)

---

## 🎙️ Microsoft Edge TTS Voiceover Setup

All narrations are generated using **Microsoft Edge TTS** per repository standards:

- **Default Voices**:
  - **English**: `en-US-AndrewMultilingualNeural` (Male) / `en-US-AvaMultilingualNeural` (Female)
  - **Vietnamese**: `vi-VN-NamMinhNeural` (Male) / `vi-VN-HoaiMyNeural` (Female)
- **Audio Practice**: Duck background music to **12% volume (-18dB)** during speech; maintain voice clarity with non-zero byte assets; expand BGM to **35% volume (-9dB)** during UI transitions.

### ⚡ Batch Edge-TTS Shell Script

```bash
# English Voiceover Narration (en-US-AndrewMultilingualNeural)
edge-tts --voice en-US-AndrewMultilingualNeural --text "Building sustainable daily habits should never feel like walking a fragile tightrope. Most apps punish a single missed day by resetting your hard-earned streak to zero. We built Atomic Habit Tracker with a different philosophy: systems over guilt, and identity over pressure." --write-media audio/en_act1.mp3
edge-tts --voice en-US-AndrewMultilingualNeural --text "The Today Action Board is designed for high-velocity check-ins. Organize habits into morning, afternoon, evening, and anytime routines. Tap the checkbox for instant completion, or expand inline steppers to log exact units like water intake or book pages without leaving your flow." --write-media audio/en_act2.mp3
edge-tts --voice en-US-AndrewMultilingualNeural --text "For timed focus rituals, our resilient Web Worker timer engine calculates true elapsed wall-clock deltas. Even if your phone screen locks or your browser sleeps, time is accurately reconciled on wake-up. A floating dynamic island keeps your session visible across all tabs." --write-media audio/en_act3.mp3
edge-tts --voice en-US-AndrewMultilingualNeural --text "The Insights tab shifts your mindset from fragile streaks to long-term mastery. Track rolling 30-day consistency scores, protect your momentum with streak freeze tokens, and explore your year with a 52-week GitHub-style contribution heatmap." --write-media audio/en_act4.mp3
edge-tts --voice en-US-AndrewMultilingualNeural --text "Privacy is built into the foundation. Your data lives client-side in IndexedDB with zero telemetry. With optional zero-knowledge AES-GCM-256 encryption, you can sync seamlessly to private GitHub Gists or Google Drive with deterministic 3-way merging." --write-media audio/en_act5.mp3
edge-tts --voice en-US-AndrewMultilingualNeural --text "Start instantly with eight curated starter kits or craft your custom routine. Atomic Habit Tracker is one hundred percent free, open-source, and installable as an offline PWA. Visit trile.dev slash tools slash habit-tracker today." --write-media audio/en_act6.mp3

# Vietnamese Voiceover Narration (vi-VN-NamMinhNeural)
edge-tts --voice vi-VN-NamMinhNeural --text "Xây dựng thói quen hàng ngày không nên là một chuỗi áp lực mong manh. Hầu hết ứng dụng hiện nay đều xóa sạch chuỗi ngày của bạn chỉ vì một lần lỡ hẹn. Atomic Habit Tracker được xây dựng với triết lý hoàn toàn khác: tập trung vào hệ thống bền vững thay vì áp lực tội lỗi." --write-media audio/vi_act1.mp3
edge-tts --voice vi-VN-NamMinhNeural --text "Bảng Hôm Nay được tối ưu cho thao tác check-in siêu tốc. Bạn có thể gom thói quen theo các khung giờ sáng, chiều, tối hoặc linh hoạt. Chạm để hoàn thành tức thì, hoặc mở rộng bộ đếm số lượng để ghi nhận lượng nước uống hay số trang sách đã đọc." --write-media audio/vi_act2.mp3
edge-tts --voice vi-VN-NamMinhNeural --text "Với các phiên làm việc sâu, bộ máy hẹn giờ Web Worker tính toán chính xác thời gian thực trôi qua. Ngay cả khi màn hình tắt hay trình duyệt ngủ, ứng dụng vẫn tự động bù giờ chính xác khi mở lại. Đảo động nổi Dynamic Island giúp bạn theo dõi thời gian trên mọi tab." --write-media audio/vi_act3.mp3
edge-tts --voice vi-VN-NamMinhNeural --text "Mục Thống Kê giúp bạn nhìn nhận hành trình dài hạn một cách tích cực. Theo dõi điểm kiên trì 30 ngày, bảo vệ chuỗi với vé bảo lưu, và nhìn lại cả năm qua biểu đồ nhiệt 52 tuần phong cách GitHub với định dạng tiếng Việt trọn vẹn." --write-media audio/vi_act4.mp3
edge-tts --voice vi-VN-NamMinhNeural --text "Quyền riêng tư là ưu tiên hàng đầu. Dữ liệu lưu cục bộ trong máy với IndexedDB không qua trung gian. Tùy chọn mã hóa không kiến thức AES-GCM-256 cho phép bạn đồng bộ an toàn qua GitHub Gist hoặc Google Drive với cơ chế hợp nhất 3 chiều thông minh." --write-media audio/vi_act5.mp3
edge-tts --voice vi-VN-NamMinhNeural --text "Bắt đầu ngay hôm nay với 8 bộ thói quen mẫu hoặc tự thiết lập lộ trình riêng của bạn. Ứng dụng hoàn toàn miễn phí, mã nguồn mở và cài đặt offline PWA. Truy cập ngay trile.dev/tools/habit-tracker nhé." --write-media audio/vi_act6.mp3
```

---

## 🎬 Detailed Storyboard & Scene Breakdown

```
Act 1: Philosophy (00:00 - 00:30) ──► Act 2: Today Board (00:30 - 01:05) ──► Act 3: Focus Timer (01:05 - 01:45)
                                                                                         │
Act 6: Outro (02:45 - 03:00) ◄── Act 5: Encrypted Sync (02:15 - 02:45) ◄── Act 4: Insights (01:45 - 02:15)
```

| Act & Timestamp                                    | Visual Cues & Screen Actions                                                                                                                                                                                                     | On-Screen Graphic Overlays                                                                                                                                       | Narration Subject                                                                                       |
| :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **Act 1: The Philosophy**<br>`00:00 – 00:30` (30s) | Dynamic title card with Obsidian Glow background (`#0b0f19`). Contrast animation comparing conventional streak collapse vs. Atomic Habit Tracker's 4 Life Pillars. Transition into the 4-step Identity Wizard.                   | `ATOMIC HABIT & ROUTINE TRACKER`<br>`🌿 Health • ⚡ Craft • 🔮 Mind • 🔥 Discipline`<br>`Systems Over Guilt`                                                     | The failure of conventional all-or-nothing streaks and the shift toward identity-based atomic routines. |
| **Act 2: Today Board**<br>`00:30 – 01:05` (35s)    | Screen capture of Today Board. 1-tap checkbox on _Morning Hydration_ triggers luminous emerald bloom. Expanding numeric counter for _2,500ml Water_ with inline `+ / -` steppers. Date ribbon slide.                             | `HIGH-VELOCITY CHECK-INS`<br>`• Circadian Routines (Morning/Afternoon/Evening)`<br>`• Checkbox-First Multi-Modality`                                             | Smooth daily execution, circadian time grouping, and granular numeric logging.                          |
| **Act 3: Focus Timer**<br>`01:05 – 01:45` (40s)    | Open Focus Mode modal for _45m Deep Coding_. Dial rings down. Simulate phone lock & screen wake: timer reconciles instantly. Confetti & Web Audio harmonic chime on 00:00. Show Floating Dynamic Island floating across tabs.    | `RESILIENT TIMER ENGINE`<br>`• Wall-Clock Delta Accuracy`<br>`• Screen-Off Cold Boot Recovery`<br>`• Floating Dynamic Island`                                    | Background-accurate timer architecture, wake lock, overtime logging, and persistent dynamic island.     |
| **Act 4: Insights Tab**<br>`01:45 – 02:15` (30s)   | Navigate to Insights tab. Highlight 4 Life Pillar adherence rings (94%, 88%, 90%, 92%). Zoom in on 52-Week GitHub Heatmap with localized month labels (`Jan..Sep` / `Thg 1..Thg 9`). Trigger 1-tap Streak Freeze Token.          | `ANTI-GUILT INSIGHTS`<br>`• Rolling 30d / 90d Consistency %`<br>`• 2 Streak Freeze Tokens per 30d`<br>`• 52-Week Heatmap & Day-of-Week Trends`                   | Long-term consistency vs fragile streaks, freeze buffers, and annual momentum visualization.            |
| **Act 5: Privacy & Sync**<br>`02:15 – 02:45` (30s) | Open Settings ➔ Cloud Sync Hub. Enter master vault passphrase with live WebCrypto AES-GCM-256 animation. Demonstrate GitHub Gist connector and Google Drive AppData toggle. 1-Click Clipboard JSON copy/paste with diff preview. | `SOVEREIGN LOCAL-FIRST VAULT`<br>`• Zero Backend • 100% Offline IndexedDB`<br>`• WebCrypto AES-GCM-256 Encryption`<br>`• GitHub Gist & Google Drive 3-Way Merge` | Local-first data sovereignty, zero-knowledge cloud sync, and 5-version safety rollback snapshots.       |
| **Act 6: CTA & Launch**<br>`02:45 – 03:00` (15s)   | Show 8 Curated Starter Kits (Morning Mastery, Deep Focus, Health & Vitality, etc.). Show PWA install on iOS Safari & Desktop Chrome. Final logo card and URL call to action.                                                     | `START IN SECONDS`<br>`🚀 trile.dev/tools/habit-tracker`<br>`Free • Open Source • Offline PWA`                                                                   | Starter kits, standalone PWA install, and call to action.                                               |

---

## 💻 Hyperframes 16:9 Master Template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Atomic Habit Tracker Walkthrough</title>
    <style>
      :root {
        --canvas: #0b0f19;
        --card: rgba(15, 23, 42, 0.85);
        --card-border: rgba(255, 255, 255, 0.08);
        --primary: #10b981;
        --cyan: #06b6d4;
        --violet: #8b5cf6;
        --amber: #f59e0b;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        width: 1920px;
        height: 1080px;
        background: var(--canvas);
        color: #f8fafc;
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        overflow: hidden;
      }
      .container {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        padding: 80px 100px;
        gap: 60px;
      }
      .act-frame {
        position: absolute;
        inset: 0;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.5s ease;
      }
      .act-frame.active {
        opacity: 1;
        pointer-events: auto;
      }
      .card-panel {
        background: var(--card);
        border: 1px solid var(--card-border);
        border-radius: 24px;
        padding: 40px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      }
      .glow-emerald {
        box-shadow: 0 0 60px rgba(16, 185, 129, 0.25);
      }
      .glow-cyan {
        box-shadow: 0 0 60px rgba(6, 182, 212, 0.25);
      }
      .glow-violet {
        box-shadow: 0 0 60px rgba(139, 92, 246, 0.25);
      }
      .glow-amber {
        box-shadow: 0 0 60px rgba(245, 158, 11, 0.25);
      }
    </style>
  </head>
  <body>
    <!-- Audio Timeline Engine -->
    <audio
      id="bgm"
      src="audio/bgm_ambient_tech.mp3"
      data-start="0s"
      data-duration="180s"
      loop
    ></audio>
    <audio
      id="act1-audio"
      src="audio/en_act1.mp3"
      data-start="1s"
      data-duration="28s"
    ></audio>
    <audio
      id="act2-audio"
      src="audio/en_act2.mp3"
      data-start="30.5s"
      data-duration="33s"
    ></audio>
    <audio
      id="act3-audio"
      src="audio/en_act3.mp3"
      data-start="65.5s"
      data-duration="38s"
    ></audio>
    <audio
      id="act4-audio"
      src="audio/en_act4.mp3"
      data-start="105.5s"
      data-duration="28s"
    ></audio>
    <audio
      id="act5-audio"
      src="audio/en_act5.mp3"
      data-start="135.5s"
      data-duration="28s"
    ></audio>
    <audio
      id="act6-audio"
      src="audio/en_act6.mp3"
      data-start="165.5s"
      data-duration="14s"
    ></audio>

    <!-- Act 1: Philosophy & Identity -->
    <div class="act-frame" id="act1" data-start="0s" data-duration="30s">
      <div class="container">
        <div>
          <div
            style="color: var(--primary); font-size: 24px; font-weight: 800; letter-spacing: 2px;"
          >
            ATOMIC HABIT & ROUTINE TRACKER
          </div>
          <h1
            style="font-size: 64px; font-weight: 900; line-height: 1.15; margin: 20px 0;"
          >
            Systems Over Guilt.<br /><span style="color: var(--primary);"
              >Identity Over Pressure.</span
            >
          </h1>
          <p style="font-size: 24px; color: #94a3b8; line-height: 1.5;">
            Why fragile streaks fail and how anti-guilt consistency creates
            lasting behavioral momentum.
          </p>
        </div>
        <div class="card-panel glow-emerald">
          <div
            style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;"
          >
            <div
              style="padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 16px; border: 1px solid var(--primary);"
            >
              <div style="font-size: 28px;">🌿 Health</div>
              <div style="font-size: 16px; color: #cbd5e1; margin-top: 8px;">
                Vitality & Sleep
              </div>
            </div>
            <div
              style="padding: 20px; background: rgba(6, 182, 212, 0.1); border-radius: 16px; border: 1px solid var(--cyan);"
            >
              <div style="font-size: 28px;">⚡ Craft</div>
              <div style="font-size: 16px; color: #cbd5e1; margin-top: 8px;">
                Deep Work & Code
              </div>
            </div>
            <div
              style="padding: 20px; background: rgba(139, 92, 246, 0.1); border-radius: 16px; border: 1px solid var(--violet);"
            >
              <div style="font-size: 28px;">🔮 Mind</div>
              <div style="font-size: 16px; color: #cbd5e1; margin-top: 8px;">
                Clarity & Journal
              </div>
            </div>
            <div
              style="padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 16px; border: 1px solid var(--amber);"
            >
              <div style="font-size: 28px;">🔥 Discipline</div>
              <div style="font-size: 16px; color: #cbd5e1; margin-top: 8px;">
                Budget & Planning
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Act 2: Today Board Execution -->
    <div class="act-frame" id="act2" data-start="30s" data-duration="35s">
      <div class="container">
        <div>
          <div style="color: var(--cyan); font-size: 24px; font-weight: 800;">
            TODAY ACTION BOARD
          </div>
          <h2 style="font-size: 54px; font-weight: 900; margin: 20px 0;">
            Frictionless 1-Tap & Multi-Modal Logging
          </h2>
          <ul style="font-size: 22px; color: #94a3b8; line-height: 2;">
            <li>🌅 Circadian Routines (Morning, Afternoon, Evening)</li>
            <li>⚡ Checkbox-first 1-tap instant completion</li>
            <li>🔢 Inline numeric steppers for granular progress</li>
          </ul>
        </div>
        <div class="card-panel glow-cyan">
          <div
            style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);"
          >
            <span style="font-size: 24px; font-weight: 700;"
              >🌅 Morning Routine</span
            >
            <span style="color: var(--primary); font-weight: 800;"
              >3/3 Done</span
            >
          </div>
          <div
            style="margin-top: 20px; display: flex; flex-direction: column; gap: 16px;"
          >
            <div
              style="padding: 16px 20px; background: rgba(255,255,255,0.03); border-radius: 14px; display: flex; justify-content: space-between;"
            >
              <span>[✓] 🌿 Morning Hydration</span>
              <span style="color: var(--primary); font-weight: 700;"
                >500 ml</span
              >
            </div>
            <div
              style="padding: 16px 20px; background: rgba(255,255,255,0.03); border-radius: 14px; display: flex; justify-content: space-between;"
            >
              <span>[✓] 🔮 Mindfulness Meditation</span>
              <span style="color: var(--violet); font-weight: 700;">10:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Act 3: Resilient Timer Engine -->
    <div class="act-frame" id="act3" data-start="65s" data-duration="40s">
      <div class="container">
        <div>
          <div
            style="color: var(--primary); font-size: 24px; font-weight: 800;"
          >
            FOCUS TIMER & DYNAMIC ISLAND
          </div>
          <h2 style="font-size: 54px; font-weight: 900; margin: 20px 0;">
            Screen-Off Resilient Time Truth
          </h2>
          <p style="font-size: 22px; color: #94a3b8; line-height: 1.6;">
            Engineered with Web Worker background tickers and wall-clock delta
            calculation. Your focus time is never lost when switching apps or
            locking your phone.
          </p>
        </div>
        <div class="card-panel glow-emerald" style="text-align: center;">
          <div
            style="font-size: 80px; font-weight: 900; color: var(--primary); letter-spacing: -2px;"
          >
            26:18
          </div>
          <div style="font-size: 20px; color: #94a3b8; margin: 10px 0 30px;">
            Target: 45:00 • ⚡ Deep Coding Pomodoro
          </div>
          <div
            style="display: inline-flex; gap: 16px; background: rgba(6, 182, 212, 0.15); border: 1px solid var(--cyan); border-radius: 9999px; padding: 12px 30px;"
          >
            <span>🏝️ Floating Dynamic Island pinned across all tabs</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Act 4: Insights & Heatmaps -->
    <div class="act-frame" id="act4" data-start="105s" data-duration="30s">
      <div class="container">
        <div>
          <div style="color: var(--amber); font-size: 24px; font-weight: 800;">
            INSIGHTS & ANALYTICS
          </div>
          <h2 style="font-size: 54px; font-weight: 900; margin: 20px 0;">
            52-Week Heatmap & Anti-Guilt Math
          </h2>
          <p style="font-size: 22px; color: #94a3b8; line-height: 1.6;">
            Dual-metric consistency score over 30 and 90 days. Streak freeze
            tokens protect your momentum from inevitable life interruptions.
          </p>
        </div>
        <div class="card-panel glow-amber">
          <div style="display: flex; gap: 30px; margin-bottom: 30px;">
            <div>
              <div
                style="font-size: 48px; font-weight: 900; color: var(--primary);"
              >
                94.2%
              </div>
              <div style="font-size: 16px; color: #94a3b8;">
                Rolling 30d Consistency
              </div>
            </div>
            <div>
              <div
                style="font-size: 48px; font-weight: 900; color: var(--amber);"
              >
                🛡️ 2/2
              </div>
              <div style="font-size: 16px; color: #94a3b8;">
                Freeze Tokens Active
              </div>
            </div>
          </div>
          <div
            style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; font-size: 16px; color: #94a3b8;"
          >
            📅 52-Week GitHub Contribution Heatmap with localized month labels
          </div>
        </div>
      </div>
    </div>

    <!-- Act 5: Sovereign Encrypted Sync -->
    <div class="act-frame" id="act5" data-start="135s" data-duration="30s">
      <div class="container">
        <div>
          <div style="color: var(--violet); font-size: 24px; font-weight: 800;">
            DATA SOVEREIGNTY
          </div>
          <h2 style="font-size: 54px; font-weight: 900; margin: 20px 0;">
            Zero-Knowledge Client-Side Vault
          </h2>
          <ul style="font-size: 22px; color: #94a3b8; line-height: 2;">
            <li>🔒 WebCrypto AES-GCM-256 Passphrase Encryption</li>
            <li>☁️ GitHub Gist & Google Drive AppData Connectors</li>
            <li>⚡ 5-Minute Timer Batching & Deterministic 3-Way Merge</li>
          </ul>
        </div>
        <div class="card-panel glow-violet" style="text-align: center;">
          <div style="font-size: 60px; margin-bottom: 20px;">🔒</div>
          <div style="font-size: 28px; font-weight: 800;">
            100% Local-First & Private
          </div>
          <p style="font-size: 18px; color: #94a3b8; margin-top: 10px;">
            Zero server telemetry. Your habits belong strictly to you.
          </p>
        </div>
      </div>
    </div>

    <!-- Act 6: Launch CTA -->
    <div class="act-frame" id="act6" data-start="165s" data-duration="15s">
      <div
        style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;"
      >
        <div style="font-size: 72px; font-weight: 900; color: var(--primary);">
          Atomic Habit & Routine Tracker
        </div>
        <p style="font-size: 32px; color: #94a3b8; margin: 20px 0 40px;">
          Available now as a free standalone offline PWA.
        </p>
        <div
          style="background: var(--primary); color: #0b0f19; font-size: 36px; font-weight: 900; padding: 24px 60px; border-radius: 9999px;"
        >
          trile.dev/tools/habit-tracker
        </div>
      </div>
    </div>
  </body>
</html>
```
