import { CinematicCanvas } from "./components/CinematicCanvas";
import { HudOverlay } from "./components/HudOverlay";
import "./styles/hud.css";

export default function Page() {
  return (
    <main>
      <CinematicCanvas />
      <HudOverlay />
    </main>
  );
}
