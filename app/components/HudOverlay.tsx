"use client";

import { useEffect, useMemo, useState } from "react";

const TIMELINE = [
  { time: 0, label: "Times Square Awakens" },
  { time: 5, label: "Shockwave Kick" },
  { time: 12, label: "Arena Transformation" },
  { time: 20, label: "Superhero Allies" },
  { time: 28, label: "Monster Siege" },
  { time: 38, label: "Final Mega Kick" }
];

const TOTAL = 45;

export function HudOverlay() {
  const [elapsed, setElapsed] = useState(0);
  const activeMarker = useMemo(() => {
    let current = TIMELINE[0];
    for (const m of TIMELINE) {
      if (elapsed >= m.time) current = m;
    }
    return current;
  }, [elapsed]);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const loop = (time: number) => {
      const t = ((time - start) % (TOTAL * 1000)) / 1000;
      setElapsed(t);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="hud">
      <div className="hud__title">RONALDO VS THE WORLD</div>
      <div className="hud__subtitle">Ultra-Cinematic Times Square Showdown</div>
      <div className="hud__timeline">
        {TIMELINE.map((marker) => {
          const progress = marker.time / TOTAL;
          const isActive = activeMarker.label === marker.label;
          return (
            <div
              key={marker.label}
              className={`hud__marker ${isActive ? "hud__marker--active" : ""}`}
              style={{ left: `${progress * 100}%` }}
            >
              <span>{marker.label}</span>
            </div>
          );
        })}
        <div className="hud__tracker" style={{ width: `${(elapsed / TOTAL) * 100}%` }} />
      </div>
      <div className="hud__footer">
        <span>Resolution</span>
        <strong>4K Neon Anime Hybrid</strong>
        <span>Runtime</span>
        <strong>≈45 seconds</strong>
      </div>
    </div>
  );
}
