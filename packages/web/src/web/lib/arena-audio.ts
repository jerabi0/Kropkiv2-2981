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
export function arenaSound(capture: boolean, element: number, liberated: boolean, terrain = 0, sealStyle = 0) {
  if (!context || context.state !== "running" || document.hidden) return;
  const a = context,
    now = a.currentTime;
  const terrainRoots = [523, 110, 740, 196, 146, 330, 392, 220, 587, 262, 440, 82];
  const root = terrainRoots[terrain] ?? 440;
  const sealIntervals = [
    [0.5, 1, 2], [0.42, 0.7, 1.4], [0.6, 0.9, 1.8], [1, 1.33, 1.8],
    [0.35, 0.5, 1.5], [1.5, 2, 2.5], [0.75, 1.25, 1.75], [0.5, 1.5, 2.5],
    [0.4, 0.8, 1.2], [0.66, 1, 1.5], [0.3, 0.6, 1.2], [1, 1.5, 2],
  ][sealStyle] ?? [0.5, 1, 2];
  const notes = capture
    ? liberated ? [root, root * 1.25, root * 1.5] : sealIntervals.map((n) => root * n)
    : [root * (0.85 + element * 0.04)];
  notes.forEach((f, i) => {
    const o = a.createOscillator(),
      g = a.createGain(),
      t = now + i * 0.065;
    o.type = terrain === 1 || terrain === 11 ? "triangle" : terrain === 3 ? "sawtooth" : "sine";
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(capture ? f * 1.5 : f * 0.6, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(capture ? 0.05 : 0.018, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + 0.24);
  });
}
