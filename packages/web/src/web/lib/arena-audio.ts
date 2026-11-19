// Synthesized arena cues and optional ambient beds; no external audio files or autoplay.
let context: AudioContext | null = null;
let ambience: { nodes: OscillatorNode[]; gain: GainNode; filter: BiquadFilterNode; key: string } | null = null;

const TERRAIN_ROOTS = [523, 110, 740, 196, 146, 330, 392, 220, 587, 262, 440, 82];
const SEAL_INTERVALS = [
  [0.5, 1, 2], [0.42, 0.7, 1.4], [0.6, 0.9, 1.8], [1, 1.33, 1.8],
  [0.35, 0.5, 1.5], [1.5, 2, 2.5], [0.75, 1.25, 1.75], [0.5, 1.5, 2.5],
  [0.4, 0.8, 1.2], [0.66, 1, 1.5], [0.3, 0.6, 1.2], [1, 1.5, 2],
] as const;

function getContext() {
  context ??= new AudioContext();
  return context;
}

export async function unlockArenaAudio() {
  try {
    const audio = getContext();
    if (audio.state === "suspended") await audio.resume();
    return audio.state === "running";
  } catch {
    return false;
  }
}

export function stopArenaAmbience() {
  if (!ambience || !context) return;
  const current = ambience;
  ambience = null;
  const now = context.currentTime;
  current.gain.gain.cancelScheduledValues(now);
  current.gain.gain.setTargetAtTime(0.0001, now, 0.16);
  current.nodes.forEach((node, index) => {
    try {
      node.onended = () => {
        node.disconnect();
        if (index === current.nodes.length - 1) {
          current.gain.disconnect();
          current.filter.disconnect();
        }
      };
      node.stop(now + 0.65);
    } catch {
      node.disconnect();
    }
  });
}

export function startArenaAmbience(terrain: number, element: number, sealStyle: number) {
  if (!context || context.state !== "running" || document.hidden) return;
  const key = `${terrain}:${element}:${sealStyle}`;
  if (ambience?.key === key) return;
  stopArenaAmbience();

  const audio = context;
  const root = TERRAIN_ROOTS[terrain] ?? 440;
  const interval = SEAL_INTERVALS[sealStyle] ?? SEAL_INTERVALS[0];
  const base = Math.max(55, (root / 3) * (1 + element * 0.018));
  const wave = terrain === 1 || terrain === 11 ? "triangle" : terrain === 3 ? "sawtooth" : "sine";
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, audio.currentTime);
  master.gain.setTargetAtTime(0.0045, audio.currentTime, 0.8);
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(terrain === 0 || terrain === 10 ? 1100 : 720, audio.currentTime);
  master.connect(filter);
  filter.connect(audio.destination);

  const nodes = [audio.createOscillator(), audio.createOscillator()];
  nodes[0].type = wave;
  nodes[1].type = "sine";
  nodes[0].frequency.setValueAtTime(base, audio.currentTime);
  nodes[1].frequency.setValueAtTime(Math.max(70, base * interval[0]), audio.currentTime);
  nodes[0].detune.setValueAtTime(-2, audio.currentTime);
  nodes[1].detune.setValueAtTime(3, audio.currentTime);
  nodes.forEach((node, index) => {
    const layer = audio.createGain();
    layer.gain.setValueAtTime(index === 0 ? 0.7 : 0.3, audio.currentTime);
    node.connect(layer);
    layer.connect(master);
    node.start();
  });
  ambience = { nodes, gain: master, filter, key };
}

export function arenaSound(capture: boolean, element: number, liberated: boolean, terrain = 0, sealStyle = 0) {
  if (!context || context.state !== "running" || document.hidden) return;
  const audio = context;
  const now = audio.currentTime;
  const root = TERRAIN_ROOTS[terrain] ?? 440;
  const intervals = SEAL_INTERVALS[sealStyle] ?? SEAL_INTERVALS[0];
  const notes = capture
    ? liberated
      ? [root * 1.5, root * 1.25, root]
      : intervals.map((n) => root * n)
    : [root * (0.85 + element * 0.04)];

  notes.forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const time = now + index * 0.065;
    oscillator.type = terrain === 1 || terrain === 11 ? "triangle" : terrain === 3 ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(
      capture ? frequency * (liberated ? 0.72 : 1.5) : frequency * 0.6,
      time + 0.12,
    );
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(capture ? (liberated ? 0.04 : 0.05) : 0.018, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.24);
  });
}
