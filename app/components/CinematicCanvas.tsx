"use client";

import { useEffect, useMemo, useRef } from "react";

type Building = {
  x: number;
  width: number;
  height: number;
  lightSeed: number;
};

type Billboard = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

const TOTAL_DURATION = 45_000;

function generateBuildings(count: number): Building[] {
  const buildings: Building[] = [];
  for (let i = 0; i < count; i += 1) {
    const seed = Math.sin(i * 2245.929) * 10000;
    const x = (i / count) * 1.05 - 0.05 + (seed % 0.03);
    const width = 0.03 + ((seed * 1.3) % 0.05);
    const height = 0.3 + (((seed * 3.7) % 0.7));
    buildings.push({
      x,
      width,
      height,
      lightSeed: Math.abs(seed)
    });
  }
  return buildings;
}

function generateBillboards(): Billboard[] {
  return Array.from({ length: 6 }, (_, index) => {
    const seed = Math.cos(index * 512.42) * 9999;
    return {
      x: 0.1 + ((Math.abs(seed) % 0.8) * 0.8),
      y: 0.1 + (((seed * 0.53) % 0.6) * 0.6),
      width: 0.1 + (((seed * 1.2) % 0.2)),
      height: 0.08 + (((seed * 0.91) % 0.12)),
      rotation: ((seed % Math.PI) / 6)
    };
  });
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function wrapTime(timestamp: number, loopLength: number) {
  return ((timestamp % loopLength) + loopLength) % loopLength;
}

export function CinematicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const buildings = useMemo(() => generateBuildings(45), []);
  const billboards = useMemo(() => generateBillboards(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let start = performance.now();

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const draw = (timestamp: number) => {
      const elapsed = wrapTime(timestamp - start, TOTAL_DURATION);
      const t = elapsed / 1000;
      renderFrame(context, canvas, t, buildings, billboards);
      animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, [billboards, buildings]);

  return <canvas ref={canvasRef} />;
}

type SceneContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  t: number;
  buildings: Building[];
  billboards: Billboard[];
};

function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tSeconds: number,
  buildings: Building[],
  billboards: Billboard[]
) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  const scene: SceneContext = {
    ctx,
    width,
    height,
    t: tSeconds,
    buildings,
    billboards
  };

  drawSkies(scene);
  drawCity(scene);
  drawShockwave(scene);
  drawArena(scene);
  drawPortals(scene);
  drawMonsters(scene);
  drawHero(scene);
  drawEnergyFlows(scene);
  drawForegroundEffects(scene);
}

function drawSkies({ ctx, width, height, t }: SceneContext) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  const baseShift = Math.sin(t * 0.1) * 0.1;
  gradient.addColorStop(0, `rgba(${10 + baseShift * 50}, 10, 60, 1)`);
  gradient.addColorStop(0.5, "rgba(5, 10, 30, 0.95)");
  gradient.addColorStop(1, "rgba(0, 0, 8, 1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Stars / sparks
  for (let i = 0; i < 120; i += 1) {
    const p = (i * 97.77) % 1;
    const x = p * width;
    const y = ((Math.sin(i * 42.12 + t * 0.3) + 1) / 2) * height * 0.5;
    const size = ((Math.cos(i * 12.12 + t) + 1) / 2) * 1.5 + 0.5;
    ctx.fillStyle = `rgba(${150 + (i % 50)}, ${80 + (i % 40)}, 255, ${0.5 + ((Math.sin(t * 2 + i) + 1) / 4)})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCity({ ctx, width, height, t, buildings, billboards }: SceneContext) {
  const baseline = height * 0.68;
  ctx.save();
  ctx.translate(0, baseline);
  ctx.scale(1, 1);

  buildings.forEach((building, index) => {
    const x = building.x * width;
    const w = building.width * width;
    const h = -building.height * height;
    const offset = Math.sin(t * 0.5 + building.lightSeed) * 20;

    const buildingGrad = ctx.createLinearGradient(0, h, 0, 0);
    buildingGrad.addColorStop(0, `rgba(${20 + index * 3}, 10, 60, 0.9)`);
    buildingGrad.addColorStop(0.5, `rgba(${10 + index * 2}, 10, 40, 0.9)`);
    buildingGrad.addColorStop(1, "rgba(10, 8, 30, 0.8)");
    ctx.fillStyle = buildingGrad;
    ctx.fillRect(x, h, w, -h);

    const windowRows = 8;
    const windowCols = Math.max(4, Math.floor(w / 12));
    const flicker = 0.3 + (Math.sin(t * 2 + index) + 1) / 2;

    for (let r = 1; r < windowRows; r += 1) {
      for (let c = 0; c < windowCols; c += 1) {
        const wx = x + 6 + c * (w / windowCols);
        const wy = h + r * ((-h) / windowRows);
        const windowOn = ((r + c + index) % 3) !== 0;
        const intensity = windowOn ? flicker : 0.1;
        ctx.fillStyle = `rgba(${120 + intensity * 80}, ${60 + intensity * 120}, ${20 + intensity * 160}, ${0.4 + intensity * 0.3})`;
        ctx.fillRect(wx, wy, 4, 8 + offset * 0.02);
      }
    }
  });

  // Neon billboards
  billboards.forEach((board, index) => {
    const x = board.x * width;
    const y = -board.y * height * 0.6;
    const w = board.width * width;
    const h = board.height * height;
    ctx.save();
    ctx.translate(x + w / 2, y - h / 2);
    ctx.rotate(board.rotation + Math.sin(t * 0.5 + index) * 0.02);
    const glow = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    glow.addColorStop(0, `rgba(0, ${140 + index * 10}, ${255 - index * 20}, 0.3)`);
    glow.addColorStop(1, `rgba(255, ${60 + index * 20}, ${180 - index * 10}, 0.7)`);
    ctx.fillStyle = glow;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    ctx.lineWidth = 2 + Math.sin(t * 6 + index) * 0.5;
    ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  });

  ctx.restore();
}

function drawShockwave({ ctx, width, height, t }: SceneContext) {
  const shockStart = 5;
  const shockEnd = 11;
  if (t < shockStart) return;
  const localT = clamp((t - shockStart) / (shockEnd - shockStart), 0, 1);
  const eased = easeInOut(localT);
  const radius = lerp(0, Math.max(width, height) * 1.2, eased);
  const centerX = width / 2;
  const centerY = height * 0.65;

  const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.1, centerX, centerY, radius);
  gradient.addColorStop(0, "rgba(255, 220, 120, 0.8)");
  gradient.addColorStop(0.3, "rgba(255, 120, 20, 0.35)");
  gradient.addColorStop(0.6, "rgba(50, 120, 255, 0.25)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawArena({ ctx, width, height, t, billboards }: SceneContext) {
  const arenaStart = 9;
  const arenaEnd = 20;
  if (t < arenaStart) return;
  const localT = clamp((t - arenaStart) / (arenaEnd - arenaStart), 0, 1);
  const pulse = Math.sin(t * 5) * 0.5 + 0.5;

  // Neon floor grid
  const gridOpacity = 0.25 + localT * 0.6;
  ctx.save();
  ctx.globalAlpha = gridOpacity;
  ctx.strokeStyle = `rgba(0, 255, 240, ${0.4 + pulse * 0.2})`;
  ctx.lineWidth = 1.5;
  const floorY = height * 0.72;
  for (let i = 0; i < 20; i += 1) {
    const x = (i / 19) * width;
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(width / 2 + (x - width / 2) * 1.6, height);
    ctx.stroke();
  }
  for (let j = 0; j < 12; j += 1) {
    const y = floorY + (j / 12) * (height - floorY);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + (Math.sin(t + j) * 20));
    ctx.stroke();
  }
  ctx.restore();

  // Fireworks burst arcs
  const bursts = 6;
  for (let i = 0; i < bursts; i += 1) {
    const phase = (t * 0.8 + i) % 1;
    const alpha = 1 - phase;
    const cx = (0.1 + 0.8 * ((i * 97.31) % 1)) * width;
    const cy = height * (0.2 + ((i * 0.17) % 0.4));
    const radius = 80 + phase * 220;
    ctx.strokeStyle = `rgba(255, ${60 + i * 25}, ${200 - i * 20}, ${alpha * (0.6 + pulse * 0.2)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Billboards text highlight
  ctx.save();
  ctx.font = `bold ${Math.max(28, width * 0.03)}px "Bebas Neue", "Oswald", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(255, 80, 180, ${0.6 + localT * 0.4})`;
  ctx.shadowColor = `rgba(0, 255, 220, ${0.7 * (0.4 + pulse * 0.6)})`;
  ctx.shadowBlur = 30 + 40 * pulse;
  ctx.fillText("RONALDO VS THE WORLD", width / 2, height * 0.12);
  ctx.restore();

  // Animated billboard beams
  billboards.forEach((board, index) => {
    const beamProgress = (localT * 1.5 + index * 0.1 + t * 0.2) % 1;
    const x = board.x * width;
    const y = height * (0.4 + board.y * 0.4);
    const w = board.width * width * (0.6 + localT * 0.8);
    const h = board.height * height * (0.6 + localT * 0.7);
    const grad = ctx.createLinearGradient(x, y, x, y - h * 1.8);
    grad.addColorStop(0, "rgba(0, 255, 220, 0)");
    grad.addColorStop(clamp(beamProgress - 0.1, 0, 1), `rgba(0, 255, 220, 0)`);
    grad.addColorStop(clamp(beamProgress, 0, 1), `rgba(255, 80, 220, 0.55)`);
    grad.addColorStop(clamp(beamProgress + 0.05, 0, 1), `rgba(255, 140, 20, 0.2)`);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - w / 2, y - h * 1.8, w, h * 1.8);
  });
}

function drawPortals({ ctx, width, height, t }: SceneContext) {
  const portalStart = 18;
  const portalEnd = 31;
  if (t < portalStart) return;

  const portalDuration = portalEnd - portalStart;
  const local = clamp((t - portalStart) / portalDuration, 0, 1);
  const pulse = Math.sin(t * 4) * 0.5 + 0.5;

  const positions = [
    { x: width * 0.22, y: height * 0.45, hue: 210, label: "MESSI" },
    { x: width * 0.78, y: height * 0.46, hue: 140, label: "NEYMAR" },
    { x: width * 0.35, y: height * 0.25, hue: 280, label: "MBAPPÉ" },
    { x: width * 0.65, y: height * 0.2, hue: 20, label: "HAALAND" }
  ];

  positions.forEach((portal, index) => {
    const appearDelay = index * 0.5;
    const progress = clamp((t - portalStart - appearDelay) / (portalDuration - appearDelay), 0, 1);
    const radius = 90 + progress * 70;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 4 + pulse * 3;
    ctx.strokeStyle = `hsla(${portal.hue}, 90%, ${50 + pulse * 20}%, ${0.5 + progress * 0.4})`;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // inner vortex
    ctx.lineWidth = 2;
    ctx.strokeStyle = `hsla(${portal.hue}, 100%, ${70 + pulse * 10}%, ${0.6})`;
    const swirlCount = 6;
    for (let i = 0; i < swirlCount; i += 1) {
      const angle = (i / swirlCount) * Math.PI * 2 + t * 0.8;
      ctx.beginPath();
      ctx.arc(
        portal.x + Math.cos(angle) * radius * 0.3,
        portal.y + Math.sin(angle) * radius * 0.3,
        radius * 0.4,
        angle,
        angle + Math.PI / 1.6
      );
      ctx.stroke();
    }

    // silhouettes
    ctx.fillStyle = `hsla(${portal.hue}, 100%, ${25 + pulse * 20}%, ${0.6 + progress * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(portal.x, portal.y, 30 + progress * 20, 60 + progress * 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(10, 10, 12, 0.9)";
    ctx.beginPath();
    ctx.arc(portal.x, portal.y - 50 - progress * 10, 14 + progress * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.8})`;
    ctx.font = `600 ${Math.max(16, width * 0.012)}px \"Rajdhani\", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(portal.label, portal.x, portal.y + 90 + progress * 40);
    ctx.restore();
  });
}

function drawMonsters({ ctx, width, height, t }: SceneContext) {
  const monsterStart = 24;
  const monsterEnd = 44;
  if (t < monsterStart) return;

  const monsterPhase = clamp((t - monsterStart) / (monsterEnd - monsterStart), 0, 1);
  const monsters = [
    { x: width * 0.12, y: height * 0.5, scale: 1.2, hue: 190 },
    { x: width * 0.88, y: height * 0.52, scale: 1.1, hue: 310 },
    { x: width * 0.5, y: height * 0.18, scale: 1.5, hue: 40 }
  ];

  monsters.forEach((monster, index) => {
    const appearDelay = index * 0.8;
    const progress = clamp((t - monsterStart - appearDelay) / (monsterEnd - monsterStart), 0, 1);
    const size = 120 * monster.scale * (0.5 + progress * 0.6);

    ctx.save();
    ctx.globalAlpha = 0.6 + progress * 0.4;
    const grad = ctx.createRadialGradient(monster.x, monster.y, size * 0.3, monster.x, monster.y, size);
    grad.addColorStop(0, `hsla(${monster.hue}, 80%, 70%, 0.9)`);
    grad.addColorStop(0.6, `hsla(${monster.hue}, 90%, 40%, 0.7)`);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(monster.x, monster.y, size, size * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armor plates
    ctx.lineWidth = 4;
    ctx.strokeStyle = `hsla(${monster.hue}, 90%, 80%, 0.7)`;
    ctx.beginPath();
    ctx.moveTo(monster.x - size * 0.7, monster.y);
    ctx.quadraticCurveTo(monster.x, monster.y - size * 0.8, monster.x + size * 0.7, monster.y);
    ctx.quadraticCurveTo(monster.x, monster.y + size * 0.8, monster.x - size * 0.7, monster.y);
    ctx.stroke();

    // Eye core
    ctx.fillStyle = `rgba(255, 80, 60, ${0.8 + Math.sin(t * 6 + index) * 0.2})`;
    ctx.beginPath();
    ctx.arc(monster.x, monster.y - size * 0.1, size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Laser beams
    const beamCount = 3;
    for (let i = 0; i < beamCount; i += 1) {
      const offsetAngle = ((i / beamCount) * Math.PI / 4) - Math.PI / 8;
      const beamProgress = (t * 1.4 + i + index) % 1;
      const beamIntensity = 0.4 + monsterPhase * 0.6;
      ctx.strokeStyle = `rgba(255, ${120 + index * 40}, 50, ${beamIntensity})`;
      ctx.lineWidth = 3 + Math.sin(t * 8 + i) * 1.2;
      ctx.beginPath();
      ctx.moveTo(monster.x, monster.y - size * 0.1);
      const beamLength = height * (0.4 + beamProgress * 0.6);
      ctx.lineTo(
        monster.x + Math.cos(offsetAngle + beamProgress * Math.PI) * beamLength,
        monster.y + Math.sin(offsetAngle + beamProgress * Math.PI) * beamLength
      );
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawHero({ ctx, width, height, t }: SceneContext) {
  const heroX = width / 2;
  const heroY = height * 0.65;
  const baseSize = 160;
  const pulse = Math.sin(t * 8) * 0.5 + 0.5;

  // Lightning arcs
  if (t > 28) {
    const sparks = 12;
    ctx.save();
    ctx.globalAlpha = 0.4 + pulse * 0.3;
    for (let i = 0; i < sparks; i += 1) {
      const angle = (i / sparks) * Math.PI * 2 + t * 2;
      const length = baseSize * (0.6 + Math.sin(t * 4 + i) * 0.4);
      ctx.strokeStyle = `rgba(120, 220, 255, ${0.6 + pulse * 0.3})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(heroX, heroY - baseSize * 0.7);
      ctx.lineTo(heroX + Math.cos(angle) * length, heroY - baseSize * 0.7 + Math.sin(angle) * length);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Body glow
  const glowRadius = baseSize * (0.45 + pulse * 0.1);
  const glow = ctx.createRadialGradient(heroX, heroY, glowRadius * 0.2, heroX, heroY, glowRadius);
  glow.addColorStop(0, "rgba(255, 210, 120, 0.9)");
  glow.addColorStop(0.4, "rgba(255, 120, 40, 0.7)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(heroX, heroY, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // Hero silhouette
  ctx.fillStyle = "rgba(15, 20, 30, 0.95)";
  ctx.beginPath();
  ctx.ellipse(heroX, heroY - baseSize * 0.2, baseSize * 0.22, baseSize * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Torso armor highlight
  ctx.fillStyle = `rgba(255, 215, 120, ${0.6 + pulse * 0.4})`;
  ctx.beginPath();
  ctx.moveTo(heroX - baseSize * 0.2, heroY - baseSize * 0.05);
  ctx.quadraticCurveTo(heroX, heroY - baseSize * 0.45, heroX + baseSize * 0.2, heroY - baseSize * 0.05);
  ctx.quadraticCurveTo(heroX, heroY + baseSize * 0.1, heroX - baseSize * 0.2, heroY - baseSize * 0.05);
  ctx.fill();

  // Head
  ctx.fillStyle = "rgba(230, 230, 240, 0.95)";
  ctx.beginPath();
  ctx.arc(heroX, heroY - baseSize * 0.6, baseSize * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Golden ball
  const holdingPhase = t < 5 ? clamp(t / 5, 0, 1) : t < 40 ? 1 : clamp(1 - (t - 40) / 5, 0, 1);
  const ballX = heroX + (t > 5 ? baseSize * 0.9 * Math.sin(clamp((t - 5) / 0.5, 0, 1) * Math.PI) : baseSize * 0.4);
  const ballY = heroY - baseSize * 0.35;
  const ballRadius = baseSize * (0.16 + pulse * 0.02) * holdingPhase;
  if (ballRadius > 0) {
    const ballGradient = ctx.createRadialGradient(ballX, ballY, ballRadius * 0.3, ballX, ballY, ballRadius);
    ballGradient.addColorStop(0, "rgba(255, 220, 140, 1)");
    ballGradient.addColorStop(0.4, "rgba(255, 180, 40, 0.9)");
    ballGradient.addColorStop(1, "rgba(120, 60, 10, 0.05)");
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // energy arcs
    ctx.strokeStyle = `rgba(255, 255, 200, ${0.6 + pulse * 0.3})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 + t * 2;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius * (1.2 + pulse * 0.1), angle, angle + Math.PI / 3);
      ctx.stroke();
    }
  }
}

function drawEnergyFlows({ ctx, width, height, t }: SceneContext) {
  const baseY = height * 0.72;
  const waves = 18;
  for (let i = 0; i < waves; i += 1) {
    const waveT = (t * 0.7 + i * 0.1) % 1;
    const alpha = 0.15 + (1 - waveT) * 0.3;
    ctx.strokeStyle = `rgba(${20 + i * 5}, ${160 + i * 3}, 255, ${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 15) {
      const progress = x / width;
      const y =
        baseY +
        Math.sin(progress * Math.PI * 6 + t * 3 + i) * 20 * (1 - waveT) -
        waveT * 180;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Shock sparks near ground
  for (let i = 0; i < 70; i += 1) {
    const seed = i * 12.92;
    const flicker = (Math.sin(t * 10 + seed) + 1) / 2;
    const x = ((seed * 123.77) % 1) * width;
    const y = baseY + (Math.sin(seed * 0.2 + t * 3) * 25);
    ctx.fillStyle = `rgba(255, ${120 + flicker * 120}, ${40 + flicker * 120}, ${0.2 + flicker * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + flicker * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawForegroundEffects({ ctx, width, height, t }: SceneContext) {
  const finaleStart = 38;
  if (t < finaleStart) return;

  const finaleProgress = clamp((t - finaleStart) / 7, 0, 1);
  const beamAngle = -Math.PI / 6;
  const heroX = width / 2;
  const heroY = height * 0.65;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const beamLength = width * 0.8;
  const grad = ctx.createLinearGradient(heroX, heroY, heroX + Math.cos(beamAngle) * beamLength, heroY + Math.sin(beamAngle) * beamLength);
  grad.addColorStop(0, "rgba(255, 250, 210, 0.8)");
  grad.addColorStop(0.3, "rgba(255, 180, 80, 0.9)");
  grad.addColorStop(0.7, `rgba(80, 140, 255, ${0.7 + finaleProgress * 0.3})`);
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(heroX - 20, heroY - 10);
  ctx.lineTo(heroX + Math.cos(beamAngle) * beamLength, heroY + Math.sin(beamAngle) * beamLength - 80);
  ctx.lineTo(heroX + Math.cos(beamAngle) * beamLength, heroY + Math.sin(beamAngle) * beamLength + 80);
  ctx.lineTo(heroX + 20, heroY + 10);
  ctx.closePath();
  ctx.fill();

  // Impact flash
  const flashPhase = Math.sin(t * 6) * 0.5 + 0.5;
  const impactX = heroX + Math.cos(beamAngle) * beamLength;
  const impactY = heroY + Math.sin(beamAngle) * beamLength;
  const impactRadius = 120 + finaleProgress * 180;
  const impactGradient = ctx.createRadialGradient(impactX, impactY, impactRadius * 0.1, impactX, impactY, impactRadius);
  impactGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 - finaleProgress * 0.2})`);
  impactGradient.addColorStop(0.4, `rgba(255, 200, 120, ${0.6})`);
  impactGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(impactX, impactY, impactRadius, 0, Math.PI * 2);
  ctx.fill();

  // Glass shards
  ctx.globalAlpha = 0.8 - finaleProgress * 0.3;
  for (let i = 0; i < 30; i += 1) {
    const angle = (i / 30) * Math.PI * 2 + t * 2;
    const dist = 60 + finaleProgress * 220 + Math.sin(t * 4 + i) * 30;
    const shardX = impactX + Math.cos(angle) * dist;
    const shardY = impactY + Math.sin(angle) * dist;
    ctx.fillStyle = `rgba(${120 + i * 4}, ${160 + i * 3}, 255, ${0.6})`;
    ctx.beginPath();
    ctx.moveTo(shardX, shardY);
    ctx.lineTo(shardX + Math.cos(angle + 0.3) * 18, shardY + Math.sin(angle + 0.3) * 18);
    ctx.lineTo(shardX + Math.cos(angle - 0.2) * 12, shardY + Math.sin(angle - 0.2) * 12);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
