// Tiny synthesized sound effects (Web Audio): no audio files to ship.

let ctx = null;

function audio() {
  if (!ctx) {
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  // Mobile WebViews start the context suspended until a user gesture.
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, { at = 0, duration = 0.12, type = "sine", volume = 0.12 } = {}) {
  const c = audio();
  if (!c) return;
  const start = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

const arpeggio = (freqs, step, opts) => freqs.forEach((f, k) => tone(f, { ...opts, at: k * step }));

const SOUNDS = {
  tap: () => tone(880, { duration: 0.04, type: "triangle", volume: 0.05 }),
  place: () => tone(660, { duration: 0.09, type: "triangle" }),
  note: () => tone(1320, { duration: 0.05, type: "sine", volume: 0.05 }),
  erase: () => tone(330, { duration: 0.07, type: "triangle", volume: 0.07 }),
  error: () => {
    tone(196, { duration: 0.14, type: "square", volume: 0.05 });
    tone(165, { at: 0.1, duration: 0.2, type: "square", volume: 0.05 });
  },
  unit: () => arpeggio([523, 659, 784], 0.07, { duration: 0.2 }),
  win: () => arpeggio([523, 659, 784, 1047, 1319], 0.11, { duration: 0.4 }),
  lose: () => arpeggio([392, 330, 262], 0.16, { duration: 0.35, type: "triangle" }),
};

export function playSound(name) {
  try {
    SOUNDS[name]?.();
  } catch {
    // audio is optional
  }
}
