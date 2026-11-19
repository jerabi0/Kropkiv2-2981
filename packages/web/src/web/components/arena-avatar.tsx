import { useEffect, useRef } from "react";
import { type ArenaSettings, useArenaSettings } from "../lib/arena-settings";
const TAU = Math.PI * 2;
function eyes(c: CanvasRenderingContext2D, y: number, ey: string, hr: string, ang: number) {
  [
    [48, -1],
    [72, 1],
  ].forEach(([x, d]) => {
    c.fillStyle = "#fff";
    c.beginPath();
    c.ellipse(x, y, 7.5, 3.8, 0, 0, TAU);
    c.fill();
    c.save();
    c.shadowColor = ey;
    c.shadowBlur = 9;
    c.fillStyle = ey;
    c.beginPath();
    c.ellipse(x + d, y, 4.2, 3.6, 0, 0, TAU);
    c.fill();
    c.restore();
    c.fillStyle = "#0d1018";
    c.beginPath();
    c.arc(x + d, y, 1.8, 0, TAU);
    c.fill();
    c.strokeStyle = hr;
    c.lineWidth = 2.6;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x + d * -9, y - 7 - 2 * ang * d * -1);
    c.lineTo(x + d * 9, y - 7 + 2 * ang * d * -1);
    c.stroke();
  });
}
function starPath(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5,
      rr = i % 2 ? r * 0.45 : r;
    c[i ? "lineTo" : "moveTo"](x + Math.cos(an) * rr, y + Math.sin(an) * rr);
  }
  c.closePath();
}
/* personnage dessiné dans une boîte 120x120 */
function drawChar(c: CanvasRenderingContext2D, style: string, k: ArenaSettings) {
  const sk = k.skin,
    hr = k.hair,
    cs = k.cloth,
    ey = k.eyes;
  c.save();
  c.lineJoin = "round";
  c.lineCap = "round";
  c.fillStyle = "#161a2e";
  c.fillRect(0, 0, 120, 120);
  c.fillStyle = cs;
  c.beginPath();
  c.ellipse(60, 128, 50, 34, 0, 0, TAU);
  c.fill();
  if (style == "ninja") {
    c.fillStyle = cs;
    c.beginPath();
    c.ellipse(60, 60, 31, 37, 0, 0, TAU);
    c.fill();
    c.strokeStyle = "rgba(255,255,255,.14)";
    c.lineWidth = 1.5;
    c.stroke();
    c.fillStyle = sk;
    c.beginPath();
    c.roundRect(34, 53, 52, 18, 9);
    c.fill();
    eyes(c, 62, ey, hr, 1);
    c.fillStyle = "#2b3150";
    c.fillRect(29, 38, 62, 9);
    c.fillStyle = "#c4cde0";
    c.beginPath();
    c.roundRect(49, 36, 22, 13, 2);
    c.fill();
    c.strokeStyle = "#2b3150";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(54, 42.5);
    c.lineTo(66, 42.5);
    c.stroke();
    c.fillStyle = ey;
    c.globalAlpha = 0.9;
    c.beginPath();
    c.moveTo(78, 88);
    c.lineTo(114, 100);
    c.lineTo(110, 109);
    c.lineTo(74, 97);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;
  } else if (style == "samurai") {
    c.fillStyle = "#2b3150";
    c.fillRect(6, 100, 26, 14);
    c.fillRect(88, 100, 26, 14);
    c.fillStyle = sk;
    c.beginPath();
    c.ellipse(60, 62, 26, 32, 0, 0, TAU);
    c.fill();
    c.fillStyle = hr;
    c.beginPath();
    c.moveTo(34, 56);
    c.quadraticCurveTo(34, 24, 60, 22);
    c.quadraticCurveTo(86, 24, 86, 56);
    c.quadraticCurveTo(80, 40, 60, 38);
    c.quadraticCurveTo(40, 40, 34, 56);
    c.fill();
    c.beginPath();
    c.arc(60, 14, 8, 0, TAU);
    c.fill();
    c.fillRect(57, 18, 6, 8);
    c.fillStyle = "#c8323f";
    c.fillRect(33, 40, 54, 6);
    eyes(c, 64, ey, hr, 1.6);
    c.strokeStyle = "#a8644a";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(42, 52);
    c.lineTo(52, 76);
    c.stroke();
    c.strokeStyle = hr;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(48, 82);
    c.quadraticCurveTo(60, 78, 72, 82);
    c.stroke();
  } else {
    c.fillStyle = hr;
    c.beginPath();
    c.moveTo(34, 50);
    c.quadraticCurveTo(24, 90, 36, 114);
    c.lineTo(46, 100);
    c.lineTo(46, 50);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(86, 50);
    c.quadraticCurveTo(96, 90, 84, 114);
    c.lineTo(74, 100);
    c.lineTo(74, 50);
    c.closePath();
    c.fill();
    c.fillStyle = sk;
    c.beginPath();
    c.ellipse(60, 68, 24, 28, 0, 0, TAU);
    c.fill();
    c.fillStyle = cs;
    c.beginPath();
    c.moveTo(60, -8);
    c.quadraticCurveTo(52, 20, 20, 48);
    c.lineTo(100, 48);
    c.quadraticCurveTo(68, 20, 60, -8);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(0,0,0,.4)";
    c.beginPath();
    c.ellipse(60, 48, 44, 9, 0, 0, TAU);
    c.fill();
    c.fillStyle = cs;
    c.beginPath();
    c.ellipse(60, 47, 43, 8, 0, 0, TAU);
    c.fill();
    c.save();
    c.shadowColor = ey;
    c.shadowBlur = 10;
    c.fillStyle = ey;
    starPath(c, 60, 28, 8);
    c.fill();
    c.restore();
    eyes(c, 68, ey, hr, 0.3);
  }
  c.restore();
}

export function ArenaAvatar({ settings }: { settings: ArenaSettings }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    drawChar(c, settings.avatar, settings);
    let cancelled = false;
    if (settings.avatar === "photo" && settings.photo) {
      const image = new Image();
      image.onload = () => {
        if (cancelled) return;
        const m = Math.min(image.width, image.height);
        c.drawImage(image, (image.width - m) / 2, (image.height - m) / 2, m, m, 0, 0, 120, 120);
      };
      image.src = settings.photo;
    }
    return () => {
      cancelled = true;
    };
  }, [settings]);
  return (
    <canvas
      ref={ref}
      width={120}
      height={120}
      className="arena-avatar"
      aria-label="Ton avatar local"
    />
  );
}
export function LocalArenaAvatar() {
  const { settings } = useArenaSettings();
  return <ArenaAvatar settings={settings} />;
}
