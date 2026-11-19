// Short synthesized cues adapted from the supplied prototype; no autoplay or ambient loop.
let context: AudioContext | null = null;
export async function unlockArenaAudio() {
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") await context.resume();
    return context.state === "running";
  } catch {
    return false;
  }
}
export function arenaSound(capture: boolean, element: number, liberated: boolean) {
  if (!context || context.state !== "running" || document.hidden) return;
  const a = context,
    now = a.currentTime;
  const notes = capture ? (liberated ? [440, 660, 880] : [160, 320, 640]) : [700 + element * 80];
  notes.forEach((f, i) => {
    const o = a.createOscillator(),
      g = a.createGain(),
      t = now + i * 0.065;
    o.type = element === 1 ? "triangle" : element === 3 ? "sawtooth" : "sine";
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(capture ? f * 1.5 : f * 0.6, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(capture ? 0.055 : 0.025, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + 0.24);
  });
}
