#!/usr/bin/env python3
"""
Generate high-fidelity audio MP3s and Enhanced LRC subtitles (.lrc) for curated practice scenarios using Microsoft Edge TTS.
"""

import asyncio
import os
import re
import edge_tts

SCENARIOS = [
    {
        "id": "specialty-coffee",
        "title": "Ordering at a Specialty Coffee Shop",
        "category": "daily",
        "level": "A2",
        "accent": "US",
        "description": "Natural everyday dialogue ordering pour-over coffee and asking about milk alternatives.",
        "lines": [
            {
                "voice": "en-US-AvaMultilingualNeural",
                "en": "Good morning! What can I get started for you today?",
                "vi": "Chào buổi sáng! Tôi có thể chuẩn bị gì cho bạn hôm nay?"
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "Hi there! I would like a medium oat milk latte with an extra shot of espresso, please.",
                "vi": "Xin chào! Cho tôi một ly latte sữa yến mạch cỡ vừa thêm một shot espresso nhé."
            },
            {
                "voice": "en-US-AvaMultilingualNeural",
                "en": "Sure thing! Would you prefer that iced or piping hot?",
                "vi": "Chắc chắn rồi! Bạn muốn uống đá hay nóng hổi?"
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "I'll take it iced, please. Also, do you have any freshly baked croissants left?",
                "vi": "Cho tôi uống đá nhé. Tiện thể, quán còn bánh sừng bò mới nướng không?"
            },
            {
                "voice": "en-US-AvaMultilingualNeural",
                "en": "Yes, we just pulled a batch of almond croissants straight out of the oven!",
                "vi": "Có chứ, chúng tôi vừa lấy một mẻ bánh sừng bò hạnh nhân nóng hổi ra khỏi lò!"
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "That sounds delicious! I'll grab one of those as well.",
                "vi": "Nghe ngon quá! Cho tôi lấy thêm một chiếc bánh đó luôn nhé."
            },
            {
                "voice": "en-US-AvaMultilingualNeural",
                "en": "Awesome. Your total comes to eight dollars and fifty cents.",
                "vi": "Tuyệt vời. Tổng cộng của bạn là tám đô la năm mươi xu."
            }
        ]
    },
    {
        "id": "tech-standup",
        "title": "Tech Agile Standup & Sprint Planning",
        "category": "workplace",
        "level": "B2",
        "accent": "US",
        "description": "Engineering standup discussing blocker resolution, pull request reviews, and database migration.",
        "lines": [
            {
                "voice": "en-US-AvaMultilingualNeural",
                "en": "Alright team, let's kick off our morning standup. Who wants to go first?",
                "vi": "Được rồi cả nhóm, hãy bắt đầu buổi họp nhanh buổi sáng. Ai muốn bắt đầu trước nào?"
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "Yesterday I finalized the user authentication flow and submitted the pull request for review.",
                "vi": "Hôm qua tôi đã hoàn thiện luồng xác thực người dùng và gửi pull request để mọi người duyệt."
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "Today I'm planning to dive into the database schema migration for offline caching.",
                "vi": "Hôm nay tôi dự định bắt tay vào việc chuyển đổi cấu trúc cơ sở dữ liệu để lưu đệm ngoại tuyến."
            },
            {
                "voice": "en-US-AvaMultilingualNeural",
                "en": "Do you have any blockers or dependencies on the backend team for that migration?",
                "vi": "Bạn có gặp vướng mắc hay phụ thuộc gì vào đội backend cho đợt chuyển đổi đó không?"
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "I just need Sarah to verify the indexed fields so query response times remain lightning fast.",
                "vi": "Tôi chỉ cần Sarah xác thực lại các trường được đánh chỉ mục để tốc độ phản hồi truy vấn vẫn nhanh như chớp."
            },
            {
                "voice": "en-US-AvaMultilingualNeural",
                "en": "Sounds good! I will review your PR right after this meeting wraps up.",
                "vi": "Nghe ổn đấy! Tôi sẽ duyệt PR của bạn ngay sau khi cuộc họp này kết thúc."
            },
            {
                "voice": "en-US-AvaMultilingualNeural",
                "en": "Perfect. Let's make sure our release stays on track for Thursday's deployment window.",
                "vi": "Hoàn hảo. Hãy đảm bảo đợt phát hành của chúng ta đúng tiến độ cho khung triển khai thứ Năm."
            }
        ]
    },
    {
        "id": "airport-security",
        "title": "Airport Check-in & Security Screen",
        "category": "travel",
        "level": "B1",
        "accent": "UK",
        "description": "Navigating terminal check-in, baggage drop, and customs security screening with British English.",
        "lines": [
            {
                "voice": "en-GB-SoniaNeural",
                "en": "Good afternoon, sir. May I please see your passport and boarding pass?",
                "vi": "Chào buổi chiều quý khách. Tôi có thể xem hộ chiếu và thẻ lên máy bay được không?"
            },
            {
                "voice": "en-GB-RyanNeural",
                "en": "Certainly, here you go. I have one suitcase to check in today.",
                "vi": "Chắc chắn rồi, của cô đây. Hôm nay tôi có một chiếc vali cần ký gửi."
            },
            {
                "voice": "en-GB-SoniaNeural",
                "en": "Please place your luggage on the scale to ensure it meets the weight allowance.",
                "vi": "Xin vui lòng đặt hành lý lên cân để kiểm tra xem có vượt quá trọng lượng cho phép không."
            },
            {
                "voice": "en-GB-SoniaNeural",
                "en": "It weighs exactly eighteen kilograms, which is well within your baggage limit.",
                "vi": "Nó nặng đúng mười tám ký, hoàn toàn nằm trong hạn mức hành lý của quý khách."
            },
            {
                "voice": "en-GB-SoniaNeural",
                "en": "When heading through security, please ensure all laptops and liquids are placed in separate bins.",
                "vi": "Khi đi qua cổng an ninh, xin lưu ý để toàn bộ máy tính xách tay và chất lỏng vào khay riêng."
            },
            {
                "voice": "en-GB-RyanNeural",
                "en": "Understood. Could you tell me which gate this flight departs from?",
                "vi": "Tôi hiểu rồi. Cô có thể cho tôi biết chuyến bay này khởi hành ở cửa nào không?"
            },
            {
                "voice": "en-GB-SoniaNeural",
                "en": "You will be boarding at Gate B24. Have a wonderful and safe flight!",
                "vi": "Quý khách sẽ lên máy bay ở Cửa B24. Chúc quý khách có một chuyến bay an toàn và vui vẻ!"
            }
        ]
    },
    {
        "id": "academic-ai-future",
        "title": "Academic Discussion on AI & Remote Work",
        "category": "academic",
        "level": "C1",
        "accent": "US",
        "description": "Nuanced academic discourse discussing asynchronous productivity, digital nomadism, and automation.",
        "lines": [
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "The shift toward distributed remote work has fundamentally transformed organizational dynamics.",
                "vi": "Sự chuyển dịch sang làm việc từ xa phân tán đã thay đổi căn bản động lực vận hành của các tổ chức."
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "Indeed, asynchronous communication fosters deeper uninterrupted focus and mitigates cognitive fatigue.",
                "vi": "Thật vậy, giao tiếp bất đồng bộ thúc đẩy sự tập trung sâu không bị ngắt quãng và giảm thiểu mệt mỏi nhận thức."
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "However, leaders must proactively cultivate serendipitous interactions to sustain creative innovation.",
                "vi": "Tuy nhiên, các nhà lãnh đạo phải chủ động nuôi dưỡng những tương tác ngẫu nhiên để duy trì đổi mới sáng tạo."
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "Simultaneously, autonomous AI copilots are augmenting cognitive workflows rather than displacing them entirely.",
                "vi": "Đồng thời, các trợ lý AI tự hành đang tăng cường quy trình làm việc nhận thức thay vì thay thế hoàn toàn con người."
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "The decisive competitive advantage will belong to organizations that orchestrate continuous human-machine synergy.",
                "vi": "Lợi thế cạnh tranh quyết định sẽ thuộc về những tổ chức biết phối hợp nhịp nhàng sự hiệp lực liên tục giữa người và máy."
            },
            {
                "voice": "en-US-AndrewMultilingualNeural",
                "en": "Ultimately, deliberate practice and technological literacy will define the future of sustainable knowledge work.",
                "vi": "Suy cho cùng, sự luyện tập có chủ đích và năng lực công nghệ sẽ định hình tương lai của nền lao động tri thức bền vững."
            }
        ]
    }
]

def format_lrc_timestamp(seconds):
    mins = int(seconds // 60)
    secs = seconds % 60
    return f"{mins:02d}:{secs:05.2f}"

def format_srt_timestamp(seconds):
    hours = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02d}:{mins:02d}:{secs:02d},{millis:03d}"

async def render_scenario(scenario, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    audio_filename = f"{scenario['id']}.mp3"
    audio_path = os.path.join(out_dir, audio_filename)
    lrc_path = os.path.join(out_dir, f"{scenario['id']}.lrc")
    srt_path = os.path.join(out_dir, f"{scenario['id']}.srt")
    
    print(f"🎙️ Generating scenario audio: {scenario['title']} -> {audio_path}")
    
    combined_audio = bytearray()
    cues = []
    current_time = 0.0
    
    for idx, line in enumerate(scenario["lines"]):
        text = line["en"]
        voice = line["voice"]
        communicate = edge_tts.Communicate(text, voice)
        
        line_audio = bytearray()
        sentence_boundaries = []
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                line_audio.extend(chunk["data"])
            elif chunk["type"] == "SentenceBoundary":
                sentence_boundaries.append(chunk)
                
        # Approximate or get duration from byte size or sentence boundaries
        if sentence_boundaries:
            last_sb = sentence_boundaries[-1]
            dur = (last_sb["offset"] + last_sb["duration"]) / 10000000.0
        else:
            # Fallback estimation based on word count (~150 wpm)
            words_count = len(text.split())
            dur = max(2.0, words_count * 0.4)
            
        cue_start = current_time
        cue_end = current_time + dur
        
        # Word breakdown with intra-line timing tags
        words = text.split()
        word_objs = []
        total_chars = sum(len(w) for w in words) or 1
        word_time = cue_start
        for w in words:
            w_dur = (len(w) / total_chars) * dur
            # Add small pause for punctuation
            if w.endswith(('.', '!', '?', ',')):
                w_dur += 0.1
            word_objs.append({
                "w": w,
                "start": round(word_time, 2),
                "end": round(min(cue_end, word_time + w_dur), 2)
            })
            word_time += w_dur
            
        cues.append({
            "index": idx + 1,
            "start": round(cue_start, 2),
            "end": round(cue_end, 2),
            "en": text,
            "vi": line["vi"],
            "words": word_objs
        })
        
        combined_audio.extend(line_audio)
        # Add 0.4s natural silence gap between sentences
        current_time = cue_end + 0.4
        
    with open(audio_path, "wb") as f:
        f.write(combined_audio)
        
    # Write Enhanced LRC file
    lrc_lines = []
    lrc_lines.append(f"[ti:{scenario['title']}]")
    lrc_lines.append(f"[ar:English Shadowing]")
    lrc_lines.append(f"[al:{scenario['category']}]")
    lrc_lines.append(f"[length:{format_lrc_timestamp(current_time)}]")
    lrc_lines.append("")
    
    for c in cues:
        # Enhanced LRC format with intra-line tags: [mm:ss.xx]<mm:ss.xx>Word1 <mm:ss.xx>Word2 ...
        words_lrc = " ".join([f"<{format_lrc_timestamp(w['start'])}>{w['w']}" for w in c['words']])
        lrc_lines.append(f"[{format_lrc_timestamp(c['start'])}]{words_lrc}")
        lrc_lines.append(f"[{format_lrc_timestamp(c['start'])}]{c['vi']}")
        lrc_lines.append("")
        
    with open(lrc_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lrc_lines))
        
    # Write SRT file
    srt_lines = []
    for c in cues:
        srt_lines.append(str(c["index"]))
        srt_lines.append(f"{format_srt_timestamp(c['start'])} --> {format_srt_timestamp(c['end'])}")
        srt_lines.append(c["en"])
        srt_lines.append(c["vi"])
        srt_lines.append("")
        
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines))
        
    print(f"  ✅ Saved {audio_filename} ({len(combined_audio)} bytes, {current_time:.1f}s)")
    return {
        "id": scenario["id"],
        "title": scenario["title"],
        "category": scenario["category"],
        "level": scenario["level"],
        "accent": scenario["accent"],
        "duration": round(current_time),
        "description": scenario["description"],
        "audioUrl": f"audio/{audio_filename}",
        "lrcContent": "\n".join(lrc_lines),
        "srtContent": "\n".join(srt_lines),
        "cues": cues
    }

async def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "english-shadowing"))
    audio_dir = os.path.join(base_dir, "audio")
    generated_scenarios = []
    for sc in SCENARIOS:
        res = await render_scenario(sc, audio_dir)
        generated_scenarios.append(res)
    print("\n✨ All 4 scenarios rendered successfully with audio and enhanced LRC!")

if __name__ == "__main__":
    asyncio.run(main())
