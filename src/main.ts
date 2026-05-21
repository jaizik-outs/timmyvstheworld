import Phaser from "phaser";
import "./style.css";
import { GAME_CONFIG } from "./game/config";
import { PrototypeScene } from "./game/scenes/PrototypeScene";

void startGame();

async function startGame(): Promise<void> {
  if ("fonts" in document) {
    await Promise.allSettled([
      document.fonts.load("900 24px 'DM Sans'"),
      document.fonts.load("700 18px 'DM Sans'"),
    ]);
  }

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: GAME_CONFIG.colors.background,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    pixelArt: true,
    scene: [PrototypeScene],
  });
}
