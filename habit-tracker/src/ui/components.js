/**
 * Atomic Habit Tracker Shared UI Components & Micro-Interactions
 *
 * Implements:
 * - SVG Progress Rings (Fluid animated circular strokes)
 * - Micro-Haptics feedback (`navigator.vibrate`)
 * - Canvas Confetti Particle Celebration Engine
 * - Audio Chime Synthesizer (Web Audio API)
 */

(function (global) {
  "use strict";

  /**
   * Generates fluid SVG Circular Progress Ring markup
   */
  function renderSvgProgressRing(
    radius = 24,
    strokeWidth = 4,
    percentage = 0,
    colorHex = "#10b981",
    extraClasses = ""
  ) {
    const r = radius - strokeWidth / 2;
    const circumference = 2 * Math.PI * r;
    const clamped = Math.min(100, Math.max(0, Number(percentage) || 0));
    const offset = circumference - (clamped / 100) * circumference;
    const size = radius * 2;

    return `
      <svg class="progress-ring ${extraClasses}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
        <circle
          cx="${radius}"
          cy="${radius}"
          r="${r}"
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.08)"
          stroke-width="${strokeWidth}"
          class="dark:stroke-white/10 stroke-slate-200"
        />
        <circle
          class="progress-ring-circle transition-all duration-500 ease-out"
          cx="${radius}"
          cy="${radius}"
          r="${r}"
          fill="transparent"
          stroke="${colorHex}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
          stroke-linecap="round"
        />
      </svg>
    `;
  }

  /**
   * Triggers tactile Web Haptic feedback
   */
  function triggerHapticFeedback(type = "success") {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.vibrate !== "function"
    ) {
      return false;
    }
    try {
      if (type === "success") {
        navigator.vibrate([15, 30, 15]);
      } else if (type === "light") {
        navigator.vibrate(10);
      } else if (type === "heavy") {
        navigator.vibrate(45);
      } else if (type === "victory") {
        navigator.vibrate([30, 40, 30, 40, 60]);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Plays celebratory audio chime via Web Audio API
   */
  function playCompletionChime() {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }

  /**
   * Canvas Confetti Celebration Particle Engine
   */
  function createConfettiBurst(canvas, onComplete = null) {
    if (!canvas) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const ctx = canvas.getContext ? canvas.getContext("2d") : null;
    if (!ctx) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const width =
      canvas.width || (typeof window !== "undefined" ? window.innerWidth : 360);
    const height =
      canvas.height ||
      (typeof window !== "undefined" ? window.innerHeight : 640);
    canvas.width = width;
    canvas.height = height;

    const colors = [
      "#10b981",
      "#6366f1",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#ec4899",
    ];
    const particles = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 50,
        y: height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        alpha: 1.0,
      });
    }

    let frame = 0;
    const maxFrames = 60;

    function renderFrame() {
      if (frame >= maxFrames) {
        if (ctx.clearRect) ctx.clearRect(0, 0, width, height);
        if (typeof onComplete === "function") onComplete();
        return;
      }

      if (ctx.clearRect) ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.vr;
        p.alpha = Math.max(0, 1 - frame / maxFrames);

        if (ctx.save) ctx.save();
        if (ctx.translate) ctx.translate(p.x, p.y);
        if (ctx.rotate) ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        if (ctx.fillRect)
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        if (ctx.restore) ctx.restore();
      });

      frame++;
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(renderFrame);
      } else {
        renderFrame();
      }
    }

    renderFrame();
  }

  const componentExports = {
    renderSvgProgressRing,
    triggerHapticFeedback,
    playCompletionChime,
    createConfettiBurst,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = componentExports;
  } else {
    global.HabitComponents = componentExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
