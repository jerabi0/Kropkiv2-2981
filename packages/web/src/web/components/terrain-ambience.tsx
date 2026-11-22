import { useEffect, useRef } from "react";

type ParticleKind = "bubble" | "dust" | "ember" | "firefly" | "leaf" | "meteor" | "mote" | "petal" | "rain" | "snow" | "spark" | "spore" | "star";
type TerrainScene = { kinds: ParticleKind[]; colors: string[]; count: number; speed: number };
type Particle = {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  spin: number;
  alpha: number;
  color: string;
  depth: number;
  sprite: HTMLCanvasElement | null;
  spriteRadius: number;
};

const SCENES: TerrainScene[] = [
  { kinds: ["spark", "mote"], colors: ["#4ff3ff", "#ff62e7", "#b8fbff"], count: 28, speed: 0.55 },
  { kinds: ["ember", "spark"], colors: ["#ff7438", "#ffc363", "#ffe7a0"], count: 25, speed: 0.72 },
  { kinds: ["snow"], colors: ["#ffffff", "#d5f4ff", "#a8dcf5"], count: 32, speed: 0.38 },
  { kinds: ["rain", "spark"], colors: ["#b5d5ff", "#a891ff", "#fff2b1"], count: 38, speed: 1.05 },
  { kinds: ["spore", "mote"], colors: ["#c99bff", "#ff78bd", "#a6f2da"], count: 24, speed: 0.32 },
  { kinds: ["bubble", "mote"], colors: ["#7bd9ff", "#d4f7ff", "#53a8e5"], count: 24, speed: 0.42 },
  { kinds: ["leaf", "dust"], colors: ["#b1d985", "#e2cd82", "#a5c8a0"], count: 19, speed: 0.54 },
  { kinds: ["dust"], colors: ["#e7b56d", "#f5d89b", "#bd8050"], count: 22, speed: 0.36 },
  { kinds: ["mote"], colors: ["#ffe8a0", "#fff5d0", "#f2c766"], count: 22, speed: 0.28 },
  { kinds: ["firefly", "leaf"], colors: ["#f4d58b", "#98d977", "#d8e9a0"], count: 20, speed: 0.34 },
  { kinds: ["star", "mote"], colors: ["#b5a6ff", "#7de6ff", "#fff3d1"], count: 30, speed: 0.18 },
  { kinds: ["meteor", "ember"], colors: ["#ff6847", "#ffc06b", "#ffedbc"], count: 23, speed: 0.5 },
  { kinds: ["petal"], colors: ["#ffc6dc", "#ff8fb5", "#ffe2ed"], count: 25, speed: 0.3 },
  { kinds: ["dust", "mote"], colors: ["#e7bd7b", "#f2d7a0", "#c28e57"], count: 23, speed: 0.32 },
];

function random(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function makeParticle(scene: TerrainScene, index: number, width: number, height: number): Particle {
  const pick = random(index * 13 + 7);
  const kind = scene.kinds[Math.floor(pick * scene.kinds.length)]!;
  const depth = 0.35 + random(index * 13 + 8) * 0.85;
  const size = (1.1 + random(index * 13 + 9) * 3.1) * depth;
  let vx = (random(index * 13 + 10) - 0.5) * scene.speed * depth;
  let vy = (random(index * 13 + 11) - 0.5) * scene.speed * depth;
  if (["ember", "firefly", "mote", "petal", "snow", "spore"].includes(kind)) vy = scene.speed * depth * (kind === "ember" || kind === "mote" || kind === "spore" ? -1 : 1);
  if (kind === "rain") {
    vx = scene.speed * depth * 0.6;
    vy = scene.speed * depth * 3.4;
  }
  if (kind === "meteor") {
    vx = scene.speed * depth * 2.7;
    vy = scene.speed * depth * 2.2;
  }
  return {
    kind,
    x: random(index * 13 + 1) * width,
    y: random(index * 13 + 2) * height,
    vx,
    vy,
    size,
    phase: random(index * 13 + 3) * Math.PI * 2,
    spin: (random(index * 13 + 4) - 0.5) * 0.035,
    alpha: 0.2 + random(index * 13 + 5) * 0.42,
    color: scene.colors[Math.floor(random(index * 13 + 6) * scene.colors.length)]!,
    depth,
    sprite: null,
    spriteRadius: 0,
  };
}

function createParticleSprite(particle: Particle): { canvas: HTMLCanvasElement; radius: number } | null {
  const { kind, color, size } = particle;
  if (!["ember", "firefly", "mote", "snow", "spore", "star"].includes(kind)) return null;

  const radius = kind === "snow" ? size * 1.8 + 5 : kind === "star" ? size * 3 : size * (kind === "firefly" ? 5 : kind === "spore" ? 3.5 : 3);
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(radius * 2 * scale);
  canvas.height = Math.ceil(radius * 2 * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);
  const center = radius;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.24, color + "99");
  gradient.addColorStop(1, color + "00");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  if (kind === "snow") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(center, center, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.52;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(center - size, center);
    ctx.lineTo(center + size, center);
    ctx.moveTo(center, center - size);
    ctx.lineTo(center, center + size);
    ctx.stroke();
  } else if (kind === "firefly") {
    ctx.fillStyle = "#fff8d6";
    ctx.beginPath();
    ctx.arc(center, center, Math.max(0.65, size * 0.42), 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "star") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(center, center, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  return { canvas, radius };
}

function drawScenery(ctx: CanvasRenderingContext2D, terrain: number, width: number, height: number) {
  const polygon = (points: [number, number][], color: string | CanvasGradient | CanvasPattern) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0]![0] * width, points[0]![1] * height);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x * width, y * height);
    ctx.closePath();
    ctx.fill();
  };
  const curve = (points: [number, number, number, number, number, number, number, number], color: string, lineWidth: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(points[0] * width, points[1] * height);
    ctx.bezierCurveTo(points[2] * width, points[3] * height, points[4] * width, points[5] * height, points[6] * width, points[7] * height);
    ctx.stroke();
  };
  const glow = (x: number, y: number, radius: number, color: string) => {
    const gradient = ctx.createRadialGradient(x * width, y * height, 0, x * width, y * height, radius * width);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + "00");
    ctx.fillStyle = gradient;
    ctx.fillRect(x * width - radius * width, y * height - radius * width, radius * width * 2, radius * width * 2);
  };

  ctx.save();
  ctx.globalAlpha = 0.52;
  if (terrain === 0) {
    polygon([[0, .8], [.1, .72], [.18, .75], [.18, 1], [0, 1]], "#0c2130");
    polygon([[.82, .76], [.9, .7], [1, .78], [1, 1], [.82, 1]], "#15142e");
  } else if (terrain === 1 || terrain === 11) {
    polygon([[0, .85], [.1, .7], [.2, .79], [.31, .69], [.4, .83], [.4, 1], [0, 1]], terrain === 1 ? "#35190f" : "#211819");
    polygon([[.62, .85], [.72, .72], [.82, .79], [.91, .68], [1, .82], [1, 1], [.62, 1]], terrain === 1 ? "#442018" : "#2d1b19");
    curve([.04, .94, .12, .87, .2, .9, .27, .8], "#ff713a88", 2.2);
    curve([.72, .95, .8, .87, .88, .92, .97, .82], "#ff9b4388", 2);
    if (terrain === 11) {
      curve([.28, .86, .4, .96, .58, .96, .7, .85], "#ff824766", 1.5);
    }
  } else if (terrain === 2) {
    polygon([[0, .9], [.12, .72], [.23, .87], [.32, .76], [.42, .92], [.42, 1], [0, 1]], "#c4ecfa33");
    polygon([[.58, .94], [.7, .74], [.81, .86], [.9, .7], [1, .91], [1, 1], [.58, 1]], "#bcecff33");
    curve([0, .18, .2, .13, .3, .21, .48, .16], "#d9f5ff44", 1.2);
  } else if (terrain === 3) {
    glow(.08, .08, .5, "#8176c522");
    glow(.94, .1, .42, "#607ab322");
  } else if (terrain === 4) {
    polygon([[0, 0], [.05, 0], [.1, .16], [.16, 0], [.22, 0], [.27, .12], [.33, 0], [0, 0]], "#281b36");
    polygon([[.68, 0], [.75, .15], [.81, 0], [.9, .12], [.94, 0], [1, 0], [1, 0]], "#29172f");
    polygon([[0, 1], [0, .88], [.08, .76], [.14, .9], [.23, .79], [.31, 1]], "#20152e");
    polygon([[.7, 1], [.78, .85], [.86, .91], [.94, .75], [1, .88], [1, 1]], "#28182f");
    glow(.12, .84, .16, "#a76de633");
    glow(.9, .86, .18, "#d358a833");
  } else if (terrain === 5) {
    curve([.11, .18, .06, .32, .2, .37, .14, .52], "#a8edff30", 3);
    curve([.9, .12, .84, .28, .98, .35, .91, .5], "#a8edff25", 2.5);
  } else if (terrain === 6) {
    polygon([[0, .91], [.13, .84], [.26, .89], [.38, .81], [.5, .9], [.5, 1], [0, 1]], "#78965a44");
    polygon([[.55, .91], [.69, .83], [.78, .88], [.89, .8], [1, .91], [1, 1], [.55, 1]], "#8da36b38");
    for (let i = 0; i < 16; i++) {
      const x = (i % 8) * .027 + (i < 8 ? .015 : .77);
      const y = .93 + (i % 3) * .018;
      curve([x, y, x - .015, y - .035, x + .012, y - .07, x + .018, y - .09], "#b4d58b55", .8);
    }
  } else if (terrain === 7 || terrain === 13) {
    polygon([[0, .82], [.18, .75], [.35, .84], [.47, .78], [.6, .88], [.78, .76], [1, .85], [1, 1], [0, 1]], terrain === 7 ? "#65462d88" : "#503b29aa");
    polygon([[0, .9], [.2, .84], [.4, .91], [.61, .83], [.8, .91], [1, .85], [1, 1], [0, 1]], terrain === 7 ? "#a1724388" : "#9c7045aa");
    if (terrain === 13) {
      ctx.strokeStyle = "#47352599";
      ctx.lineWidth = 5;
      for (const x of [.08, .12, .84, .91]) {
        ctx.beginPath();
        ctx.moveTo(x * width, .88 * height);
        ctx.lineTo(x * width, .63 * height);
        ctx.stroke();
      }
      curve([.06, .64, .1, .56, .15, .56, .19, .64], "#47352599", 5);
      curve([.81, .66, .86, .56, .91, .56, .96, .66], "#47352599", 5);
    }
  } else if (terrain === 8) {
    for (const x of [.04, .92]) {
      ctx.fillStyle = "#7a673b44";
      ctx.fillRect(x * width, .18 * height, .045 * width, .72 * height);
      ctx.fillRect((x - .015) * width, .18 * height, .075 * width, .025 * height);
      ctx.fillRect((x - .015) * width, .88 * height, .075 * width, .025 * height);
    }
  } else if (terrain === 9 || terrain === 12) {
    const branchColor = terrain === 9 ? "#263628cc" : "#352333cc";
    curve([-.02, .02, .08, .08, .1, .13, .24, .19], branchColor, 7);
    curve([.12, .12, .17, .08, .19, .04, .22, 0], branchColor, 3);
    curve([.98, 0, .91, .05, .89, .13, .75, .2], branchColor, 6);
    curve([.86, .1, .81, .08, .8, .03, .76, 0], branchColor, 3);
    const flowerColor = terrain === 9 ? ["#82ae5c99", "#a2c87888", "#f4d28b88"] : ["#ffaccbba", "#f783adbb", "#ffe0ebbb"];
    for (let i = 0; i < 18; i++) {
      const x = (i < 9 ? .025 : .77) + random(i + terrain * 19) * .2;
      const y = random(i + 80) * .26;
      ctx.fillStyle = flowerColor[i % flowerColor.length]!;
      ctx.beginPath();
      ctx.arc(x * width, y * height, 2 + random(i + 100) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (terrain === 10) {
    glow(.14, .24, .4, "#8d68f622");
    glow(.86, .75, .38, "#3482d522");
    ctx.strokeStyle = "#d5d0ff55";
    ctx.lineWidth = .7;
    ctx.beginPath();
    ctx.moveTo(.08 * width, .23 * height);
    ctx.lineTo(.17 * width, .28 * height);
    ctx.lineTo(.21 * width, .18 * height);
    ctx.lineTo(.31 * width, .24 * height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAnimatedScenery(ctx: CanvasRenderingContext2D, terrain: number, width: number, height: number, time: number) {
  ctx.save();
  ctx.globalAlpha *= 0.52;
  const curve = (points: [number, number, number, number, number, number, number, number], color: string, lineWidth: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(points[0] * width, points[1] * height);
    ctx.bezierCurveTo(points[2] * width, points[3] * height, points[4] * width, points[5] * height, points[6] * width, points[7] * height);
    ctx.stroke();
  };
  const glow = (x: number, y: number, radius: number, color: string) => {
    const gradient = ctx.createRadialGradient(x * width, y * height, 0, x * width, y * height, radius * width);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + "00");
    ctx.fillStyle = gradient;
    ctx.fillRect(x * width - radius * width, y * height - radius * width, radius * width * 2, radius * width * 2);
  };

  if (terrain === 0) {
    for (let i = 0; i < 8; i++) {
      const y = .81 + (i % 4) * .045;
      ctx.fillStyle = i % 2 ? "#ff62e7" : "#4ff3ff";
      ctx.globalAlpha = .3 + Math.sin(time * .002 + i) * .12;
      ctx.fillRect((i % 2 ? .04 : .86) * width + (i % 4) * 11, y * height, 3, 3);
    }
    ctx.globalAlpha = 1;
  } else if (terrain === 3) {
    const pulse = Math.max(0, Math.sin(time * .00025 + 1)) ** 22;
    if (pulse > .62) {
      curve([.78, .05, .72, .22, .89, .26, .84, .46], `rgba(225,237,255,${(pulse - .62) * .55})`, 2);
      curve([.84, .3, .95, .33, .91, .42, .96, .55], `rgba(225,237,255,${(pulse - .62) * .32})`, 1);
    }
  } else if (terrain === 5) {
    for (let i = 0; i < 4; i++) {
      const y = .78 + i * .065;
      curve([0, y, .23, y + Math.sin(time * .0005 + i) * .012, .42, y - .01, .63, y], `#67c6ee${i < 2 ? "28" : "40"}`, 2 + i * .35);
    }
  } else if (terrain === 8) {
    for (let i = 0; i < 5; i++) {
      const x = .08 + i * .21;
      const sway = Math.sin(time * .00035 + i) * .015;
      const gradient = ctx.createLinearGradient(x * width, 0, (x + .18 + sway) * width, height * .8);
      gradient.addColorStop(0, "#ffe9a00a");
      gradient.addColorStop(1, "#ffe9a02b");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x * width, 0);
      ctx.lineTo((x + .04 + sway) * width, 0);
      ctx.lineTo((x + .18 + sway) * width, .8 * height);
      ctx.lineTo((x + .12) * width, .8 * height);
      ctx.closePath();
      ctx.fill();
    }
  } else if (terrain === 9) {
    glow(.08, .76, .11, `rgba(255,209,124,${.1 + Math.sin(time * .001) * .025})`);
    glow(.92, .75, .11, `rgba(255,209,124,${.08 + Math.sin(time * .001 + 1) * .02})`);
  }
  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, time: number) {
  const glow = 0.5 + Math.sin(time * 0.0012 + p.phase) * 0.25;
  ctx.save();
  ctx.globalAlpha = p.alpha * (p.kind === "firefly" || p.kind === "star" || p.kind === "mote" ? glow + 0.2 : 1);

  if (p.kind === "petal" || p.kind === "leaf") {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.phase + time * p.spin);
    const length = p.size * (p.kind === "petal" ? 2.4 : 2.8);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -length);
    ctx.bezierCurveTo(length * 0.95, -length * 0.55, length * 0.78, length * 0.62, 0, length);
    ctx.bezierCurveTo(-length * 0.78, length * 0.62, -length * 0.95, -length * 0.55, 0, -length);
    ctx.fill();
    ctx.globalAlpha *= 0.5;
    ctx.strokeStyle = p.kind === "leaf" ? "#d8e9a0" : "#fff0f5";
    ctx.lineWidth = Math.max(0.45, p.size * 0.18);
    ctx.beginPath();
    ctx.moveTo(0, -length * 0.7);
    ctx.lineTo(0, length * 0.65);
    ctx.stroke();
  } else if (p.kind === "rain") {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(0.55, p.size * 0.3);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 3, p.y - p.size * 4);
    ctx.stroke();
  } else if (p.kind === "snow") {
    if (p.sprite) ctx.drawImage(p.sprite, p.x - p.spriteRadius, p.y - p.spriteRadius, p.spriteRadius * 2, p.spriteRadius * 2);
  } else if (p.kind === "bubble") {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(0.65, p.size * 0.28);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.75;
    ctx.fillStyle = "#effcff";
    ctx.beginPath();
    ctx.arc(p.x - p.size * 0.48, p.y - p.size * 0.5, Math.max(0.5, p.size * 0.24), 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "meteor") {
    const trail = p.size * 8;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(0.6, p.size * 0.35);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - trail, p.y - trail * 0.7);
    ctx.stroke();
    ctx.fillStyle = "#fff1cb";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "star") {
    if (p.sprite) {
      const pulse = 0.82 + glow * 0.36;
      const radius = p.spriteRadius * pulse;
      ctx.drawImage(p.sprite, p.x - radius, p.y - radius, radius * 2, radius * 2);
    }
  } else if (p.kind === "dust" || p.kind === "spark") {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.size * (p.kind === "dust" ? 1.8 : 0.7), p.size * 0.55, p.phase, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.sprite) {
    ctx.drawImage(p.sprite, p.x - p.spriteRadius, p.y - p.spriteRadius, p.spriteRadius * 2, p.spriteRadius * 2);
  }
  ctx.restore();
}

export function TerrainAmbience({ terrain, enabled }: { terrain: number; enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = SCENES[terrain];
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx || !scene || !enabled) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let disposed = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let particles: Particle[] = [];
    const sceneryCanvas = document.createElement("canvas");
    const sceneryCtx = sceneryCanvas.getContext("2d", { alpha: true });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      sceneryCanvas.width = canvas.width;
      sceneryCanvas.height = canvas.height;
      if (sceneryCtx) {
        sceneryCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
        sceneryCtx.clearRect(0, 0, width, height);
        drawScenery(sceneryCtx, terrain, width, height);
      }
      const count = width < 540 ? Math.round(scene.count * 0.68) : scene.count;
      particles = Array.from({ length: count }, (_, i) => {
        const particle = makeParticle(scene, i, width, height);
        const sprite = createParticleSprite(particle);
        if (sprite) {
          particle.sprite = sprite.canvas;
          particle.spriteRadius = sprite.radius;
        }
        return particle;
      });
      render(performance.now());
    };

    const render = (time: number) => {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      if (sceneryCanvas.width && sceneryCanvas.height) ctx.drawImage(sceneryCanvas, 0, 0, width, height);
      drawAnimatedScenery(ctx, terrain, width, height, time);
      for (const p of particles) drawParticle(ctx, p, time);
    };

    const tick = (time: number) => {
      if (disposed || document.hidden || reducedMotion.matches) return;
      frame = requestAnimationFrame(tick);
      if (time - lastFrame < 32) return;
      const delta = Math.min(2, (time - lastFrame) / 16.67 || 1);
      lastFrame = time;
      for (const p of particles) {
        p.phase += p.spin * delta;
        if (p.kind === "leaf" || p.kind === "petal" || p.kind === "dust") p.vx += Math.sin(time * 0.00045 + p.phase) * 0.006 * delta;
        if (p.kind === "firefly" || p.kind === "bubble" || p.kind === "spore") p.vx += Math.sin(time * 0.0007 + p.phase) * 0.004 * delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        if (p.x < -18) p.x = width + 12;
        if (p.x > width + 18) p.x = -12;
        if (p.y < -22) {
          p.y = height + 14;
          p.x = Math.random() * width;
        }
        if (p.y > height + 22) {
          p.y = -14;
          p.x = Math.random() * width;
        }
      }
      render(time);
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reducedMotion.matches) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const onMotionPreference = () => onVisibility();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    reducedMotion.addEventListener("change", onMotionPreference);
    resize();
    if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onMotionPreference);
      ctx.clearRect(0, 0, width, height);
    };
  }, [enabled, terrain]);

  if (!enabled || !SCENES[terrain]) return null;
  return <canvas ref={canvasRef} className="terrain-ambience" aria-hidden="true" />;
}
