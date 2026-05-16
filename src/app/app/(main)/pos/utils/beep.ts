"use client";

export function beep() {
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.value = 880;

    gain.gain.value = 0.05;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);

    const done = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // noop
      }
      ctx.close().catch(() => undefined);
    };

    osc.onended = done;
  } catch {
    // noop
  }
}
