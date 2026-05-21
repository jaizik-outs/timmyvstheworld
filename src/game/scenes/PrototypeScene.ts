import Phaser from "phaser";
import { GAME_CONFIG } from "../config";
import {
  HOST_CHARACTER,
  INTRO_DIALOGUE,
  LEVEL_CLEAR_DIALOGUE_BY_LEVEL,
  LEVEL_PASSED_SCREEN_COPY,
  PARTNER_CAPTURE_LINES,
  PARTNER_CATCH_LINES,
  PITY_RUNWAY_DIALOGUE,
  POWER_PELLET_DIALOGUE_BY_LEVEL,
  POWER_PELLET_RESPAWN_DIALOGUE,
  STARTUP_LIFECYCLE,
  type DialogueLine,
  type PartnerId,
} from "../content/dialogue";
import { MAZE_LAYOUT } from "../content/maze";

type Direction = "up" | "down" | "left" | "right" | "none";

type GridPoint = {
  x: number;
  y: number;
};

type PartnerPixelStyle = "sidePart" | "baldBeard" | "swoop" | "curls";

type PartnerPixelSpec = {
  body: string;
  skin: string;
  hair: string;
  accent: string;
  shirt: string;
  style: PartnerPixelStyle;
};

type GhostMode = "active" | "returning" | "pen";

type LevelConfig = {
  dollarSpacing: number;
  dollarOffset: number;
  requiredDollarRatio: number;
  ghostSpeed: number;
  frightenedGhostSpeed: number;
  chaseSkill: number;
  powerRespawnMs: number;
};

type FloorMotif = "intro" | "seed" | "seriesA" | "growth" | "ipo";

type FloorTheme = {
  base: string;
  alt: string;
  accent: string;
  detail: string;
  shadow: string;
  motif: FloorMotif;
};

type ReviewScreen = "map" | "levelclear" | "gameover" | "won";

type PrototypeSceneData = {
  level?: number;
  score?: number;
  lives?: number;
  hasUsedPityContinue?: boolean;
  hasShownPowerPelletRespawnDialogue?: boolean;
  captureLineDecks?: Partial<Record<PartnerId, string[]>>;
  reviewMode?: boolean;
  reviewScreen?: ReviewScreen;
};

type GhostState = {
  id: PartnerId;
  name: string;
  sprite: Phaser.GameObjects.Sprite;
  startTile: GridPoint;
  tile: GridPoint;
  direction: Direction;
  targetTile: GridPoint | null;
  normalTexture: string;
  frightenedTexture: string;
  returnTexture: string;
  eaten: boolean;
  mode: GhostMode;
  personality: "chaser" | "wanderer";
  releaseAt: number;
  portraitKey: string;
};

type GhostGatePart = {
  sprite: Phaser.GameObjects.Rectangle;
  closedY: number;
};

type DialogueEffect = "normal" | "emphasis" | "wave" | "shake";

type DialogueSegment = {
  text: string;
  effect: DialogueEffect;
  accentVariant: number;
};

type DialogueToken = {
  text: string;
  effect: DialogueEffect;
};

type MusicMode = "silent" | "title" | "loading" | "gameplay" | "pivot" | "result";

type SfxId = "button" | "pellet" | "power" | "partnerCapture" | "caught" | "levelWin" | "gameClear" | "gameOver";

type AudioContextWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

type DialogueWordRun = {
  text: Phaser.GameObjects.Text;
  fullText: string;
  revealStart: number;
  baseX: number;
  baseY: number;
  effect: DialogueEffect;
  index: number;
};

type GameState = "start" | "playing" | "paused" | "levelclear" | "won" | "gameover";
type ResultScreenKind = Exclude<GameState, "start" | "playing" | "paused">;

type DialogueUi = {
  active: boolean;
  lineIndex: number;
  revealedCharacters: number;
  characterCarry: number;
  container: Phaser.GameObjects.Container;
  panel: Phaser.GameObjects.Rectangle;
  portraitFrame: Phaser.GameObjects.Rectangle;
  portrait: Phaser.GameObjects.Image;
  speaker: Phaser.GameObjects.Text;
  bodyContainer: Phaser.GameObjects.Container;
  bodyRuns: DialogueWordRun[];
  plainText: string;
  bodyOrigin: GridPoint;
  bodyWidth: number;
  advanceGlyph: Phaser.GameObjects.Triangle;
};

type EndMenuUi = {
  container: Phaser.GameObjects.Container;
  art: Phaser.GameObjects.Container;
  title: Phaser.GameObjects.Text;
  subtitle: Phaser.GameObjects.Text;
  stats: Phaser.GameObjects.Text;
  continueButton: Phaser.GameObjects.Container;
  nextButton: Phaser.GameObjects.Container;
  restartButton: Phaser.GameObjects.Container;
};

type StartMenuUi = {
  container: Phaser.GameObjects.Container;
  startButton: Phaser.GameObjects.Container;
};

type PauseMenuUi = {
  container: Phaser.GameObjects.Container;
  resumeButton: Phaser.GameObjects.Container;
};

type OutsidersDebugState = {
  score: number;
  dollarScore: number;
  lives: number;
  currentLevel: number;
  playerTile: GridPoint;
  currentDirection: Direction;
  queuedDirection: Direction;
  remainingCollectibles: number;
  scoreTarget: number;
  gameState: GameState;
  dialogueActive: boolean;
  powerModeRemainingMs: number;
  ghosts: Array<{
    name: string;
    tile: GridPoint;
    eaten: boolean;
    mode: GhostMode;
  }>;
};

declare global {
  interface Window {
    __OUTSIDERS_DEBUG__?: () => OutsidersDebugState;
  }
}

const DIRECTION_VECTORS: Record<Direction, GridPoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  none: { x: 0, y: 0 },
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
  none: "none",
};

const DIALOGUE_LINE_HEIGHT = 29;
const DIALOGUE_MAX_BODY_LINES = 3;
const DIALOGUE_PAGE_WIDTH_PADDING = 32;
const DIALOGUE_SPACE_WIDTH = 8;

const LEVEL_CONFIGS: LevelConfig[] = [
  {
    dollarSpacing: 5,
    dollarOffset: 0,
    requiredDollarRatio: 0.55,
    ghostSpeed: 92,
    frightenedGhostSpeed: 72,
    chaseSkill: 0.62,
    powerRespawnMs: 4500,
  },
  {
    dollarSpacing: 7,
    dollarOffset: 0,
    requiredDollarRatio: 0.65,
    ghostSpeed: 100,
    frightenedGhostSpeed: 76,
    chaseSkill: 0.74,
    powerRespawnMs: 5000,
  },
  {
    dollarSpacing: 8,
    dollarOffset: 0,
    requiredDollarRatio: 0.78,
    ghostSpeed: 110,
    frightenedGhostSpeed: 80,
    chaseSkill: 0.84,
    powerRespawnMs: 5600,
  },
  {
    dollarSpacing: 6,
    dollarOffset: 2,
    requiredDollarRatio: 0.9,
    ghostSpeed: 120,
    frightenedGhostSpeed: 84,
    chaseSkill: 0.94,
    powerRespawnMs: 6200,
  },
  {
    dollarSpacing: 6,
    dollarOffset: 0,
    requiredDollarRatio: 1,
    ghostSpeed: 132,
    frightenedGhostSpeed: 88,
    chaseSkill: 1,
    powerRespawnMs: 7000,
  },
];

const FLOOR_THEMES: FloorTheme[] = [
  {
    base: "#102037",
    alt: "#142843",
    accent: "#6f86ff",
    detail: "#d7e7ff",
    shadow: "#091423",
    motif: "intro",
  },
  {
    base: "#18243a",
    alt: "#1c2c46",
    accent: "#ffd166",
    detail: "#f7ead0",
    shadow: "#0c1524",
    motif: "seed",
  },
  {
    base: "#102437",
    alt: "#123047",
    accent: "#71e8b5",
    detail: "#a8d8ff",
    shadow: "#071421",
    motif: "seriesA",
  },
  {
    base: "#182033",
    alt: "#202a40",
    accent: "#ff9f6e",
    detail: "#cdd7ff",
    shadow: "#0b1020",
    motif: "growth",
  },
  {
    base: "#151923",
    alt: "#1d2430",
    accent: "#46e07d",
    detail: "#f05252",
    shadow: "#080b12",
    motif: "ipo",
  },
];

const HUD_STAGE_NAMES = ["PRE-SEED", "SEED", "SERIES A", "SERIES B", "SERIES C"] as const;
const COLLECTIBLE_TEXTURES = [
  "collectible-penny",
  "collectible-dollar",
  "collectible-bitcoin",
  "collectible-gold",
  "collectible-money-bag",
] as const;

const PARTNER_GHOSTS: Array<{
  id: PartnerId;
  name: string;
  texture: string;
  portraitKey: string;
  direction: Direction;
  personality: "chaser" | "wanderer";
  pixel: PartnerPixelSpec;
}> = [
  {
    id: "austin",
    name: "Austin",
    texture: "ghost-austin",
    portraitKey: "portrait-austin",
    direction: "left",
    personality: "chaser",
    pixel: {
      body: GAME_CONFIG.colors.wall,
      skin: "#efb489",
      hair: "#7b3f24",
      accent: "#b86537",
      shirt: "#9eb1c7",
      style: "baldBeard",
    },
  },
  {
    id: "teddy",
    name: "Teddy",
    texture: "ghost-teddy",
    portraitKey: "portrait-teddy",
    direction: "right",
    personality: "wanderer",
    pixel: {
      body: GAME_CONFIG.colors.ghostOne,
      skin: "#edbd95",
      hair: "#2f2119",
      accent: "#7a4f38",
      shirt: "#111111",
      style: "sidePart",
    },
  },
  {
    id: "george",
    name: "George",
    texture: "ghost-george",
    portraitKey: "portrait-george",
    direction: "up",
    personality: "chaser",
    pixel: {
      body: GAME_CONFIG.colors.wallInset,
      skin: "#d99e77",
      hair: "#121212",
      accent: "#ffffff",
      shirt: "#111111",
      style: "swoop",
    },
  },
  {
    id: "kira",
    name: "Kira",
    texture: "ghost-kira",
    portraitKey: "portrait-kira",
    direction: "down",
    personality: "wanderer",
    pixel: {
      body: GAME_CONFIG.colors.powerPellet,
      skin: "#e5b297",
      hair: "#3b2b22",
      accent: "#d8a56c",
      shirt: "#111111",
      style: "curls",
    },
  },
];

export class PrototypeScene extends Phaser.Scene {
  private static sharedAudioContext?: AudioContext;
  private static sharedMuted = false;

  private readonly tileSize = GAME_CONFIG.tileSize;
  private readonly boardWidth = MAZE_LAYOUT[0].length * GAME_CONFIG.tileSize;
  private readonly boardHeight = MAZE_LAYOUT.length * GAME_CONFIG.tileSize;
  private readonly boardOffsetX = Math.floor((GAME_CONFIG.width - this.boardWidth) / 2);
  private readonly boardOffsetY = GAME_CONFIG.hudHeight;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"w" | "a" | "s" | "d" | "c" | "m" | "p" | "escape" | "enter" | "space", Phaser.Input.Keyboard.Key>;

  private walls = new Set<string>();
  private playerBlockedTiles = new Set<string>();
  private pellets = new Map<string, Phaser.GameObjects.Image>();
  private powerPellets = new Map<string, Phaser.GameObjects.Image>();
  private powerPelletSpawnTiles: GridPoint[] = [];
  private pendingPowerPelletRespawn: Phaser.Time.TimerEvent | null = null;
  private pendingPowerPelletRespawnDialogue: Phaser.Time.TimerEvent | null = null;
  private ghostGateParts: GhostGatePart[] = [];
  private ghostGateOpen = false;
  private reviewMode = false;
  private reviewScreen: ReviewScreen = "map";
  private reviewHintText?: Phaser.GameObjects.Text;

  private player!: Phaser.GameObjects.Sprite;
  private playerStartTile: GridPoint = { x: 1, y: 1 };
  private playerTile: GridPoint = { x: 1, y: 1 };
  private playerTargetTile: GridPoint | null = null;
  private currentDirection: Direction = "none";
  private queuedDirection: Direction = "none";

  private ghosts: GhostState[] = [];
  private score = 0;
  private dollarScore = 0;
  private lives: number = GAME_CONFIG.startingLives;
  private currentLevel = 1;
  private remainingDollarBills = 0;
  private dollarScoreTarget = 0;
  private powerModeEndsAt = 0;
  private lifeCooldownEndsAt = 0;
  private gameState: GameState = "playing";

  private titleText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private tractionText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private dialogue!: DialogueUi;
  private endMenu!: EndMenuUi;
  private startMenu!: StartMenuUi;
  private pauseMenu!: PauseMenuUi;
  private pauseButton!: Phaser.GameObjects.Container;
  private muteButton!: Phaser.GameObjects.Container;
  private muteButtonText!: Phaser.GameObjects.Text;
  private dialogueOnClose?: () => void;
  private hasShownPowerPelletDialogue = false;
  private hasShownPowerPelletRespawnDialogue = false;
  private hasShownClearDialogue = false;
  private shownCaptureDialogueKeys = new Set<string>();
  private captureLineDecks!: Record<PartnerId, string[]>;
  private hasUsedPityContinue = false;
  private startTransitionActive = false;
  private pauseStartedAt = 0;
  private audioContext?: AudioContext;
  private masterGain?: GainNode;
  private musicGain?: GainNode;
  private sfxGain?: GainNode;
  private padGain?: GainNode;
  private padOscillators: OscillatorNode[] = [];
  private musicTimer?: Phaser.Time.TimerEvent;
  private requestedMusicMode: MusicMode = "silent";
  private currentMusicMode: MusicMode = "silent";
  private musicStep = 0;
  private lastPelletSfxAt = 0;
  private lastDialogueVoiceAt = 0;
  private dialogueVoiceStep = 0;

  constructor() {
    super("PrototypeScene");
  }

  private getReviewParams(): { enabled: boolean; level?: number; screen: ReviewScreen } {
    if (typeof window === "undefined") {
      return { enabled: false, screen: "map" };
    }

    const params = new URLSearchParams(window.location.search);
    const enabled = params.get("review") === "1" || params.get("review") === "true";
    const levelParam = Number(params.get("level"));
    const rawScreen = params.get("screen");
    const screen: ReviewScreen =
      rawScreen === "levelclear" || rawScreen === "gameover" || rawScreen === "won" ? rawScreen : "map";

    return {
      enabled,
      level: Number.isFinite(levelParam) ? levelParam : undefined,
      screen,
    };
  }

  init(data: PrototypeSceneData = {}): void {
    const reviewParams = this.getReviewParams();
    this.walls = new Set<string>();
    this.playerBlockedTiles = new Set<string>();
    this.pellets = new Map<string, Phaser.GameObjects.Image>();
    this.powerPellets = new Map<string, Phaser.GameObjects.Image>();
    this.powerPelletSpawnTiles = [];
    this.pendingPowerPelletRespawn = null;
    this.pendingPowerPelletRespawnDialogue = null;
    this.ghostGateParts = [];
    this.ghostGateOpen = false;
    this.reviewMode = data.reviewMode ?? reviewParams.enabled;
    this.reviewScreen = data.reviewScreen ?? reviewParams.screen;
    this.reviewHintText = undefined;
    this.ghosts = [];

    this.playerStartTile = { x: 1, y: 1 };
    this.playerTile = { x: 1, y: 1 };
    this.playerTargetTile = null;
    this.currentDirection = "none";
    this.queuedDirection = "none";

    this.score = data.score ?? 0;
    this.dollarScore = 0;
    this.lives = data.lives ?? GAME_CONFIG.startingLives;
    this.currentLevel = Phaser.Math.Clamp(data.level ?? reviewParams.level ?? 1, 1, LEVEL_CONFIGS.length);
    this.remainingDollarBills = 0;
    this.dollarScoreTarget = 0;
    this.powerModeEndsAt = 0;
    this.lifeCooldownEndsAt = 0;
    this.gameState = "playing";

    this.dialogueOnClose = undefined;
    this.hasShownPowerPelletDialogue = false;
    this.hasShownPowerPelletRespawnDialogue = data.hasShownPowerPelletRespawnDialogue ?? false;
    this.hasShownClearDialogue = false;
    this.shownCaptureDialogueKeys = new Set<string>();
    this.captureLineDecks = this.createCaptureLineDecks(data.captureLineDecks);
    this.hasUsedPityContinue = data.hasUsedPityContinue ?? false;
    this.pauseStartedAt = 0;
  }

  preload(): void {
    this.load.svg("outsiders-logo", "/assets/outsiders-logo.svg", { width: 432, height: 75 });
  }

  create(): void {
    this.createTextures();
    this.createInput();
    this.drawBackdrop();
    this.buildMaze();
    this.createActors();
    this.createHud();
    this.createDialogueUi();
    this.createStartMenuUi();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopAllAudio();
    });
    if (this.reviewMode) {
      this.createReviewControls();
      this.applyReviewScreen();
      this.exposeDebugState();
      return;
    }

    if (this.shouldShowStartScreen()) {
      this.showStartScreen();
      this.exposeDebugState();
      return;
    }

    this.startLevelIntro();
    this.exposeDebugState();
  }

  private shouldShowStartScreen(): boolean {
    return this.currentLevel === 1 && this.score === 0 && this.lives === GAME_CONFIG.startingLives;
  }

  private showStartScreen(): void {
    this.gameState = "start";
    this.setMusicMode("title");
    this.startMenu.container.setVisible(true);
    this.setMenuButtonVisible(this.startMenu.startButton, true);
    this.dialogue.container.setVisible(false);
    this.overlayText.setVisible(false);
    this.hideEndMenu();
    this.closeGhostGate();
    this.syncHudControls();
  }

  private startGame(): void {
    if (this.gameState !== "start" || this.startTransitionActive) {
      return;
    }

    this.startTransitionActive = true;
    this.setMenuButtonVisible(this.startMenu.startButton, false);
    this.setMusicMode("loading");
    this.playStartTransition(() => {
      this.startMenu.container.setVisible(false);
      this.startTransitionActive = false;
      this.startLevelIntro();
    });
  }

  private playStartTransition(onCovered: () => void): void {
    const overlay = this.add.container(0, 0).setDepth(140);
    const black = this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      this.hex("#02050a"),
      0,
    );
    overlay.add(black);

    const barColors = ["#07101f", "#162a48", GAME_CONFIG.colors.logoBlue, "#0b1d35"];
    for (let i = 0; i < 14; i += 1) {
      const direction = i % 2 === 0 ? -1 : 1;
      const bar = this.add.rectangle(
        GAME_CONFIG.width / 2 + direction * (GAME_CONFIG.width + 180),
        32 + i * 50,
        GAME_CONFIG.width + 220,
        42 + (i % 3) * 5,
        this.hex(barColors[i % barColors.length]),
        0.9,
      );
      overlay.add(bar);
      this.tweens.add({
        targets: bar,
        x: GAME_CONFIG.width / 2,
        duration: 430,
        delay: i * 24,
        ease: "cubic.out",
      });
    }

    for (let i = 0; i < 7; i += 1) {
      const direction = i % 2 === 0 ? 1 : -1;
      const streak = this.add.rectangle(
        GAME_CONFIG.width / 2 - direction * (GAME_CONFIG.width + 120),
        106 + i * 78,
        180 + i * 18,
        4,
        this.hex(GAME_CONFIG.colors.hudText),
        0.22,
      );
      overlay.add(streak);
      this.tweens.add({
        targets: streak,
        x: GAME_CONFIG.width / 2 + direction * (GAME_CONFIG.width + 120),
        duration: 520,
        delay: 60 + i * 38,
        ease: "quad.inOut",
      });
    }

    const flash = this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      this.hex(GAME_CONFIG.colors.hudText),
      0,
    );
    overlay.add(flash);

    this.tweens.add({
      targets: black,
      alpha: 0.96,
      duration: 320,
      delay: 470,
      ease: "sine.inOut",
      onComplete: () => {
        onCovered();
        this.tweens.add({
          targets: flash,
          alpha: 0.18,
          duration: 90,
          yoyo: true,
          ease: "sine.out",
        });
        this.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 520,
          delay: 150,
          ease: "sine.inOut",
          onComplete: () => {
            overlay.destroy(true);
          },
        });
      },
    });
  }

  private startLevelIntro(): void {
    this.gameState = "playing";
    this.setMusicMode("gameplay");
    this.syncHudControls();
    this.showDialogue(this.getLevelIntroDialogue(), () => {
      this.openGhostGateAndRelease();
    });
  }

  private get levelConfig(): LevelConfig {
    return LEVEL_CONFIGS[this.currentLevel - 1] ?? LEVEL_CONFIGS[0];
  }

  private getLevelIntroDialogue(): DialogueLine[] {
    if (this.currentLevel === 1) {
      return INTRO_DIALOGUE;
    }

    const stage = STARTUP_LIFECYCLE[this.currentLevel - 1];
    const requirement = Math.round(this.levelConfig.requiredDollarRatio * 100);
    return [
      {
        speaker: HOST_CHARACTER.name,
        portraitKey: HOST_CHARACTER.portraitKey,
        text: `Level ${this.currentLevel}: [em]${stage.title}[/em]. ${stage.premise}`,
      },
      {
        speaker: HOST_CHARACTER.name,
        portraitKey: HOST_CHARACTER.portraitKey,
        text:
          this.currentLevel === LEVEL_CONFIGS.length
            ? "This is the final market. Every dollar matters now: collect [shake]100%[/shake] of the traction on the map."
            : `The dollars are scarcer, and Timmy only needs [em]${requirement}%[/em] of available traction to advance. Totally normal fundraising math.`,
      },
    ];
  }

  private getLevelClearDialogue(): DialogueLine[] {
    return LEVEL_CLEAR_DIALOGUE_BY_LEVEL[this.currentLevel - 1] ?? LEVEL_CLEAR_DIALOGUE_BY_LEVEL[0];
  }

  update(time: number, delta: number): void {
    this.handleGlobalInput();
    this.syncHudControls();

    if (this.gameState === "paused") {
      this.handlePauseInput();
      this.syncDebugState();
      return;
    }

    if (this.dialogue.active) {
      this.updateDialogue(delta);
      this.handleDialogueInput();
      this.syncDebugState();
      return;
    }

    if (this.gameState === "start") {
      this.handleStartInput();
      this.syncDebugState();
      return;
    }

    if (this.gameState !== "playing") {
      this.handleRestartInput();
      this.syncDebugState();
      return;
    }

    this.handleMovementInput();
    if (this.handlePauseInput()) {
      this.syncDebugState();
      return;
    }
    this.syncGameplayMusic(time);
    this.updatePowerMode(time);
    this.movePlayer(delta);
    this.moveGhosts(delta, time);
    this.checkGhostCollisions(time);
    this.updateHud();
    this.syncDebugState();
  }

  private createInput(): void {
    if (!this.input.keyboard) {
      throw new Error("Keyboard input is required for this prototype.");
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      c: Phaser.Input.Keyboard.KeyCodes.C,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as Record<"w" | "a" | "s" | "d" | "c" | "m" | "p" | "escape" | "enter" | "space", Phaser.Input.Keyboard.Key>;

    this.input.keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, () => {
      this.unlockAudio();
    });

    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.unlockAudio();
      if (this.dialogue?.active) {
        this.advanceDialogue();
      }
    });

    if (this.reviewMode) {
      this.bindReviewShortcuts();
    }
  }

  private ensureAudioGraph(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    if (this.audioContext && this.masterGain && this.musicGain && this.sfxGain) {
      return true;
    }

    const audioWindow = window as AudioContextWindow;
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) {
      return false;
    }

    const context = PrototypeScene.sharedAudioContext ?? new AudioContextConstructor();
    PrototypeScene.sharedAudioContext = context;
    this.audioContext = context;
    this.masterGain = context.createGain();
    this.musicGain = context.createGain();
    this.sfxGain = context.createGain();

    this.masterGain.gain.value = PrototypeScene.sharedMuted ? 0 : GAME_CONFIG.audio.masterVolume;
    this.musicGain.gain.value = GAME_CONFIG.audio.musicVolume;
    this.sfxGain.gain.value = GAME_CONFIG.audio.sfxVolume;

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(context.destination);
    return true;
  }

  private unlockAudio(): void {
    if (!this.ensureAudioGraph() || !this.audioContext) {
      return;
    }

    const beginMusic = (): void => {
      if (this.currentMusicMode !== this.requestedMusicMode) {
        this.startMusicMode(this.requestedMusicMode);
      }
    };

    if (this.audioContext.state === "running") {
      beginMusic();
      return;
    }

    void this.audioContext.resume().then(beginMusic).catch(() => undefined);
  }

  private audioReady(): boolean {
    return Boolean(
      this.audioContext?.state === "running" &&
        this.masterGain &&
        this.musicGain &&
        this.sfxGain,
    );
  }

  private setMusicMode(mode: MusicMode): void {
    this.requestedMusicMode = mode;
    if (this.audioReady()) {
      this.startMusicMode(mode);
      return;
    }

    if (PrototypeScene.sharedAudioContext?.state === "running") {
      this.unlockAudio();
    }
  }

  private syncGameplayMusic(time: number): void {
    this.setMusicMode(this.isPowerModeActive(time) ? "pivot" : "gameplay");
  }

  private startMusicMode(mode: MusicMode): void {
    if (!this.audioReady() || this.currentMusicMode === mode) {
      return;
    }

    this.stopMusicLoop();
    this.currentMusicMode = mode;
    this.musicStep = 0;

    if (mode === "silent") {
      return;
    }

    this.startPadForMode(mode);
    this.musicTimer = this.time.addEvent({
      delay: this.musicDelayForMode(mode),
      loop: true,
      callback: () => {
        this.playMusicStep();
      },
    });
    this.playMusicStep();
  }

  private musicDelayForMode(mode: MusicMode): number {
    const delays: Record<MusicMode, number> = {
      silent: 1000,
      title: 360,
      loading: 135,
      gameplay: 220,
      pivot: 145,
      result: 520,
    };
    return delays[mode];
  }

  private startPadForMode(mode: MusicMode): void {
    if (!this.audioReady() || !this.audioContext || !this.musicGain || mode === "pivot" || mode === "silent") {
      return;
    }

    const padByMode: Record<Exclude<MusicMode, "silent" | "pivot">, { notes: number[]; volume: number }> = {
      title: { notes: [146.83, 220, 293.66], volume: 0.018 },
      loading: { notes: [196, 246.94, 293.66], volume: 0.014 },
      gameplay: { notes: [130.81, 196, 261.63], volume: 0.015 },
      result: { notes: [164.81, 246.94, 329.63], volume: 0.014 },
    };
    const pad = padByMode[mode];
    if (!pad) {
      return;
    }

    const now = this.audioContext.currentTime;
    this.padGain = this.audioContext.createGain();
    this.padGain.gain.setValueAtTime(0.0001, now);
    this.padGain.gain.exponentialRampToValueAtTime(pad.volume, now + 0.45);
    this.padGain.connect(this.musicGain);

    pad.notes.forEach((frequency) => {
      const oscillator = this.audioContext!.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.connect(this.padGain!);
      oscillator.start(now);
      this.padOscillators.push(oscillator);
    });
  }

  private playMusicStep(): void {
    if (!this.audioReady()) {
      return;
    }

    const step = this.musicStep;
    this.musicStep += 1;

    if (this.currentMusicMode === "title") {
      const melody = [293.66, 369.99, 440, 493.88, 440, 369.99, 329.63, 246.94];
      this.playTone(melody[step % melody.length], 190, "triangle", 0.056, "music");
      if (step % 4 === 0) {
        this.playTone([146.83, 164.81, 196, 164.81][Math.floor(step / 4) % 4], 420, "sine", 0.052, "music");
      }
      if (step % 8 === 6) {
        this.playTone([587.33, 493.88, 440][Math.floor(step / 8) % 3], 240, "sine", 0.026, "music");
      }
      return;
    }

    if (this.currentMusicMode === "loading") {
      const lift = [196, 246.94, 293.66, 392, 493.88, 587.33, 659.25, 783.99];
      this.playTone(lift[step % lift.length], 92, "triangle", 0.046, "music");
      if (step % 4 === 0) {
        this.playTone([98, 123.47, 146.83, 196][Math.floor(step / 4) % 4], 210, "sine", 0.04, "music");
      }
      return;
    }

    if (this.currentMusicMode === "gameplay") {
      const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
      if (step % 2 === 0) {
        this.playTone(melody[(step / 2) % melody.length], 135, "triangle", 0.04, "music");
      }
      if (step % 4 === 0) {
        this.playTone([130.81, 146.83, 164.81, 196][Math.floor(step / 8) % 4], 260, "sine", 0.046, "music");
      }
      if (step % 8 === 5) {
        this.playTone([523.25, 493.88, 440, 392][Math.floor(step / 8) % 4], 90, "square", 0.018, "music");
      }
      return;
    }

    if (this.currentMusicMode === "pivot") {
      const melody = [392, 523.25, 659.25, 784, 739.99, 659.25, 523.25, 466.16];
      this.playTone(melody[step % melody.length], 88, "square", 0.033, "music");
      if (step % 4 === 0) {
        this.playTone([196, 233.08, 261.63, 293.66][Math.floor(step / 4) % 4], 170, "triangle", 0.034, "music");
      }
      return;
    }

    if (this.currentMusicMode === "result") {
      const melody = [329.63, 392, 493.88, 392];
      this.playTone(melody[step % melody.length], 210, "triangle", 0.033, "music");
    }
  }

  private playSfx(id: SfxId): void {
    this.unlockAudio();
    if (!this.audioReady()) {
      return;
    }

    const play = (frequency: number, durationMs: number, delayMs = 0, volume = 0.12, type: OscillatorType = "square"): void => {
      this.playTone(frequency, durationMs, type, volume, "sfx", delayMs / 1000);
    };

    if (id === "button") {
      play(392, 55, 0, 0.075, "triangle");
      play(587.33, 70, 55, 0.075, "triangle");
      return;
    }

    if (id === "pellet") {
      if (this.time.now - this.lastPelletSfxAt < 70) {
        return;
      }
      this.lastPelletSfxAt = this.time.now;
      play(880, 32, 0, 0.035, "square");
      return;
    }

    if (id === "power") {
      [440, 554.37, 659.25, 880].forEach((frequency, index) => play(frequency, 80, index * 45, 0.09, "triangle"));
      return;
    }

    if (id === "partnerCapture") {
      play(784, 70, 0, 0.1, "triangle");
      play(1046.5, 90, 68, 0.105, "triangle");
      play(1567.98, 110, 138, 0.08, "sine");
      return;
    }

    if (id === "caught") {
      [246.94, 185, 138.59].forEach((frequency, index) => play(frequency, 150, index * 90, 0.11, "sawtooth"));
      return;
    }

    if (id === "levelWin") {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => play(frequency, 130, index * 88, 0.1, "triangle"));
      return;
    }

    if (id === "gameClear") {
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((frequency, index) => play(frequency, 145, index * 95, 0.11, "triangle"));
      return;
    }

    [196, 146.83, 110].forEach((frequency, index) => play(frequency, 240, index * 130, 0.12, "sawtooth"));
  }

  private maybePlayDialogueVoice(line: DialogueLine, previousReveal: number, currentReveal: number): void {
    if (!this.audioReady()) {
      return;
    }

    const revealedText = this.dialogue.plainText.slice(previousReveal, currentReveal);
    if (!/[a-z0-9]/i.test(revealedText)) {
      return;
    }

    const now = this.time.now;
    if (now - this.lastDialogueVoiceAt < 48) {
      return;
    }

    this.lastDialogueVoiceAt = now;
    const voice = this.dialogueVoiceForSpeaker(line.speaker);
    const frequency = voice.notes[this.dialogueVoiceStep % voice.notes.length];
    const punctuationSoftener = /[.!?]/.test(revealedText) ? 0.65 : 1;
    this.dialogueVoiceStep += 1;
    this.playTone(frequency, voice.durationMs, voice.type, voice.volume * punctuationSoftener, "sfx");
  }

  private dialogueVoiceForSpeaker(speaker: string): {
    notes: number[];
    durationMs: number;
    volume: number;
    type: OscillatorType;
  } {
    const normalized = speaker.toLowerCase();
    if (normalized.includes("timmy")) {
      return { notes: [415.3, 466.16, 523.25, 466.16, 392], durationMs: 34, volume: 0.026, type: "triangle" };
    }

    if (normalized.includes("austin")) {
      return { notes: [174.61, 196, 220, 196], durationMs: 34, volume: 0.029, type: "square" };
    }

    if (normalized.includes("teddy")) {
      return { notes: [246.94, 261.63, 293.66, 246.94], durationMs: 30, volume: 0.025, type: "triangle" };
    }

    if (normalized.includes("george")) {
      return { notes: [207.65, 233.08, 261.63, 233.08], durationMs: 32, volume: 0.027, type: "square" };
    }

    if (normalized.includes("kira")) {
      return { notes: [329.63, 349.23, 392, 349.23], durationMs: 31, volume: 0.024, type: "triangle" };
    }

    return { notes: [261.63, 293.66, 329.63, 293.66], durationMs: 32, volume: 0.024, type: "triangle" };
  }

  private playTone(
    frequency: number,
    durationMs: number,
    type: OscillatorType,
    volume: number,
    output: "music" | "sfx",
    delaySeconds = 0,
  ): void {
    if (!this.audioReady() || !this.audioContext || !this.musicGain || !this.sfxGain) {
      return;
    }

    const destination = output === "music" ? this.musicGain : this.sfxGain;
    const now = this.audioContext.currentTime + delaySeconds;
    const duration = durationMs / 1000;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
    oscillator.onended = () => {
      gain.disconnect();
      oscillator.disconnect();
    };
  }

  private stopMusicLoop(): void {
    this.musicTimer?.remove(false);
    this.musicTimer = undefined;
    this.stopPad();
  }

  private stopPad(): void {
    if (!this.audioContext) {
      this.padOscillators = [];
      this.padGain = undefined;
      return;
    }

    const stopAt = this.audioContext.currentTime + 0.08;
    if (this.padGain) {
      this.padGain.gain.cancelScheduledValues(this.audioContext.currentTime);
      this.padGain.gain.setTargetAtTime(0.0001, this.audioContext.currentTime, 0.04);
    }

    this.padOscillators.forEach((oscillator) => {
      try {
        oscillator.stop(stopAt);
      } catch {
        // Oscillators can only be stopped once.
      }
    });
    this.padOscillators = [];
    this.padGain = undefined;
  }

  private stopAllAudio(): void {
    this.stopMusicLoop();
    [this.masterGain, this.musicGain, this.sfxGain].forEach((gain) => {
      try {
        gain?.disconnect();
      } catch {
        // Audio nodes may already be disconnected during a scene restart.
      }
    });
    this.masterGain = undefined;
    this.musicGain = undefined;
    this.sfxGain = undefined;
    this.padGain = undefined;
    this.currentMusicMode = "silent";
  }

  private bindReviewShortcuts(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    [
      ["ONE", 1],
      ["TWO", 2],
      ["THREE", 3],
      ["FOUR", 4],
      ["FIVE", 5],
    ].forEach(([keyName, level]) => {
      keyboard.on(`keydown-${keyName}`, () => {
        this.restartReview(level as number, "map");
      });
    });

    keyboard.on("keydown-M", () => {
      this.showReviewScreen("map");
    });
    keyboard.on("keydown-L", () => {
      this.showReviewScreen("levelclear");
    });
    keyboard.on("keydown-O", () => {
      this.showReviewScreen("won");
    });
    keyboard.on("keydown-X", () => {
      this.showReviewScreen("gameover");
    });
  }

  private createTextures(): void {
    this.makePlayerTexture();
    this.makeTitleTimmyTexture();
    PARTNER_GHOSTS.forEach((partner) => {
      this.makePartnerGhostTexture(partner.texture, partner.pixel);
      this.makePartnerFrightenedGhostTexture(`${partner.texture}-frightened`, partner.pixel);
      this.makePartnerReturnTexture(`${partner.texture}-returning`, partner.pixel);
      this.makePartnerPortraitTexture(partner.portraitKey, partner.pixel);
    });
    this.makeCollectibleTextures();
    this.makePowerPelletTexture();
    this.makeJonnyPortraitTexture();
    this.makeTimmyPortraitTexture();
    this.makePortraitTexture();
  }

  private makePlayerTexture(): void {
    if (this.textures.exists("player")) {
      return;
    }

    const palette = {
      H: "#21140f",
      h: "#4b2c1c",
      S: "#efb58e",
      s: "#c98a68",
      E: "#2a1a12",
      T: "#f4efe5",
      R: "#b1040e",
      r: GAME_CONFIG.colors.player,
      W: GAME_CONFIG.colors.pellet,
      B: GAME_CONFIG.colors.logoBlue,
      D: "#101010",
    };

    this.makePixelTexture(
      "player",
      [
        " HHHHH   ",
        "HHSSSHH  ",
        "HSESESH  ",
        "HSSTSSH  ",
        " HSSS    ",
        " RRRRR   ",
        "RWRRWR   ",
        " D   D   ",
        " D   D   ",
      ],
      palette,
      3,
    );

    this.makePixelTexture(
      "player-right",
      [
        "  HHHH   ",
        " HHSSSH  ",
        " HSESSH  ",
        " HSSTT   ",
        "  SSS    ",
        " RRRRRB  ",
        " RRWRB   ",
        "  D D    ",
        "  D D    ",
      ],
      palette,
      3,
    );

    this.makePixelTexture(
      "player-left",
      [
        "   HHHH  ",
        "  HSSSHH ",
        "  HSSESH ",
        "   TTSSH ",
        "    SSS  ",
        "  BRRRRR ",
        "   BRWRR ",
        "    D D  ",
        "    D D  ",
      ],
      palette,
      3,
    );

    this.makePixelTexture(
      "player-up",
      [
        "  HHHHH  ",
        " HHHHHHH ",
        " HHHHHHH ",
        "  HHHHH  ",
        "  SSSSS  ",
        "  RRRRR  ",
        " RWRRWR  ",
        "  D   D  ",
        "  D   D  ",
      ],
      palette,
      3,
    );

    this.makePixelTexture(
      "player-down",
      [
        " HHHHH   ",
        "HHSSSHH  ",
        "HSESESH  ",
        "HSSTSSH  ",
        " HSSS    ",
        " RRRRR   ",
        "RWRRWR   ",
        " D   D   ",
        " D   D   ",
      ],
      palette,
      3,
    );
  }

  private makeTitleTimmyTexture(): void {
    if (this.textures.exists("player-title")) {
      return;
    }

    this.makePixelTexture(
      "player-title",
      [
        "      OOOO        ",
        "    OHHHHHOO      ",
        "   OHHHHHHHOO     ",
        "  OHHHSSSSSHO     ",
        "  OHHSSSSSSSO     ",
        "  OHSESSSESHO     ",
        "  OHSSSNNSSO      ",
        "   OHSSMMSSO      ",
        "    OSSSSSO       ",
        "      SSSS        ",
        "   OORRRRRROO     ",
        "  ORRRRRRRRRO     ",
        "  ORRWRRRWRRO     ",
        "  ORRRRRRRRRO     ",
        "   OORRRROO       ",
        "    OPP  PPO      ",
        "    OPP  PPO      ",
        "    OPP  PPO      ",
        "    OPP  PPO      ",
        "    OKK  KKO      ",
        "    OKK  KKO      ",
      ],
      {
        O: "#11131b",
        H: "#21140f",
        L: "#ffd1b4",
        S: "#efb58e",
        W: GAME_CONFIG.colors.pellet,
        E: "#10151f",
        N: "#c98a68",
        M: "#5e2320",
        R: "#b1040e",
        P: "#102744",
        K: "#11131b",
      },
      4,
    );
  }

  private makeGhostTexture(key: string, color: string): void {
    if (this.textures.exists(key)) {
      return;
    }

    this.makePixelTexture(
      key,
      [
        " GGGGG ",
        "GGGGGGG",
        "GWWGWWG",
        "GPPGPPG",
        "GGGGGGG",
        "GGGGGGG",
        "G G G G",
      ],
      {
        G: color,
        W: GAME_CONFIG.colors.pellet,
        P: GAME_CONFIG.colors.background,
      },
    );
  }

  private makeCollectibleTextures(): void {
    this.makePennyTexture();
    this.makeDollarBillTexture();
    this.makeBitcoinTexture();
    this.makeGoldCoinsTexture();
    this.makeMoneyBagTexture();
  }

  private makePennyTexture(): void {
    if (this.textures.exists("collectible-penny")) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(this.hex("#4a1f13"), 0.45);
    graphics.fillCircle(15, 12, 8);
    graphics.fillStyle(this.hex("#b86537"), 1);
    graphics.fillCircle(14, 10, 8);
    graphics.fillStyle(this.hex("#f0a15d"), 1);
    graphics.fillCircle(14, 10, 5);
    graphics.fillStyle(this.hex("#6f2f1f"), 0.5);
    graphics.fillRect(10, 9, 8, 2);
    graphics.fillRect(13, 6, 2, 9);
    graphics.fillStyle(this.hex("#ffd1a2"), 0.7);
    graphics.fillRect(10, 5, 4, 2);
    graphics.generateTexture("collectible-penny", 28, 22);
    graphics.destroy();
  }

  private makeDollarBillTexture(): void {
    if (this.textures.exists("collectible-dollar")) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    const unit = 2;
    const px = (x: number, y: number, width: number, height: number, color: string, alpha = 1): void => {
      graphics.fillStyle(this.hex(color), alpha);
      graphics.fillRect(x * unit, y * unit, width * unit, height * unit);
    };

    px(2, 2, 11, 7, "#052919", 0.72);
    px(1, 1, 11, 7, "#13925a");
    px(2, 2, 9, 5, "#67e69a");
    px(3, 3, 2, 1, "#0b6a3f");
    px(9, 6, 2, 1, "#0b6a3f");
    px(5, 2, 1, 5, GAME_CONFIG.colors.pellet);
    px(4, 3, 3, 1, GAME_CONFIG.colors.pellet);
    px(4, 5, 3, 1, GAME_CONFIG.colors.pellet);
    px(1, 8, 10, 1, "#042015", 0.5);
    graphics.generateTexture("collectible-dollar", 28, 20);
    graphics.destroy();
  }

  private makeBitcoinTexture(): void {
    if (this.textures.exists("collectible-bitcoin")) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(this.hex("#5f3505"), 0.45);
    graphics.fillCircle(15, 12, 9);
    graphics.fillStyle(this.hex("#f7931a"), 1);
    graphics.fillCircle(14, 10, 9);
    graphics.fillStyle(this.hex("#ffd166"), 1);
    graphics.fillCircle(14, 10, 6);
    graphics.fillStyle(this.hex("#6f3e09"), 0.35);
    graphics.fillCircle(14, 10, 4);
    graphics.fillStyle(this.hex(GAME_CONFIG.colors.pellet), 1);
    graphics.fillRect(12, 5, 2, 10);
    graphics.fillRect(15, 5, 2, 10);
    graphics.fillRect(10, 6, 7, 2);
    graphics.fillRect(10, 10, 8, 2);
    graphics.fillRect(10, 14, 7, 2);
    graphics.fillRect(17, 7, 2, 3);
    graphics.fillRect(18, 11, 2, 3);
    graphics.generateTexture("collectible-bitcoin", 28, 22);
    graphics.destroy();
  }

  private makeGoldCoinsTexture(): void {
    if (this.textures.exists("collectible-gold")) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    const drawCoin = (x: number, y: number, width: number): void => {
      graphics.fillStyle(this.hex("#7a4d04"), 0.55);
      graphics.fillEllipse(x + 1, y + 2, width, 9);
      graphics.fillStyle(this.hex("#f5b72f"), 1);
      graphics.fillEllipse(x, y, width, 9);
      graphics.fillStyle(this.hex("#ffe38a"), 0.92);
      graphics.fillEllipse(x - 1, y - 1, width - 7, 4);
      graphics.fillStyle(this.hex("#b9770e"), 0.45);
      graphics.fillRect(x - width / 2 + 3, y + 1, width - 6, 2);
    };

    drawCoin(13, 14, 20);
    drawCoin(16, 9, 18);
    drawCoin(11, 6, 15);
    graphics.generateTexture("collectible-gold", 28, 22);
    graphics.destroy();
  }

  private makeMoneyBagTexture(): void {
    if (this.textures.exists("collectible-money-bag")) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(this.hex("#3b2a18"), 0.55);
    graphics.fillEllipse(15, 18, 22, 8);
    graphics.fillStyle(this.hex("#d3b36f"), 1);
    graphics.fillCircle(14, 13, 8);
    graphics.fillRect(8, 11, 12, 7);
    graphics.fillStyle(this.hex("#8b5f2d"), 1);
    graphics.fillTriangle(9, 7, 19, 7, 14, 12);
    graphics.fillStyle(this.hex("#f2d99b"), 0.95);
    graphics.fillRect(10, 6, 8, 2);
    graphics.fillStyle(this.hex("#2e7d4f"), 1);
    graphics.fillRect(13, 10, 2, 8);
    graphics.fillRect(11, 12, 6, 2);
    graphics.fillRect(11, 16, 6, 2);
    graphics.fillStyle(this.hex("#fff3b8"), 0.6);
    graphics.fillRect(9, 10, 4, 2);
    graphics.generateTexture("collectible-money-bag", 28, 24);
    graphics.destroy();
  }

  private makePowerPelletTexture(): void {
    if (this.textures.exists("power-pellet")) {
      return;
    }

    this.makePixelTexture(
      "power-pellet",
      ["  O  ", " OCO ", "OCWCO", " OCO ", "  O  "],
      {
        O: GAME_CONFIG.colors.powerPellet,
        C: GAME_CONFIG.colors.playerHighlight,
        W: GAME_CONFIG.colors.pellet,
      },
      4,
    );
  }

  private makeJonnyPortraitTexture(): void {
    if (this.textures.exists("portrait-jonny")) {
      return;
    }

    const unit = 4;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    const px = (x: number, y: number, width: number, height: number, color: string, alpha = 1): void => {
      graphics.fillStyle(this.hex(color), alpha);
      graphics.fillRect(x * unit, y * unit, width * unit, height * unit);
    };

    const outline = "#08080a";
    const skin = "#f0b994";
    const skinLight = "#ffd1b4";
    const skinShade = "#c98565";
    const blush = "#e58a7c";
    const hair = "#130d0b";
    const hairMid = "#2b1b13";
    const hairLight = "#65432b";
    const eye = "#6d3d1e";
    const shirt = "#0c0d10";
    const shirtLight = "#22242a";
    const teeth = "#fff5e7";

    px(0, 0, 18, 21, outline);
    px(1, 1, 16, 19, "#17243a");
    px(2, 2, 14, 17, "#203653");
    px(2, 17, 14, 2, "#111827", 0.85);

    px(3, 14, 12, 1, outline);
    px(2, 15, 14, 5, shirt);
    px(4, 15, 10, 1, shirtLight);
    px(5, 15, 8, 1, skinShade);
    px(6, 14, 6, 2, skin);

    px(4, 5, 10, 8, outline);
    px(5, 5, 8, 8, skin);
    px(4, 7, 1, 4, skinShade);
    px(13, 7, 1, 4, skinShade);
    px(6, 6, 6, 2, skinLight, 0.65);
    px(7, 12, 4, 2, skinShade, 0.6);

    px(4, 3, 10, 2, hair);
    px(3, 4, 12, 2, hair);
    px(2, 5, 4, 5, hair);
    px(12, 4, 3, 5, hair);
    px(5, 2, 7, 2, hair);
    px(7, 1, 4, 1, hairMid);
    px(6, 3, 3, 1, hairLight);
    px(11, 3, 2, 1, hairLight);
    px(13, 5, 1, 2, hairLight);
    px(4, 5, 1, 3, hairMid);

    px(5, 8, 3, 1, "#2a1711");
    px(10, 8, 3, 1, "#2a1711");
    px(6, 9, 1, 1, GAME_CONFIG.colors.pellet);
    px(11, 9, 1, 1, GAME_CONFIG.colors.pellet);
    px(6, 9, 1, 1, eye, 0.9);
    px(11, 9, 1, 1, eye, 0.9);
    px(8, 10, 2, 1, skinShade, 0.75);
    px(5, 11, 2, 1, blush, 0.55);
    px(11, 11, 2, 1, blush, 0.45);

    px(6, 12, 6, 1, "#3c1012");
    px(7, 12, 4, 1, teeth);
    px(7, 13, 4, 1, "#6e2a25", 0.65);
    px(5, 13, 8, 1, skinShade, 0.5);

    px(1, 1, 16, 1, GAME_CONFIG.colors.wall, 0.95);
    px(1, 19, 16, 1, GAME_CONFIG.colors.wall, 0.95);
    px(1, 1, 1, 19, GAME_CONFIG.colors.wall, 0.95);
    px(16, 1, 1, 19, GAME_CONFIG.colors.wall, 0.95);
    px(2, 2, 14, 1, GAME_CONFIG.colors.wallInset, 0.35);

    graphics.generateTexture("portrait-jonny", 18 * unit, 21 * unit);
    graphics.destroy();
  }

  private makeTimmyPortraitTexture(): void {
    if (this.textures.exists("portrait-timmy")) {
      return;
    }

    const unit = 4;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    const px = (x: number, y: number, width: number, height: number, color: string, alpha = 1): void => {
      graphics.fillStyle(this.hex(color), alpha);
      graphics.fillRect(x * unit, y * unit, width * unit, height * unit);
    };

    const outline = "#171016";
    const hair = "#24150f";
    const hairMid = "#4a2a1c";
    const skin = "#efb58e";
    const skinLight = "#ffd0aa";
    const skinShade = "#c77f61";
    const hoodie = "#b1040e";
    const hoodieDark = "#731016";
    const hoodieLight = "#fa402b";
    const eye = "#19171c";
    const teeth = GAME_CONFIG.colors.pellet;

    px(0, 0, 18, 21, GAME_CONFIG.colors.wallShadow);
    px(1, 1, 16, 19, GAME_CONFIG.colors.dialoguePanel);
    px(2, 2, 14, 17, "#101b32", 0.55);
    px(3, 14, 12, 4, "#0e2038", 0.8);

    px(3, 16, 12, 4, hoodieDark);
    px(4, 15, 10, 5, hoodie);
    px(5, 16, 8, 2, hoodieLight, 0.55);
    px(7, 14, 4, 3, skinShade);
    px(6, 18, 6, 1, GAME_CONFIG.colors.logoBlue);
    px(5, 17, 2, 2, teeth, 0.78);
    px(12, 17, 2, 2, teeth, 0.78);

    px(4, 5, 10, 9, outline);
    px(5, 5, 8, 10, skin);
    px(6, 5, 6, 2, skinLight, 0.65);
    px(5, 8, 1, 4, skinShade, 0.55);
    px(12, 8, 1, 4, skinShade, 0.48);
    px(7, 10, 4, 4, skinLight, 0.3);
    px(6, 14, 6, 1, skinShade, 0.65);

    px(3, 4, 11, 3, hair);
    px(4, 3, 8, 2, hair);
    px(5, 2, 6, 1, hairMid);
    px(2, 6, 4, 4, hair);
    px(11, 5, 4, 4, hair);
    px(6, 4, 7, 1, hairMid);
    px(4, 6, 3, 1, hairMid);
    px(12, 7, 2, 3, hair);

    px(6, 9, 2, 1, teeth);
    px(10, 9, 2, 1, teeth);
    px(6, 9, 1, 1, eye);
    px(10, 9, 1, 1, eye);
    px(7, 11, 3, 1, skinShade, 0.82);
    px(7, 12, 5, 1, "#5e2320");
    px(8, 12, 3, 1, teeth);
    px(5, 11, 1, 1, "#f29486", 0.55);
    px(12, 11, 1, 1, "#f29486", 0.48);

    px(1, 1, 16, 1, GAME_CONFIG.colors.wall, 0.95);
    px(1, 19, 16, 1, GAME_CONFIG.colors.wall, 0.95);
    px(1, 1, 1, 19, GAME_CONFIG.colors.wall, 0.95);
    px(16, 1, 1, 19, GAME_CONFIG.colors.wall, 0.95);
    px(2, 2, 14, 1, GAME_CONFIG.colors.wallInset, 0.35);

    graphics.generateTexture("portrait-timmy", 18 * unit, 21 * unit);
    graphics.destroy();
  }

  private makePortraitTexture(): void {
    if (this.textures.exists("portrait-outsider")) {
      return;
    }

    this.makePixelTexture(
      "portrait-outsider",
      [
        "BBBBBBBBBBBB",
        "B..........B",
        "B..OOOOOO..B",
        "B.OOOOOOOO.B",
        "B.OOWOOWOO.B",
        "B.OOPOOPOO.B",
        "B.OOOOOOOO.B",
        "B..OOOOOO..B",
        "B...CCCC...B",
        "B..CCCCCC..B",
        "B.CCBBBBCC.B",
        "B.CBBBBBBC.B",
        "B..........B",
        "BBBBBBBBBBBB",
      ],
      {
        B: GAME_CONFIG.colors.wall,
        ".": GAME_CONFIG.colors.dialoguePanel,
        O: GAME_CONFIG.colors.player,
        C: GAME_CONFIG.colors.pellet,
        W: GAME_CONFIG.colors.pellet,
        P: GAME_CONFIG.colors.background,
      },
      6,
    );
  }

  private makePixelTexture(key: string, pixels: string[], palette: Record<string, string>, pixelSize = 4): void {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);

    pixels.forEach((row, y) => {
      [...row].forEach((pixel, x) => {
        const color = palette[pixel];
        if (!color) {
          return;
        }

        graphics.fillStyle(this.hex(color), 1);
        graphics.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      });
    });

    graphics.generateTexture(key, pixels[0].length * pixelSize, pixels.length * pixelSize);
    graphics.destroy();
  }

  private makePartnerGhostTexture(
    key: string,
    spec: PartnerPixelSpec,
  ): void {
    if (this.textures.exists(key)) {
      return;
    }

    const unit = 2;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    const px = (x: number, y: number, width: number, height: number, color: string, alpha = 1): void => {
      graphics.fillStyle(this.hex(color), alpha);
      graphics.fillRect(x * unit, y * unit, width * unit, height * unit);
    };

    px(3, 5, 10, 8, spec.body);
    px(2, 8, 12, 5, spec.body);
    px(2, 13, 2, 2, spec.body);
    px(5, 13, 2, 2, spec.body);
    px(9, 13, 2, 2, spec.body);
    px(12, 13, 2, 2, spec.body);
    px(4, 4, 8, 7, spec.skin);
    px(5, 10, 6, 2, spec.skin);
    px(5, 12, 6, 2, spec.shirt);

    if (spec.style === "sidePart") {
      px(3, 3, 9, 2, spec.hair);
      px(2, 4, 5, 2, spec.hair);
      px(10, 4, 2, 3, spec.hair);
      px(5, 9, 6, 2, spec.accent, 0.8);
      px(6, 10, 4, 1, spec.skin);
    }

    if (spec.style === "baldBeard") {
      px(4, 3, 2, 2, spec.hair);
      px(10, 3, 2, 2, spec.hair);
      px(2, 5, 2, 5, spec.hair);
      px(12, 5, 2, 5, spec.hair);
      px(4, 4, 8, 4, spec.skin);
      px(4, 8, 8, 4, spec.hair);
      px(5, 8, 6, 2, spec.skin);
      px(4, 12, 8, 2, spec.accent);
    }

    if (spec.style === "swoop") {
      px(3, 3, 9, 2, spec.hair);
      px(2, 4, 11, 3, spec.hair);
      px(2, 6, 4, 2, spec.hair);
      px(10, 6, 3, 2, spec.hair);
      px(5, 10, 6, 1, spec.accent);
    }

    if (spec.style === "curls") {
      px(2, 3, 3, 3, spec.hair);
      px(5, 2, 5, 2, spec.hair);
      px(10, 3, 3, 3, spec.hair);
      px(1, 6, 3, 6, spec.hair);
      px(12, 6, 3, 6, spec.hair);
      px(3, 8, 2, 2, spec.accent);
      px(11, 8, 2, 2, spec.accent);
    }

    px(5, 7, 2, 1, GAME_CONFIG.colors.pellet);
    px(9, 7, 2, 1, GAME_CONFIG.colors.pellet);
    px(6, 7, 1, 1, GAME_CONFIG.colors.background);
    px(10, 7, 1, 1, GAME_CONFIG.colors.background);
    px(7, 9, 2, 1, GAME_CONFIG.colors.background, 0.65);
    px(6, 10, 4, 1, GAME_CONFIG.colors.pellet, spec.style === "swoop" ? 0.95 : 0.6);

    graphics.generateTexture(key, 16 * unit, 16 * unit);
    graphics.destroy();
  }

  private makePartnerFrightenedGhostTexture(key: string, spec: PartnerPixelSpec): void {
    if (this.textures.exists(key)) {
      return;
    }

    const unit = 2;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    const px = (x: number, y: number, width: number, height: number, color: string, alpha = 1): void => {
      graphics.fillStyle(this.hex(color), alpha);
      graphics.fillRect(x * unit, y * unit, width * unit, height * unit);
    };

    const aura = GAME_CONFIG.colors.frightenedGhost;

    px(2, 4, 12, 10, aura, 0.38);
    px(1, 7, 14, 6, aura, 0.34);
    px(2, 13, 2, 2, aura, 0.5);
    px(5, 13, 2, 2, aura, 0.5);
    px(9, 13, 2, 2, aura, 0.5);
    px(12, 13, 2, 2, aura, 0.5);

    px(3, 5, 10, 8, spec.body, 0.55);
    px(2, 8, 12, 5, spec.body, 0.5);
    px(2, 13, 2, 2, spec.body, 0.45);
    px(5, 13, 2, 2, spec.body, 0.45);
    px(9, 13, 2, 2, spec.body, 0.45);
    px(12, 13, 2, 2, spec.body, 0.45);
    px(4, 4, 8, 7, spec.skin);
    px(5, 10, 6, 2, spec.skin);
    px(5, 12, 6, 2, spec.shirt);

    if (spec.style === "sidePart") {
      px(3, 3, 9, 2, spec.hair);
      px(2, 4, 5, 2, spec.hair);
      px(10, 4, 2, 3, spec.hair);
      px(5, 9, 6, 2, spec.accent, 0.8);
      px(6, 10, 4, 1, spec.skin);
    }

    if (spec.style === "baldBeard") {
      px(4, 3, 2, 2, spec.hair);
      px(10, 3, 2, 2, spec.hair);
      px(2, 5, 2, 5, spec.hair);
      px(12, 5, 2, 5, spec.hair);
      px(4, 4, 8, 4, spec.skin);
      px(4, 8, 8, 4, spec.hair);
      px(5, 8, 6, 2, spec.skin);
      px(4, 12, 8, 2, spec.accent);
    }

    if (spec.style === "swoop") {
      px(3, 3, 9, 2, spec.hair);
      px(2, 4, 11, 3, spec.hair);
      px(2, 6, 4, 2, spec.hair);
      px(10, 6, 3, 2, spec.hair);
      px(5, 10, 6, 1, spec.accent);
    }

    if (spec.style === "curls") {
      px(2, 3, 3, 3, spec.hair);
      px(5, 2, 5, 2, spec.hair);
      px(10, 3, 3, 3, spec.hair);
      px(1, 6, 3, 6, spec.hair);
      px(12, 6, 3, 6, spec.hair);
      px(3, 8, 2, 2, spec.accent);
      px(11, 8, 2, 2, spec.accent);
    }

    px(4, 3, 8, 10, aura, 0.22);
    px(5, 7, 2, 1, GAME_CONFIG.colors.pellet);
    px(9, 7, 2, 1, GAME_CONFIG.colors.pellet);
    px(6, 7, 1, 1, aura);
    px(10, 7, 1, 1, aura);
    px(7, 9, 2, 1, GAME_CONFIG.colors.background, 0.65);
    px(6, 10, 4, 1, GAME_CONFIG.colors.pellet, spec.style === "swoop" ? 1 : 0.72);
    px(1, 4, 1, 8, GAME_CONFIG.colors.pellet, 0.45);
    px(14, 4, 1, 8, GAME_CONFIG.colors.pellet, 0.45);

    graphics.generateTexture(key, 16 * unit, 16 * unit);
    graphics.destroy();
  }

  private makePartnerReturnTexture(key: string, spec: PartnerPixelSpec): void {
    if (this.textures.exists(key)) {
      return;
    }

    const unit = 2;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    const px = (x: number, y: number, width: number, height: number, color: string, alpha = 1): void => {
      graphics.fillStyle(this.hex(color), alpha);
      graphics.fillRect(x * unit, y * unit, width * unit, height * unit);
    };

    px(2, 6, 12, 7, GAME_CONFIG.colors.frightenedGhost, 0.24);
    px(3, 5, 10, 8, spec.body, 0.3);
    px(4, 6, 8, 5, spec.skin, 0.78);

    if (spec.style === "sidePart") {
      px(3, 4, 9, 2, spec.hair);
      px(2, 5, 5, 2, spec.hair);
      px(10, 5, 2, 2, spec.hair);
    }

    if (spec.style === "baldBeard") {
      px(3, 6, 2, 4, spec.hair);
      px(11, 6, 2, 4, spec.hair);
      px(5, 9, 6, 2, spec.hair);
    }

    if (spec.style === "swoop") {
      px(3, 4, 9, 2, spec.hair);
      px(2, 5, 11, 2, spec.hair);
      px(2, 7, 4, 1, spec.hair);
    }

    if (spec.style === "curls") {
      px(2, 4, 3, 3, spec.hair);
      px(5, 3, 5, 2, spec.hair);
      px(10, 4, 3, 3, spec.hair);
      px(2, 7, 2, 3, spec.hair);
      px(12, 7, 2, 3, spec.hair);
    }

    px(4, 7, 4, 4, GAME_CONFIG.colors.pellet);
    px(9, 7, 4, 4, GAME_CONFIG.colors.pellet);
    px(6, 8, 1, 2, GAME_CONFIG.colors.background);
    px(11, 8, 1, 2, GAME_CONFIG.colors.background);
    px(5, 13, 6, 1, GAME_CONFIG.colors.frightenedGhost, 0.55);
    px(7, 14, 2, 1, spec.body, 0.7);

    graphics.generateTexture(key, 16 * unit, 16 * unit);
    graphics.destroy();
  }

  private makePartnerPortraitTexture(key: string, spec: PartnerPixelSpec): void {
    if (this.textures.exists(key)) {
      return;
    }

    const unit = 5;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    const px = (x: number, y: number, width: number, height: number, color: string, alpha = 1): void => {
      graphics.fillStyle(this.hex(color), alpha);
      graphics.fillRect(x * unit, y * unit, width * unit, height * unit);
    };

    px(0, 0, 16, 16, GAME_CONFIG.colors.wallShadow);
    px(1, 1, 14, 14, GAME_CONFIG.colors.dialoguePanel);
    px(4, 4, 8, 7, spec.skin);
    px(5, 10, 6, 2, spec.skin);
    px(4, 12, 8, 2, spec.shirt);

    if (spec.style === "sidePart") {
      px(3, 3, 9, 2, spec.hair);
      px(3, 4, 4, 2, spec.hair);
      px(10, 4, 2, 3, spec.hair);
      px(5, 9, 6, 2, spec.accent, 0.78);
      px(6, 10, 4, 1, spec.skin);
    }

    if (spec.style === "baldBeard") {
      px(4, 3, 2, 2, spec.hair);
      px(10, 3, 2, 2, spec.hair);
      px(2, 5, 2, 5, spec.hair);
      px(12, 5, 2, 5, spec.hair);
      px(4, 4, 8, 4, spec.skin);
      px(4, 8, 8, 4, spec.hair);
      px(5, 8, 6, 2, spec.skin);
      px(3, 12, 10, 2, spec.shirt);
      px(5, 11, 6, 2, spec.accent);
    }

    if (spec.style === "swoop") {
      px(3, 3, 9, 2, spec.hair);
      px(2, 4, 11, 3, spec.hair);
      px(2, 6, 4, 2, spec.hair);
      px(10, 6, 3, 2, spec.hair);
      px(5, 10, 6, 1, spec.accent);
    }

    if (spec.style === "curls") {
      px(2, 3, 3, 3, spec.hair);
      px(5, 2, 5, 2, spec.hair);
      px(10, 3, 4, 3, spec.hair);
      px(1, 5, 4, 7, spec.hair);
      px(11, 5, 4, 7, spec.hair);
      px(2, 8, 3, 2, spec.accent, 0.9);
      px(11, 8, 3, 2, spec.accent, 0.9);
    }

    px(5, 7, 2, 1, GAME_CONFIG.colors.pellet);
    px(9, 7, 2, 1, GAME_CONFIG.colors.pellet);
    px(6, 7, 1, 1, GAME_CONFIG.colors.background);
    px(10, 7, 1, 1, GAME_CONFIG.colors.background);
    px(7, 9, 2, 1, GAME_CONFIG.colors.background, 0.65);
    px(6, 10, 4, 1, GAME_CONFIG.colors.pellet, spec.style === "swoop" ? 1 : 0.72);
    px(1, 1, 14, 1, spec.body, 0.95);
    px(1, 14, 14, 1, spec.body, 0.95);
    px(1, 1, 1, 14, spec.body, 0.95);
    px(14, 1, 1, 14, spec.body, 0.95);

    graphics.generateTexture(key, 16 * unit, 16 * unit);
    graphics.destroy();
  }

  private drawBackdrop(): void {
    this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      this.hex(GAME_CONFIG.colors.background),
    );

    this.addBrandTexture();

    this.add.rectangle(
      GAME_CONFIG.width / 2,
      this.boardOffsetY + this.boardHeight / 2,
      this.boardWidth + 22,
      this.boardHeight + 22,
      this.hex(GAME_CONFIG.colors.wallShadow),
    );

    this.add.rectangle(
      GAME_CONFIG.width / 2,
      this.boardOffsetY + this.boardHeight / 2,
      this.boardWidth + 12,
      this.boardHeight + 12,
      this.hex(GAME_CONFIG.colors.board),
    ).setStrokeStyle(2, this.hex(GAME_CONFIG.colors.dialogueStroke), 0.16);

    this.drawLevelFloor();
  }

  private drawLevelFloor(): void {
    const theme = FLOOR_THEMES[this.currentLevel - 1] ?? FLOOR_THEMES[0];

    MAZE_LAYOUT.forEach((row, y) => {
      [...row].forEach((tile, x) => {
        const world = this.tileToWorld({ x, y });
        const variant = (x * 17 + y * 29 + this.currentLevel * 11) % 7;
        const color = variant <= 1 ? theme.alt : theme.base;

        this.add.rectangle(world.x, world.y, this.tileSize, this.tileSize, this.hex(color), 0.98);

        if (tile === "#" || tile === "G") {
          return;
        }

        if ((x * 3 + y * 5 + this.currentLevel) % 10 === 0) {
          this.drawFloorMotif({ x, y }, world, theme, variant);
        }
      });
    });
  }

  private drawFloorMotif(tile: GridPoint, world: GridPoint, theme: FloorTheme, variant: number): void {
    const detail = this.hex(theme.detail);
    const accent = this.hex(theme.accent);
    const shadow = this.hex(theme.shadow);
    const x = world.x;
    const y = world.y;

    if (theme.motif === "intro") {
      this.add.rectangle(x, y, 16, 24, detail, 0.045);
      this.add.rectangle(x - 3, y - 5, 7, 1, accent, 0.075);
      this.add.rectangle(x + 4, y + 4, 5, 1, detail, 0.065);
      return;
    }

    if (theme.motif === "seed") {
      this.add.rectangle(x, y, 18, 22, detail, 0.05);
      this.add.rectangle(x - 1, y - 5, 10, 1, accent, 0.1);
      this.add.rectangle(x - 2, y + 2, 12, 1, detail, 0.08);
      return;
    }

    if (theme.motif === "seriesA") {
      this.add.rectangle(x - 5, y + 4, 2, 6, accent, 0.09);
      this.add.rectangle(x, y + 2, 2, 8, detail, 0.075);
      this.add.rectangle(x + 5, y - 2, 2, 12, accent, 0.085);
      this.add.rectangle(x, y + 9, 15, 1, shadow, 0.14);
      return;
    }

    if (theme.motif === "growth") {
      this.add.rectangle(x - 4, y - 3, 10, 7, detail, 0.055);
      this.add.rectangle(x + 5, y + 5, 9, 6, accent, 0.045);
      this.add.rectangle(x + 1, y + 1, 8, 1, accent, 0.085);
      return;
    }

    const isGreen = variant % 2 === 0;
    const tickerColor = isGreen ? accent : detail;
    this.add.rectangle(x, y, 18, 2, tickerColor, 0.11);
    this.add.triangle(
      x + 1,
      y - 5,
      0,
      isGreen ? 8 : 0,
      5,
      isGreen ? 0 : 8,
      10,
      isGreen ? 8 : 0,
      tickerColor,
      0.11,
    );
  }

  private addBrandTexture(): void {
    const rows = [
      "MAIL SECURITY / AUTONOMOUS LAUNDRY / HVAC MONITORING / TOILET SEATS",
      "OUTSIDE PERSPECTIVES / OVERLOOKED SPACES / NON-CONSENSUS SIGNAL",
      "DISTRIBUTED GPU / ELECTRONIC DESIGN AUTOMATION / CROP HARVESTING",
      "AIRPORT TRACTOR / CATTLE SUPPLY CHAIN / CYBER WARRANTY / AUTOMATION",
    ];

    rows.forEach((copy, index) => {
      this.add
        .text(22, 104 + index * 118, copy, {
          fontFamily: "Courier New, monospace",
          fontSize: "11px",
          color: index % 2 === 0 ? GAME_CONFIG.colors.hudText : GAME_CONFIG.colors.hudAccent,
        })
        .setAlpha(0.1)
        .setDepth(0);
    });

    this.add
      .text(GAME_CONFIG.width - 24, 88, "OUTSIDE\nPERSPECTIVES", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: GAME_CONFIG.colors.wallInset,
        align: "right",
      })
      .setOrigin(1, 0)
      .setAlpha(0.14)
      .setDepth(0);
  }

  private drawWallTile(tile: GridPoint, world: GridPoint): void {
    const line = 5;
    const half = this.tileSize / 2;
    const hasLeft = this.isMazeWallAt(tile.x - 1, tile.y);
    const hasRight = this.isMazeWallAt(tile.x + 1, tile.y);
    const hasUp = this.isMazeWallAt(tile.x, tile.y - 1);
    const hasDown = this.isMazeWallAt(tile.x, tile.y + 1);

    this.add.rectangle(world.x, world.y, line + 4, line + 4, this.hex(GAME_CONFIG.colors.wallShadow), 0.8);

    if (hasLeft) {
      this.add.rectangle(world.x - half / 2, world.y, half, line + 3, this.hex(GAME_CONFIG.colors.wallShadow), 0.8);
      this.add.rectangle(world.x - half / 2, world.y, half, line, this.hex(GAME_CONFIG.colors.wall));
    }

    if (hasRight) {
      this.add.rectangle(world.x + half / 2, world.y, half, line + 3, this.hex(GAME_CONFIG.colors.wallShadow), 0.8);
      this.add.rectangle(world.x + half / 2, world.y, half, line, this.hex(GAME_CONFIG.colors.wall));
    }

    if (hasUp) {
      this.add.rectangle(world.x, world.y - half / 2, line + 3, half, this.hex(GAME_CONFIG.colors.wallShadow), 0.8);
      this.add.rectangle(world.x, world.y - half / 2, line, half, this.hex(GAME_CONFIG.colors.wall));
    }

    if (hasDown) {
      this.add.rectangle(world.x, world.y + half / 2, line + 3, half, this.hex(GAME_CONFIG.colors.wallShadow), 0.8);
      this.add.rectangle(world.x, world.y + half / 2, line, half, this.hex(GAME_CONFIG.colors.wall));
    }

    this.add.rectangle(world.x, world.y, line + 2, line + 2, this.hex(GAME_CONFIG.colors.wallInset), 0.42);
    this.add.rectangle(world.x, world.y, line, line, this.hex(GAME_CONFIG.colors.wall));
  }

  private drawGhostHouseFloor(world: GridPoint): void {
    this.add.rectangle(world.x, world.y, this.tileSize, this.tileSize, this.hex(GAME_CONFIG.colors.houseFloor));
    this.add.rectangle(world.x, world.y, this.tileSize - 10, this.tileSize - 10, this.hex(GAME_CONFIG.colors.boardGrid), 0.6);
  }

  private drawGhostGate(world: GridPoint): void {
    this.drawGhostHouseFloor(world);
    const redBar = this.add
      .rectangle(world.x, world.y, this.tileSize - 8, 4, this.hex(GAME_CONFIG.colors.ghostGate))
      .setDepth(8);
    const whiteBar = this.add
      .rectangle(world.x, world.y + 6, this.tileSize - 16, 4, this.hex(GAME_CONFIG.colors.pellet), 0.8)
      .setDepth(8);

    this.ghostGateParts.push(
      { sprite: redBar, closedY: redBar.y },
      { sprite: whiteBar, closedY: whiteBar.y },
    );
  }

  private closeGhostGate(): void {
    this.ghostGateOpen = false;
    const sprites = this.ghostGateParts.map((part) => part.sprite);
    this.tweens.killTweensOf(sprites);
    this.ghostGateParts.forEach((part) => {
      part.sprite.setY(part.closedY);
      part.sprite.setAlpha(1);
      part.sprite.setVisible(true);
    });
  }

  private openGhostGateAndRelease(): void {
    this.openGhostGate();
    const baseReleaseDelay = 760;
    const staggerDelay = 1500;
    this.ghosts.forEach((ghost, index) => {
      if (!ghost.eaten && ghost.mode === "active") {
        ghost.releaseAt = this.time.now + baseReleaseDelay + index * staggerDelay;
      }
    });
  }

  private openGhostGate(): void {
    if (this.ghostGateOpen) {
      return;
    }

    this.ghostGateOpen = true;
    const sprites = this.ghostGateParts.map((part) => part.sprite);
    this.tweens.killTweensOf(sprites);
    this.tweens.add({
      targets: sprites,
      y: `+=${Math.round(this.tileSize * 0.72)}`,
      alpha: 0,
      duration: 620,
      ease: "cubic.in",
      onComplete: () => {
        sprites.forEach((sprite) => sprite.setVisible(false));
      },
    });
  }

  private drawSpawnMarker(world: GridPoint, color: string): void {
    this.drawGhostHouseFloor(world);
    this.add.rectangle(world.x, world.y + 10, this.tileSize - 12, 3, this.hex(color), 0.9);
  }

  private drawTunnelTile(tile: GridPoint, world: GridPoint): void {
    this.add.rectangle(world.x, world.y, this.tileSize, this.tileSize, this.hex(GAME_CONFIG.colors.board), 0.95);

    if (tile.x === 0 || tile.x === MAZE_LAYOUT[0].length - 1) {
      const isLeftExit = tile.x === 0;
      const direction = isLeftExit ? -1 : 1;
      const edgeX = world.x + direction * (this.tileSize * 0.46);

      this.add.rectangle(edgeX, world.y, 7, this.tileSize - 8, this.hex(GAME_CONFIG.colors.logoBlue), 0.8);
      this.add.rectangle(edgeX - direction * 3, world.y, 3, this.tileSize - 14, this.hex(GAME_CONFIG.colors.wallInset), 0.6);
      this.add.triangle(
        world.x - direction * 2,
        world.y,
        isLeftExit ? 8 : 0,
        0,
        isLeftExit ? 0 : 8,
        5,
        isLeftExit ? 8 : 0,
        10,
        this.hex(GAME_CONFIG.colors.pellet),
        0.75,
      );
      return;
    }

    const isTopExit = tile.y === 0;
    const direction = isTopExit ? -1 : 1;
    const edgeY = world.y + direction * (this.tileSize * 0.46);

    this.add.rectangle(world.x, edgeY, this.tileSize - 8, 7, this.hex(GAME_CONFIG.colors.logoBlue), 0.8);
    this.add.rectangle(world.x, edgeY - direction * 3, this.tileSize - 14, 3, this.hex(GAME_CONFIG.colors.wallInset), 0.6);
    this.add.triangle(
      world.x,
      world.y - direction * 2,
      0,
      isTopExit ? 8 : 0,
      5,
      isTopExit ? 0 : 8,
      10,
      isTopExit ? 8 : 0,
      this.hex(GAME_CONFIG.colors.pellet),
      0.75,
    );
  }

  private hex(color: string): number {
    return Phaser.Display.Color.HexStringToColor(color).color;
  }

  private isMazeWallAt(x: number, y: number): boolean {
    return y >= 0 && y < MAZE_LAYOUT.length && x >= 0 && x < MAZE_LAYOUT[0].length && MAZE_LAYOUT[y][x] === "#";
  }

  private shouldPlaceDollarBill(tile: GridPoint): boolean {
    if (MAZE_LAYOUT[tile.y]?.[tile.x] !== ".") {
      return false;
    }

    const hasHorizontalNeighbor =
      this.isCollectibleLaneTile(tile.x - 1, tile.y) || this.isCollectibleLaneTile(tile.x + 1, tile.y);
    const hasVerticalNeighbor =
      this.isCollectibleLaneTile(tile.x, tile.y - 1) || this.isCollectibleLaneTile(tile.x, tile.y + 1);
    const { dollarOffset, dollarSpacing } = this.levelConfig;

    if (hasHorizontalNeighbor && hasVerticalNeighbor) {
      return (tile.x * 3 + tile.y * 5 + dollarOffset) % dollarSpacing === 0;
    }

    if (hasHorizontalNeighbor) {
      return (tile.x + dollarOffset) % dollarSpacing === 1;
    }

    if (hasVerticalNeighbor) {
      return (tile.y + dollarOffset) % dollarSpacing === 1;
    }

    return (tile.x + tile.y + dollarOffset) % dollarSpacing === 0;
  }

  private isCollectibleLaneTile(x: number, y: number): boolean {
    const tile = MAZE_LAYOUT[y]?.[x];
    return tile === "." || tile === "o" || tile === "P" || tile === "T";
  }

  private getCollectibleTextureKey(): string {
    return COLLECTIBLE_TEXTURES[this.currentLevel - 1] ?? COLLECTIBLE_TEXTURES[0];
  }

  private buildMaze(): void {
    MAZE_LAYOUT.forEach((row, y) => {
      [...row].forEach((tile, x) => {
        const key = this.tileKey({ x, y });
        const world = this.tileToWorld({ x, y });

        if (tile === "#") {
          this.walls.add(key);
          this.playerBlockedTiles.add(key);
          this.drawWallTile({ x, y }, world);
          return;
        }

        if (tile === "G") {
          this.playerBlockedTiles.add(key);
          this.drawGhostGate(world);
          return;
        }

        if (tile === "H") {
          this.playerBlockedTiles.add(key);
          this.drawGhostHouseFloor(world);
          return;
        }

        if (tile === "T") {
          this.drawTunnelTile({ x, y }, world);
          return;
        }

        if (tile === ".") {
          this.powerPelletSpawnTiles.push({ x, y });
          if (this.shouldPlaceDollarBill({ x, y })) {
            const pellet = this.add.image(world.x, world.y, this.getCollectibleTextureKey());
            this.pellets.set(key, pellet);
            this.remainingDollarBills += 1;
          }
          return;
        }

        if (tile === "o") {
          this.createPowerPelletAt({ x, y });
          return;
        }

        if (tile === "P") {
          this.playerStartTile = { x, y };
          this.playerTile = { x, y };
          return;
        }

        if (tile === "A" || tile === "B" || tile === "C" || tile === "D") {
          this.playerBlockedTiles.add(key);
          const spawnColors: Record<string, string> = {
            A: GAME_CONFIG.colors.ghostOne,
            B: GAME_CONFIG.colors.ghostTwo,
            C: GAME_CONFIG.colors.wallInset,
            D: GAME_CONFIG.colors.powerPellet,
          };
          this.drawSpawnMarker(world, spawnColors[tile]);
        }
      });
    });

    const requiredBills = Math.ceil(this.remainingDollarBills * this.levelConfig.requiredDollarRatio);
    this.dollarScoreTarget = requiredBills * GAME_CONFIG.scores.pellet;
  }

  private createPowerPelletAt(tile: GridPoint): void {
    const key = this.tileKey(tile);
    if (this.powerPellets.has(key)) {
      return;
    }

    const world = this.tileToWorld(tile);
    const powerPellet = this.add.image(world.x, world.y, "power-pellet");
    this.powerPellets.set(key, powerPellet);
    this.tweens.add({
      targets: powerPellet,
      scale: 0.65,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      duration: 620,
    });
  }

  private schedulePowerPelletRespawn(): void {
    if (this.gameState !== "playing" || this.powerPellets.size > 0 || this.pendingPowerPelletRespawn) {
      return;
    }

    this.pendingPowerPelletRespawn = this.time.delayedCall(this.levelConfig.powerRespawnMs, () => {
      this.pendingPowerPelletRespawn = null;
      this.spawnRandomPowerPellet();
    });
  }

  private spawnRandomPowerPellet(): void {
    if (this.gameState !== "playing" || this.powerPellets.size > 0) {
      return;
    }

    const occupiedTiles = new Set<string>([
      this.tileKey(this.playerTile),
      ...this.ghosts.map((ghost) => this.tileKey(ghost.tile)),
      ...this.pellets.keys(),
      ...this.powerPellets.keys(),
    ]);
    const candidates = this.powerPelletSpawnTiles.filter((tile) => !occupiedTiles.has(this.tileKey(tile)));

    if (candidates.length === 0) {
      this.schedulePowerPelletRespawn();
      return;
    }

    this.createPowerPelletAt(Phaser.Utils.Array.GetRandom(candidates));
    this.maybeShowPowerPelletRespawnDialogue();
  }

  private maybeShowPowerPelletRespawnDialogue(): void {
    if (this.hasShownPowerPelletRespawnDialogue || this.gameState !== "playing") {
      return;
    }

    if (this.dialogue.active) {
      if (!this.pendingPowerPelletRespawnDialogue) {
        this.pendingPowerPelletRespawnDialogue = this.time.delayedCall(350, () => {
          this.pendingPowerPelletRespawnDialogue = null;
          this.maybeShowPowerPelletRespawnDialogue();
        });
      }
      return;
    }

    this.hasShownPowerPelletRespawnDialogue = true;
    this.showDialogue(POWER_PELLET_RESPAWN_DIALOGUE);
  }

  private createActors(): void {
    const startWorld = this.tileToWorld(this.playerStartTile);
    this.player = this.add.sprite(startWorld.x, startWorld.y, "player");
    this.player.setDepth(10);

    const ghostSpawns = this.findGhostSpawns();
    this.ghosts = ghostSpawns.map((spawn, index) => {
      const world = this.tileToWorld(spawn.tile);
      const config = PARTNER_GHOSTS[index % PARTNER_GHOSTS.length];
      const ghost: GhostState = {
        id: config.id,
        name: config.name,
        sprite: this.add.sprite(world.x, world.y, config.texture).setDepth(9),
        startTile: { ...spawn.tile },
        tile: { ...spawn.tile },
        direction: config.direction,
        targetTile: null,
        normalTexture: config.texture,
        frightenedTexture: `${config.texture}-frightened`,
        returnTexture: `${config.texture}-returning`,
        eaten: false,
        mode: "active",
        personality: config.personality,
        releaseAt: Number.POSITIVE_INFINITY,
        portraitKey: config.portraitKey,
      };
      return ghost;
    });
  }

  private findGhostSpawns(): Array<{ tile: GridPoint }> {
    const spawns: Array<{ tile: GridPoint }> = [];

    MAZE_LAYOUT.forEach((row, y) => {
      [...row].forEach((tile, x) => {
        if (tile === "A" || tile === "B" || tile === "C" || tile === "D") {
          spawns.push({ tile: { x, y } });
        }
      });
    });

    return spawns;
  }

  private createHud(): void {
    const boardCenterX = this.boardOffsetX + this.boardWidth / 2;
    const boardRightX = this.boardOffsetX + this.boardWidth;
    const statTopY = 18;
    const statSubY = 42;
    const tractionX = boardRightX - 190;
    const livesX = boardRightX - 54;

    this.addOutsidersLogo(28, 10);

    this.titleText = this.add.text(28, 64, GAME_CONFIG.title.toUpperCase(), {
      fontFamily: "DM Sans, Arial, sans-serif",
      fontSize: "16px",
      fontStyle: "900",
      color: GAME_CONFIG.colors.hudText,
      stroke: GAME_CONFIG.colors.logoBlue,
      strokeThickness: 1,
    }).setShadow(2, 2, GAME_CONFIG.colors.logoBlue, 0, false, true);

    this.stageText = this.add
      .text(boardCenterX, statTopY, "", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "18px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
      })
      .setOrigin(0.5, 0);

    this.levelText = this.add
      .text(boardCenterX, statSubY, "", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.logoBlue,
      })
      .setOrigin(0.5, 0);

    this.tractionText = this.add
      .text(tractionX, statTopY, "", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "18px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
      })
      .setOrigin(0.5, 0);

    this.scoreText = this.add
      .text(tractionX, statSubY, "", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "800",
        color: GAME_CONFIG.colors.wallInset,
      })
      .setOrigin(0.5, 0);

    this.livesText = this.add
      .text(livesX, statTopY, "", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "18px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
      })
      .setOrigin(0.5, 0);

    this.statusText = this.add
      .text(boardRightX, statSubY, "", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudAccent,
      })
      .setOrigin(1, 0);

    this.overlayText = this.add
      .text(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, "", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "42px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudAccent,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setVisible(false);

    this.createEndMenuUi();
    this.createPauseMenuUi();
    this.createHudControls();
    this.updateHud();
  }

  private createReviewControls(): void {
    this.reviewHintText = this.add
      .text(
        GAME_CONFIG.width / 2,
        GAME_CONFIG.height - 10,
        "REVIEW MODE  |  1-5: floor maps  |  L: level passed  |  O: game cleared  |  X: game over  |  M: map",
        {
          fontFamily: "DM Sans, Arial, sans-serif",
          fontSize: "11px",
          fontStyle: "800",
          color: GAME_CONFIG.colors.wallInset,
          align: "center",
        },
      )
      .setOrigin(0.5, 1)
      .setAlpha(0.82)
      .setDepth(45);
  }

  private restartReview(level: number, screen: ReviewScreen): void {
    this.scene.restart({
      level,
      lives: GAME_CONFIG.startingLives,
      score: 0,
      reviewMode: true,
      reviewScreen: screen,
      hasUsedPityContinue: false,
      hasShownPowerPelletRespawnDialogue: false,
    } satisfies PrototypeSceneData);
  }

  private showReviewScreen(screen: ReviewScreen): void {
    this.reviewScreen = screen;
    this.applyReviewScreen();
  }

  private applyReviewScreen(): void {
    this.dialogue.active = false;
    this.dialogue.container.setVisible(false);
    this.hideEndMenu();
    this.overlayText.setVisible(false);

    if (this.reviewScreen === "map") {
      this.gameState = "playing";
      this.updateHud();
      return;
    }

    if (this.reviewScreen === "levelclear") {
      if (this.currentLevel >= LEVEL_CONFIGS.length) {
        this.gameState = "won";
        this.showEndMenu("won");
        return;
      }

      this.gameState = "levelclear";
      this.showEndMenu("levelclear");
      return;
    }

    if (this.reviewScreen === "gameover") {
      this.gameState = "gameover";
      this.showEndMenu("gameover");
      return;
    }

    this.gameState = "won";
    this.showEndMenu("won");
  }

  private createEndMenuUi(): void {
    const panelWidth = 600;
    const panelHeight = 500;
    const panelX = GAME_CONFIG.width / 2;
    const panelY = GAME_CONFIG.height / 2;
    const container = this.add
      .container(0, 0)
      .setDepth(31)
      .setVisible(false);

    const scrim = this.add
      .rectangle(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, GAME_CONFIG.width, GAME_CONFIG.height, this.hex("#030609"), 0.42)
      .setOrigin(0.5);
    const panelShadow = this.add.rectangle(
      panelX + 8,
      panelY + 10,
      panelWidth,
      panelHeight,
      this.hex(GAME_CONFIG.colors.wallShadow),
      0.72,
    );
    const panel = this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, this.hex(GAME_CONFIG.colors.dialoguePanel), 0.98)
      .setStrokeStyle(3, this.hex(GAME_CONFIG.colors.dialogueStroke), 0.58);
    const panelAccent = this.add.rectangle(
      panelX,
      panelY - panelHeight / 2 + 7,
      panelWidth - 20,
      5,
      this.hex(GAME_CONFIG.colors.logoBlue),
      0.94,
    );
    const title = this.add
      .text(panelX, panelY - 214, "", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "36px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
        align: "center",
      })
      .setOrigin(0.5);
    const art = this.add.container(0, 0);
    const subtitle = this.add
      .text(panelX, panelY + 68, "", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "18px",
        fontStyle: "800",
        color: GAME_CONFIG.colors.hudText,
        align: "center",
        lineSpacing: 5,
        wordWrap: { width: panelWidth - 84 },
      })
      .setOrigin(0.5);
    const stats = this.add
      .text(panelX, panelY + 144, "", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "15px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.wallInset,
        align: "center",
      })
      .setOrigin(0.5);

    const continueButton = this.createMenuButton(panelX - 144, panelY + 216, 270, "PITY DEAL: +1 LIFE", () => {
      this.continueWithPityDeal();
    });
    const nextButton = this.createMenuButton(panelX - 124, panelY + 216, 220, "NEXT LEVEL", () => {
      this.finishLevel();
    });
    const restartButton = this.createMenuButton(panelX + 124, panelY + 216, 220, "RESTART GAME", () => {
      this.restartGame();
    });

    container.add([scrim, panelShadow, panel, panelAccent, title, art, subtitle, stats, continueButton, nextButton, restartButton]);
    this.endMenu = {
      container,
      art,
      title,
      subtitle,
      stats,
      continueButton,
      nextButton,
      restartButton,
    };
    this.hideEndMenu();
  }

  private createPauseMenuUi(): void {
    const panelX = GAME_CONFIG.width / 2;
    const panelY = GAME_CONFIG.height / 2;
    const panelWidth = 430;
    const panelHeight = 260;
    const container = this.add.container(0, 0).setDepth(90).setVisible(false);
    const scrim = this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      this.hex("#030609"),
      0.54,
    );
    const shadow = this.add.rectangle(
      panelX + 8,
      panelY + 9,
      panelWidth,
      panelHeight,
      this.hex(GAME_CONFIG.colors.wallShadow),
      0.72,
    );
    const panel = this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, this.hex(GAME_CONFIG.colors.dialoguePanel), 0.98)
      .setStrokeStyle(3, this.hex(GAME_CONFIG.colors.dialogueStroke), 0.58);
    const accent = this.add.rectangle(
      panelX,
      panelY - panelHeight / 2 + 7,
      panelWidth - 18,
      5,
      this.hex(GAME_CONFIG.colors.logoBlue),
      0.94,
    );
    const title = this.add
      .text(panelX, panelY - 72, "PAUSED", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "38px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
        align: "center",
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(panelX, panelY - 20, "The partners are quietly rereading the memo.", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "800",
        color: GAME_CONFIG.colors.wallInset,
        align: "center",
        wordWrap: { width: panelWidth - 60 },
      })
      .setOrigin(0.5);
    const resumeButton = this.createMenuButton(panelX, panelY + 70, 220, "CONTINUE", () => {
      this.resumeGame();
    });

    container.add([scrim, shadow, panel, accent, title, subtitle, resumeButton]);
    this.pauseMenu = { container, resumeButton };
    this.hidePauseMenu();
  }

  private createHudControls(): void {
    const boardRightX = this.boardOffsetX + this.boardWidth;
    this.pauseButton = this.createHudMiniButton(boardRightX - 72, 74, 34, "II", () => {
      this.pauseGame();
    });
    this.muteButton = this.createHudMiniButton(boardRightX - 28, 74, 42, "VOL", () => {
      this.toggleMute();
    });
    this.muteButtonText = this.muteButton.getData("label") as Phaser.GameObjects.Text;
    this.pauseButton.setDepth(82);
    this.muteButton.setDepth(82);
    this.syncHudControls();
  }

  private createHudMiniButton(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const height = 28;
    const background = this.add
      .rectangle(0, 0, width, height, this.hex(GAME_CONFIG.colors.dialoguePanel), 0.9)
      .setStrokeStyle(2, this.hex(GAME_CONFIG.colors.dialogueStroke), 0.5);
    const text = this.add
      .text(0, 1, label, {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
        align: "center",
      })
      .setOrigin(0.5);
    const button = this.add.container(x, y, [background, text]);
    button.setSize(width, height);
    background.setInteractive({ useHandCursor: true });
    background.on(Phaser.Input.Events.POINTER_OVER, () => {
      background.setFillStyle(this.hex(GAME_CONFIG.colors.logoBlue), 0.92);
      background.setStrokeStyle(2, this.hex(GAME_CONFIG.colors.hudText), 0.92);
    });
    background.on(Phaser.Input.Events.POINTER_OUT, () => {
      background.setFillStyle(this.hex(GAME_CONFIG.colors.dialoguePanel), 0.9);
      background.setStrokeStyle(2, this.hex(GAME_CONFIG.colors.dialogueStroke), 0.5);
    });
    background.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.unlockAudio();
      this.playSfx("button");
      onClick();
    });
    button.setData("hitTarget", background);
    button.setData("label", text);
    return button;
  }

  private drawResultIllustration(kind: ResultScreenKind): void {
    const art = this.endMenu.art;
    art.removeAll(true);

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2 - 80;
    const width = 540;
    const height = 214;
    const left = centerX - width / 2;
    const top = centerY - height / 2;
    const palette = FLOOR_THEMES[this.currentLevel - 1] ?? FLOOR_THEMES[0];
    const add = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
      art.add(object);
      return object;
    };

    add(this.add.rectangle(centerX + 5, centerY + 6, width, height, this.hex(GAME_CONFIG.colors.wallShadow), 0.58));
    add(this.add.rectangle(centerX, centerY, width, height, this.hex(palette.base), 1))
      .setStrokeStyle(2, this.hex(GAME_CONFIG.colors.dialogueStroke), 0.34);
    add(this.add.rectangle(centerX, top + 18, width - 22, 30, this.hex(palette.alt), 0.86));
    add(this.add.rectangle(centerX, top + height - 31, width - 22, 48, this.hex(palette.shadow), 0.72));

    for (let i = 0; i < 8; i += 1) {
      add(this.add.circle(left + 34 + i * 58, top + 42 + ((i + this.currentLevel) % 3) * 24, 1.6, this.hex(palette.detail), 0.18));
    }

    const drawTimmy = (x: number, y: number, texture = "player-right", scale = 2.35): void => {
      add(this.add.ellipse(x + 2, y + 41, 62, 14, this.hex(GAME_CONFIG.colors.wallShadow), 0.45));
      add(this.add.sprite(x, y, texture).setScale(scale).setDepth(2));
    };

    const label = (copy: string): void => {
      add(this.add.text(left + 20, top + 12, copy, {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
      }));
    };

    if (kind === "gameover") {
      label("THESIS COMMITTEE NOTES");
      add(this.add.rectangle(centerX - 56, centerY + 5, 90, 112, this.hex("#f2efe3"), 0.9));
      add(this.add.rectangle(centerX - 56, centerY - 37, 70, 5, this.hex(GAME_CONFIG.colors.hudAccent), 0.82));
      add(this.add.rectangle(centerX - 58, centerY - 17, 58, 3, this.hex("#5d6678"), 0.5));
      add(this.add.rectangle(centerX - 58, centerY - 3, 66, 3, this.hex("#5d6678"), 0.45));
      add(this.add.rectangle(centerX - 58, centerY + 11, 48, 3, this.hex("#5d6678"), 0.42));
      add(this.add.text(centerX - 94, centerY + 33, "PASS", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudAccent,
      }).setRotation(-0.15));
      drawTimmy(centerX + 110, centerY + 16, "player-left", 2.15);
      return;
    }

    if (kind === "won") {
      label("IPO GAUNTLET CLEARED");
      add(this.add.rectangle(centerX + 78, centerY + 30, 112, 14, this.hex("#41454f"), 1));
      add(this.add.rectangle(centerX + 78, centerY + 8, 26, 48, this.hex("#7a6f58"), 1));
      add(this.add.circle(centerX + 78, centerY - 30, 27, this.hex("#ffd166"), 1));
      add(this.add.circle(centerX + 78, centerY - 30, 17, this.hex("#f6a94b"), 0.92));
      add(this.add.rectangle(centerX + 78, centerY + 1, 60, 5, this.hex("#e6d3a0"), 1));
      add(this.add.text(centerX + 36, centerY + 47, "NYSE", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "13px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
      }));
      add(this.add.rectangle(left + 22, top + 58, 90, 22, this.hex("#151a23"), 0.86));
      add(this.add.text(left + 31, top + 62, "TMMY ↑", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: "#46e07d",
      }));
      drawTimmy(centerX - 86, centerY + 16, "player-right", 2.55);
      return;
    }

    const stage = STARTUP_LIFECYCLE[this.currentLevel - 1];
    label(stage.title.toUpperCase());

    if (this.currentLevel === 1) {
      add(this.add.rectangle(centerX + 92, centerY + 38, 176, 26, this.hex("#4d3628"), 1));
      add(this.add.rectangle(centerX + 36, centerY + 3, 50, 34, this.hex("#f2efe3"), 0.92));
      add(this.add.rectangle(centerX + 36, centerY - 7, 34, 3, this.hex(GAME_CONFIG.colors.logoBlue), 0.8));
      add(this.add.rectangle(centerX + 36, centerY + 5, 30, 2, this.hex("#9aa6bd"), 0.5));
      add(this.add.rectangle(centerX + 36, centerY + 14, 24, 2, this.hex("#9aa6bd"), 0.45));
      add(this.add.circle(centerX + 142, centerY - 8, 18, this.hex("#f6d365"), 0.92));
      add(this.add.rectangle(centerX + 142, centerY + 11, 17, 14, this.hex("#f2efe3"), 0.9));
      add(this.add.circle(centerX + 142, centerY - 8, 7, this.hex("#fff3b8"), 0.45));
      drawTimmy(centerX - 104, centerY + 22, "player-right", 3.05);
      return;
    }

    if (this.currentLevel === 2) {
      add(this.add.rectangle(centerX + 74, centerY + 4, 148, 72, this.hex("#eef2ff"), 0.92));
      add(this.add.rectangle(centerX + 74, centerY - 18, 118, 4, this.hex("#1a2536"), 0.55));
      add(this.add.text(centerX + 16, centerY - 7, "SEED CHECK", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "900",
        color: "#1a2536",
      }));
      add(this.add.rectangle(centerX + 48, centerY + 22, 58, 7, this.hex("#46e07d"), 0.8));
      add(this.add.rectangle(centerX - 18, centerY + 49, 170, 12, this.hex(GAME_CONFIG.colors.logoBlue), 0.35));
      add(this.add.rectangle(centerX - 36, centerY + 49, 116, 12, this.hex("#46e07d"), 0.58));
      drawTimmy(centerX - 116, centerY + 15, "player-right", 2.35);
      return;
    }

    if (this.currentLevel === 3) {
      const chartLeft = centerX + 18;
      const chartTop = centerY - 40;
      const chartRight = centerX + 150;
      const chartBottom = centerY + 42;
      const chartPoints = [
        { x: chartLeft + 16, y: chartBottom - 14 },
        { x: chartLeft + 46, y: chartBottom - 28 },
        { x: chartLeft + 78, y: chartBottom - 24 },
        { x: chartLeft + 112, y: chartBottom - 50 },
      ];

      add(this.add.rectangle(centerX + 84, centerY + 4, 156, 98, this.hex("#0b1423"), 0.92));
      add(this.add.text(chartLeft + 9, chartTop + 7, "RETENTION?", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "13px",
        fontStyle: "900",
        color: "#fff3b8",
      }));
      add(this.add.rectangle(chartLeft, chartTop + 28, 4, chartBottom - chartTop - 30, this.hex("#d7e7ff"), 0.35));
      add(this.add.rectangle((chartLeft + chartRight) / 2, chartBottom, chartRight - chartLeft, 3, this.hex("#d7e7ff"), 0.4));
      chartPoints.slice(1).forEach((point, index) => {
        const previousPoint = chartPoints[index];
        add(this.add.line(0, 0, previousPoint.x, previousPoint.y, point.x, point.y, this.hex("#46e07d"), 0.95).setLineWidth(4));
      });
      chartPoints.forEach((point) => {
        add(this.add.circle(point.x, point.y, 4, this.hex("#8be7c7"), 1));
      });
      drawTimmy(centerX - 116, centerY + 15, "player-right", 2.35);
      return;
    }

    add(this.add.rectangle(centerX + 78, centerY + 24, 170, 46, this.hex("#3b2d28"), 1));
    add(this.add.rectangle(centerX + 78, centerY + 24, 148, 28, this.hex("#5b4035"), 1));
    add(this.add.rectangle(centerX + 14, centerY - 44, 46, 34, this.hex("#121826"), 0.95));
    add(this.add.rectangle(centerX + 78, centerY - 44, 46, 34, this.hex("#121826"), 0.95));
    add(this.add.rectangle(centerX + 142, centerY - 44, 46, 34, this.hex("#121826"), 0.95));
    add(this.add.text(centerX - 8, centerY - 60, "MARKET MAP", {
      fontFamily: "DM Sans, Arial, sans-serif",
      fontSize: "14px",
      fontStyle: "900",
      color: GAME_CONFIG.colors.hudText,
    }));
    drawTimmy(centerX - 122, centerY + 18, "player-right", 2.35);
  }

  private createMenuButton(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const height = 40;
    const background = this.add
      .rectangle(0, 0, width, height, this.hex(GAME_CONFIG.colors.dialoguePanel), 0.96)
      .setStrokeStyle(2, this.hex(GAME_CONFIG.colors.dialogueStroke), 0.72);
    const text = this.add
      .text(0, 1, label, {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "17px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
      })
      .setOrigin(0.5);

    const button = this.add.container(x, y, [background, text]);
    button.setSize(width, height);
    background.setInteractive({ useHandCursor: true });
    background.on(Phaser.Input.Events.POINTER_OVER, () => {
      background.setFillStyle(this.hex(GAME_CONFIG.colors.logoBlue), 0.92);
      background.setStrokeStyle(2, this.hex(GAME_CONFIG.colors.hudText), 0.92);
    });
    background.on(Phaser.Input.Events.POINTER_OUT, () => {
      background.setFillStyle(this.hex(GAME_CONFIG.colors.dialoguePanel), 0.96);
      background.setStrokeStyle(2, this.hex(GAME_CONFIG.colors.dialogueStroke), 0.72);
    });
    background.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.unlockAudio();
      this.playSfx("button");
      onClick();
    });
    button.setData("hitTarget", background);
    return button;
  }

  private setMenuButtonVisible(button: Phaser.GameObjects.Container, visible: boolean): void {
    button.setVisible(visible);
    button.setActive(visible);
    const hitTarget = button.getData("hitTarget") as Phaser.GameObjects.Rectangle | undefined;
    if (hitTarget?.input) {
      hitTarget.input.enabled = visible;
    }
  }

  private addOutsidersLogo(x: number, y: number): Phaser.GameObjects.GameObject {
    if (this.textures.exists("outsiders-logo")) {
      return this.add
        .image(x, y - 1, "outsiders-logo")
        .setOrigin(0, 0)
        .setDisplaySize(262, 45)
        .setDepth(12);
    }

    const container = this.add.container(x, y);
    const blue = this.hex(GAME_CONFIG.colors.wall);
    const white = this.hex(GAME_CONFIG.colors.pellet);

    const mark = this.add.container(0, 0);
    mark.add([
      this.add.circle(11, 28, 11, blue),
      this.add.rectangle(34, 28, 15, 42, white).setOrigin(0, 0.5),
      this.add.rectangle(49, 7, 18, 17, white).setOrigin(0, 0),
      this.add.rectangle(49, 24, 18, 15, white).setOrigin(0, 0),
      this.add.rectangle(67, 7, 18, 17, white).setOrigin(0, 0),
    ]);

    const outsiders = this.add
      .text(100, 2, "OUTSIDERS", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
      })
      .setOrigin(0, 0);

    const fund = this.add
      .text(100, 26, "FUND", {
        fontFamily: "DM Sans, Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "900",
        color: GAME_CONFIG.colors.hudText,
      })
      .setOrigin(0, 0);

    const period = this.add.circle(168, 43, 5, blue);

    container.add([mark, outsiders, fund, period]);
    container.setDepth(12);
    return container;
  }

  private createDialogueUi(): void {
    const panelWidth = 680;
    const panelHeight = 132;
    const panelX = GAME_CONFIG.width / 2;
    const panelY = GAME_CONFIG.height - panelHeight / 2 - 22;
    const bodyOrigin = {
      x: panelX - panelWidth / 2 + 120,
      y: panelY - 18,
    };

    const container = this.add.container(0, 0).setDepth(40).setVisible(false);
    const panelShadow = this.add.rectangle(
      panelX + 7,
      panelY + 8,
      panelWidth,
      panelHeight,
      this.hex(GAME_CONFIG.colors.wallShadow),
      0.72,
    );
    const panel = this.add
      .rectangle(
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        this.hex(GAME_CONFIG.colors.dialoguePanel),
        0.96,
      )
      .setStrokeStyle(3, this.hex(GAME_CONFIG.colors.dialogueStroke), 0.45);
    const panelAccent = this.add.rectangle(
      panelX,
      panelY - panelHeight / 2 + 5,
      panelWidth - 14,
      4,
      this.hex(GAME_CONFIG.colors.logoBlue),
      0.86,
    );

    const portraitGlow = this.add
      .rectangle(panelX - panelWidth / 2 + 64, panelY, 90, 104, this.hex(GAME_CONFIG.colors.logoBlue), 0.2)
      .setStrokeStyle(2, this.hex(GAME_CONFIG.colors.logoBlue), 0.45);
    const portraitFrame = this.add
      .rectangle(panelX - panelWidth / 2 + 64, panelY, 82, 96, this.hex(GAME_CONFIG.colors.wallShadow), 1)
      .setStrokeStyle(2, this.hex(GAME_CONFIG.colors.dialogueStroke), 0.82);
    const portrait = this.add.image(portraitFrame.x, portraitFrame.y, "portrait-jonny").setDisplaySize(72, 84);
    const speaker = this.add.text(bodyOrigin.x, panelY - 52, "", {
      fontFamily: "DM Sans, Arial, sans-serif",
      fontSize: "20px",
      fontStyle: "900",
      color: GAME_CONFIG.colors.hudAccent,
      stroke: GAME_CONFIG.colors.dialoguePanel,
      strokeThickness: 2,
    });
    speaker.setShadow(2, 2, GAME_CONFIG.colors.wallShadow, 0, false, true);
    const bodyContainer = this.add.container(0, 0);
    const advanceGlyph = this.add.triangle(
      panelX + panelWidth / 2 - 34,
      panelY + panelHeight / 2 - 26,
      0,
      0,
      14,
      0,
      7,
      8,
      this.hex(GAME_CONFIG.colors.hudAccent),
    );

    container.add([
      panelShadow,
      panel,
      panelAccent,
      portraitGlow,
      portraitFrame,
      portrait,
      speaker,
      bodyContainer,
      advanceGlyph,
    ]);
    this.tweens.add({
      targets: advanceGlyph,
      y: advanceGlyph.y + 6,
      yoyo: true,
      repeat: -1,
      duration: 520,
      ease: "sine.inOut",
    });

    this.dialogue = {
      active: false,
      lineIndex: 0,
      revealedCharacters: 0,
      characterCarry: 0,
      container,
      panel,
      portraitFrame,
      portrait,
      speaker,
      bodyContainer,
      bodyRuns: [],
      plainText: "",
      bodyOrigin,
      bodyWidth: panelWidth - 178,
      advanceGlyph,
    };
  }

  private showDialogue(lines: DialogueLine[], onClose?: () => void): void {
    if (lines.length === 0) {
      return;
    }

    const paginatedLines = this.paginateDialogueLines(lines);
    this.registry.set("dialogueLines", paginatedLines);
    this.dialogueOnClose = onClose;
    this.dialogue.active = true;
    this.dialogue.lineIndex = 0;
    this.dialogue.revealedCharacters = 0;
    this.dialogue.characterCarry = 0;
    this.dialogue.container.setVisible(true);
    this.applyDialogueLine(paginatedLines[0]);
    this.syncHudControls();
  }

  private paginateDialogueLines(lines: DialogueLine[]): DialogueLine[] {
    return lines.flatMap((line) =>
      this.splitDialogueLineBySentence(line).flatMap((sentenceLine) => this.paginateDialogueLine(sentenceLine)),
    );
  }

  private splitDialogueLineBySentence(line: DialogueLine): DialogueLine[] {
    if (line.text.length < 150) {
      return [line];
    }

    const chunks: string[] = [];
    let startIndex = 0;
    let tagDepth = 0;
    let index = 0;

    while (index < line.text.length) {
      const openTag = line.text.slice(index).match(/^\[(wave|shake|em)\]/);
      if (openTag) {
        tagDepth += 1;
        index += openTag[0].length;
        continue;
      }

      const closeTag = line.text.slice(index).match(/^\[\/(wave|shake|em)\]/);
      if (closeTag) {
        tagDepth = Math.max(0, tagDepth - 1);
        index += closeTag[0].length;
        continue;
      }

      const character = line.text[index];
      const nextCharacter = line.text[index + 1];
      const previousCharacter = line.text[index - 1];
      const canSplitAtSentence =
        tagDepth === 0 &&
        (character === "." || character === "!" || character === "?") &&
        nextCharacter === " " &&
        previousCharacter !== ".";

      if (canSplitAtSentence) {
        chunks.push(line.text.slice(startIndex, index + 1).trim());
        startIndex = index + 2;
      }

      index += 1;
    }

    chunks.push(line.text.slice(startIndex).trim());

    const usefulChunks = this.combineShortDialogueSentenceChunks(chunks.filter(Boolean));
    if (usefulChunks.length <= 1) {
      return [line];
    }

    return usefulChunks.map((text) => ({
      ...line,
      text,
    }));
  }

  private combineShortDialogueSentenceChunks(chunks: string[]): string[] {
    const minimumWords = 7;
    const grouped: string[] = [];

    chunks.forEach((chunk) => {
      const wordCount = chunk.split(/\s+/).filter(Boolean).length;
      if (wordCount < minimumWords && grouped.length > 0) {
        grouped[grouped.length - 1] = `${grouped[grouped.length - 1]} ${chunk}`;
        return;
      }

      grouped.push(chunk);
    });

    if (grouped.length > 1) {
      const lastChunk = grouped[grouped.length - 1];
      const lastWordCount = lastChunk.split(/\s+/).filter(Boolean).length;
      if (lastWordCount < minimumWords) {
        grouped[grouped.length - 2] = `${grouped[grouped.length - 2]} ${lastChunk}`;
        grouped.pop();
      }
    }

    return grouped;
  }

  private paginateDialogueLine(line: DialogueLine): DialogueLine[] {
    const tokens = this.getDialogueTokens(line.text);
    if (tokens.length === 0) {
      return [line];
    }

    const pages: DialogueToken[][] = [];
    let page: DialogueToken[] = [];
    let lineIndex = 0;
    let x = 0;
    const pageWidth = this.dialogue.bodyWidth - DIALOGUE_PAGE_WIDTH_PADDING;

    const pushPage = (): void => {
      if (page.length === 0) {
        return;
      }

      pages.push(page);
      page = [];
      lineIndex = 0;
      x = 0;
    };

    tokens.forEach((token) => {
      if (token.text === "\n") {
        if (lineIndex >= DIALOGUE_MAX_BODY_LINES - 1) {
          pushPage();
          return;
        }

        lineIndex += 1;
        x = 0;
        return;
      }

      const wordWidth = this.measureDialogueWord(token.text, token.effect);
      if (x > 0 && x + wordWidth > pageWidth) {
        lineIndex += 1;
        x = 0;
      }

      if (lineIndex >= DIALOGUE_MAX_BODY_LINES) {
        pushPage();
      }

      page.push(token);
      x += wordWidth + DIALOGUE_SPACE_WIDTH;
    });

    pushPage();

    if (pages.length <= 1) {
      return [line];
    }

    return this.rebalanceDialoguePages(pages, pageWidth).map((tokensForPage) => ({
      ...line,
      text: this.serializeDialogueTokens(tokensForPage),
    }));
  }

  private rebalanceDialoguePages(pages: DialogueToken[][], pageWidth: number): DialogueToken[][] {
    const minimumLastPageWords = 7;
    const balancedPages = pages.map((page) => [...page]);

    for (let index = balancedPages.length - 1; index > 0; index -= 1) {
      const currentPage = balancedPages[index];
      const previousPage = balancedPages[index - 1];

      while (
        this.countDialogueWords(currentPage) < minimumLastPageWords &&
        this.countDialogueWords(previousPage) > minimumLastPageWords
      ) {
        const moveIndex = this.findLastMovableDialogueTokenIndex(previousPage);
        if (moveIndex < 0) {
          break;
        }

        const [token] = previousPage.splice(moveIndex, 1);
        currentPage.unshift(token);

        if (!this.dialogueTokensFitPage(currentPage, pageWidth)) {
          currentPage.shift();
          previousPage.splice(moveIndex, 0, token);
          break;
        }
      }
    }

    return balancedPages.filter((page) => page.length > 0);
  }

  private countDialogueWords(tokens: DialogueToken[]): number {
    return tokens.filter((token) => token.text !== "\n").length;
  }

  private findLastMovableDialogueTokenIndex(tokens: DialogueToken[]): number {
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
      if (tokens[index].text !== "\n") {
        return index;
      }
    }

    return -1;
  }

  private dialogueTokensFitPage(tokens: DialogueToken[], pageWidth: number): boolean {
    let lineIndex = 0;
    let x = 0;

    for (const token of tokens) {
      if (token.text === "\n") {
        lineIndex += 1;
        x = 0;
        if (lineIndex >= DIALOGUE_MAX_BODY_LINES) {
          return false;
        }
        continue;
      }

      const wordWidth = this.measureDialogueWord(token.text, token.effect);
      if (x > 0 && x + wordWidth > pageWidth) {
        lineIndex += 1;
        x = 0;
      }

      if (lineIndex >= DIALOGUE_MAX_BODY_LINES) {
        return false;
      }

      x += wordWidth + DIALOGUE_SPACE_WIDTH;
    }

    return true;
  }

  private getDialogueTokens(rawText: string): DialogueToken[] {
    return this.parseDialogueMarkup(rawText).flatMap((segment) =>
      segment.text
        .split(/(\n|\s+)/)
        .filter((token) => token === "\n" || (token.length > 0 && !/^\s+$/.test(token)))
        .map((token) => ({ text: token, effect: segment.effect })),
    );
  }

  private measureDialogueWord(text: string, effect: DialogueEffect): number {
    const measure = this.add
      .text(-9999, -9999, text, this.dialogueTextStyle(effect))
      .setVisible(false);
    const width = measure.width;
    measure.destroy();
    return width;
  }

  private serializeDialogueTokens(tokens: DialogueToken[]): string {
    const runs: Array<{ effect: DialogueEffect; words: string[] }> = [];

    tokens.forEach((token) => {
      const lastRun = runs[runs.length - 1];
      if (lastRun && lastRun.effect === token.effect) {
        lastRun.words.push(token.text);
        return;
      }

      runs.push({ effect: token.effect, words: [token.text] });
    });

    return runs
      .map((run) => {
        const text = run.words.join(" ");
        if (run.effect === "normal") {
          return text;
        }

        const tag = run.effect === "emphasis" ? "em" : run.effect;
        return `[${tag}]${text}[/${tag}]`;
      })
      .join(" ");
  }

  private updateDialogue(delta: number): void {
    const line = this.getCurrentDialogueLine();
    if (!line) {
      return;
    }

    const plainLength = this.dialogue.plainText.length;
    if (this.dialogue.revealedCharacters < plainLength) {
      this.dialogue.characterCarry += (delta / 1000) * 42;
      const charactersToReveal = Math.floor(this.dialogue.characterCarry);
      if (charactersToReveal > 0) {
        const previousRevealedCharacters = this.dialogue.revealedCharacters;
        this.dialogue.characterCarry -= charactersToReveal;
        this.dialogue.revealedCharacters = Math.min(plainLength, this.dialogue.revealedCharacters + charactersToReveal);
        this.syncDialogueTextReveal();
        this.maybePlayDialogueVoice(line, previousRevealedCharacters, this.dialogue.revealedCharacters);
      }
    }

    this.updateDialogueWordEffects(this.time.now);
    this.dialogue.advanceGlyph.setVisible(this.dialogue.revealedCharacters >= plainLength);
  }

  private handleDialogueInput(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.enter) && !Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      return;
    }

    this.advanceDialogue();
  }

  private advanceDialogue(): void {
    const line = this.getCurrentDialogueLine();
    const lines = this.registry.get("dialogueLines") as DialogueLine[];
    if (!line) {
      this.closeDialogue();
      return;
    }

    if (this.dialogue.revealedCharacters < this.dialogue.plainText.length) {
      this.dialogue.revealedCharacters = this.dialogue.plainText.length;
      this.syncDialogueTextReveal();
      this.dialogue.advanceGlyph.setVisible(true);
      return;
    }

    const nextIndex = this.dialogue.lineIndex + 1;
    if (nextIndex >= lines.length) {
      this.closeDialogue();
      return;
    }

    this.dialogue.lineIndex = nextIndex;
    this.applyDialogueLine(lines[nextIndex]);
  }

  private applyDialogueLine(line: DialogueLine): void {
    this.dialogue.revealedCharacters = 0;
    this.dialogue.characterCarry = 0;
    this.lastDialogueVoiceAt = this.time.now - 90;
    this.dialogueVoiceStep = 0;
    this.dialogue.speaker.setText(line.speaker);
    this.layoutDialogueBody(line.text);
    this.dialogue.portrait.setTexture(line.portraitKey ?? "portrait-jonny");
    this.dialogue.portrait.clearTint();
    if (line.portraitColor) {
      this.dialogue.portrait.setTint(this.hex(line.portraitColor));
    }
    this.dialogue.advanceGlyph.setVisible(false);
  }

  private layoutDialogueBody(rawText: string): void {
    this.clearDialogueBody();

    const segments = this.parseDialogueMarkup(rawText);
    this.dialogue.plainText = segments.map((segment) => segment.text).join("");

    let revealStart = 0;
    let x = this.dialogue.bodyOrigin.x;
    let y = this.dialogue.bodyOrigin.y;
    let runIndex = 0;

    segments.forEach((segment) => {
      const tokens = segment.text.split(/(\n|\s+)/).filter((token) => token.length > 0);
      tokens.forEach((token) => {
        if (token === "\n") {
          revealStart += 1;
          x = this.dialogue.bodyOrigin.x;
          y += DIALOGUE_LINE_HEIGHT;
          return;
        }

        if (/^\s+$/.test(token)) {
          x += DIALOGUE_SPACE_WIDTH * token.length;
          revealStart += token.length;
          return;
        }

        const word = this.add
          .text(0, 0, token, this.dialogueTextStyle(segment.effect, segment.accentVariant))
          .setVisible(false);
        const wordWidth = word.width;
        if (x > this.dialogue.bodyOrigin.x && x + wordWidth > this.dialogue.bodyOrigin.x + this.dialogue.bodyWidth) {
          x = this.dialogue.bodyOrigin.x;
          y += DIALOGUE_LINE_HEIGHT;
        }

        word.setPosition(x, y);
        this.dialogue.bodyContainer.add(word);
        this.dialogue.bodyRuns.push({
          text: word,
          fullText: token,
          revealStart,
          baseX: x,
          baseY: y,
          effect: segment.effect,
          index: runIndex,
        });

        x += wordWidth + 1;
        revealStart += token.length;
        runIndex += 1;
      });
    });

    this.syncDialogueTextReveal();
  }

  private clearDialogueBody(): void {
    this.dialogue.bodyContainer.removeAll(true);
    this.dialogue.bodyRuns = [];
    this.dialogue.plainText = "";
  }

  private parseDialogueMarkup(rawText: string): DialogueSegment[] {
    const segments: DialogueSegment[] = [];
    let effect: DialogueEffect = "normal";
    let buffer = "";
    let index = 0;
    let accentVariant = 0;

    const flush = (): void => {
      if (buffer.length === 0) {
        return;
      }

      segments.push({
        text: buffer,
        effect,
        accentVariant: effect === "normal" ? 0 : accentVariant,
      });
      if (effect !== "normal") {
        accentVariant += 1;
      }
      buffer = "";
    };

    while (index < rawText.length) {
      const openTag = rawText.slice(index).match(/^\[(wave|shake|em)\]/);
      if (openTag) {
        flush();
        effect = openTag[1] === "em" ? "emphasis" : (openTag[1] as DialogueEffect);
        index += openTag[0].length;
        continue;
      }

      const closeTag = rawText.slice(index).match(/^\[\/(wave|shake|em)\]/);
      if (closeTag) {
        flush();
        effect = "normal";
        index += closeTag[0].length;
        continue;
      }

      buffer += rawText[index];
      index += 1;
    }

    flush();
    return segments;
  }

  private dialogueTextStyle(
    effect: DialogueEffect,
    accentVariant = 0,
  ): Phaser.Types.GameObjects.Text.TextStyle {
    const accentColors: Record<Exclude<DialogueEffect, "normal">, string[]> = {
      emphasis: ["#fff3b8", "#bde9ff", "#ffc4b5"],
      wave: [GAME_CONFIG.colors.wallInset, "#fff3b8", "#8be7c7"],
      shake: [GAME_CONFIG.colors.hudAccent, "#ff9e68", "#f6d365"],
    };
    const color =
      effect === "normal"
        ? GAME_CONFIG.colors.hudText
        : accentColors[effect][accentVariant % accentColors[effect].length];

    return {
      fontFamily: "DM Sans, Arial, sans-serif",
      fontSize: "20px",
      fontStyle: effect === "emphasis" ? "900" : "700",
      color,
    };
  }

  private syncDialogueTextReveal(): void {
    this.dialogue.bodyRuns.forEach((run) => {
      const visibleCharacters = Phaser.Math.Clamp(
        this.dialogue.revealedCharacters - run.revealStart,
        0,
        run.fullText.length,
      );
      run.text.setVisible(visibleCharacters > 0);
      run.text.setText(run.fullText.slice(0, visibleCharacters));
    });
  }

  private updateDialogueWordEffects(time: number): void {
    this.dialogue.bodyRuns.forEach((run) => {
      run.text.setScale(1);
      run.text.setPosition(run.baseX, run.baseY);
      if (!run.text.visible) {
        return;
      }

      if (run.effect === "wave") {
        run.text.setScale(1.02);
        run.text.setY(run.baseY + Math.sin(time / 165 + run.index * 0.75) * 2);
        return;
      }

      if (run.effect === "shake") {
        run.text.setPosition(
          run.baseX + Math.sin(time / 34 + run.index * 2.1) * 2,
          run.baseY + Math.cos(time / 41 + run.index * 1.7) * 1.5,
        );
        return;
      }

      if (run.effect === "emphasis") {
        run.text.setScale(1.04);
        run.text.setY(run.baseY + Math.sin(time / 180 + run.index) * 1.2);
      }
    });
  }

  private getCurrentDialogueLine(): DialogueLine | null {
    const lines = this.registry.get("dialogueLines") as DialogueLine[] | undefined;
    return lines?.[this.dialogue.lineIndex] ?? null;
  }

  private closeDialogue(): void {
    this.dialogue.active = false;
    this.dialogue.container.setVisible(false);

    const onClose = this.dialogueOnClose;
    this.dialogueOnClose = undefined;
    this.syncHudControls();
    onClose?.();
  }

  private handleMovementInput(): void {
    if (this.cursors.left.isDown || this.keys.a.isDown) {
      this.queuedDirection = "left";
    } else if (this.cursors.right.isDown || this.keys.d.isDown) {
      this.queuedDirection = "right";
    } else if (this.cursors.up.isDown || this.keys.w.isDown) {
      this.queuedDirection = "up";
    } else if (this.cursors.down.isDown || this.keys.s.isDown) {
      this.queuedDirection = "down";
    }
  }

  private handleGlobalInput(): void {
    if (this.reviewMode) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
      this.playSfx("button");
      this.toggleMute();
    }
  }

  private handlePauseInput(): boolean {
    if (this.reviewMode) {
      return false;
    }

    const pressedPause = Phaser.Input.Keyboard.JustDown(this.keys.p) || Phaser.Input.Keyboard.JustDown(this.keys.escape);
    if (this.gameState === "paused") {
      if (pressedPause || Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
        this.playSfx("button");
        this.resumeGame();
        return true;
      }
      return false;
    }

    if (this.gameState === "playing" && pressedPause) {
      this.playSfx("button");
      this.pauseGame();
      return true;
    }

    return false;
  }

  private handleStartInput(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.enter) && !Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      return;
    }

    this.unlockAudio();
    this.playSfx("button");
    this.startGame();
  }

  private handleRestartInput(): void {
    if (this.gameState === "gameover" && Phaser.Input.Keyboard.JustDown(this.keys.c)) {
      this.playSfx("button");
      this.continueWithPityDeal();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this.playSfx("button");
      if (this.gameState === "levelclear") {
        this.finishLevel();
        return;
      }

      if (this.gameState === "gameover" && !this.hasUsedPityContinue) {
        this.continueWithPityDeal();
        return;
      }

      this.restartGame();
    }
  }

  private restartGame(): void {
    this.scene.restart({
      level: 1,
      score: 0,
      lives: GAME_CONFIG.startingLives,
      hasUsedPityContinue: false,
      hasShownPowerPelletRespawnDialogue: false,
      reviewMode: this.reviewMode,
      reviewScreen: this.reviewMode ? "map" : undefined,
    } satisfies PrototypeSceneData);
  }

  private continueWithPityDeal(): void {
    if (this.gameState !== "gameover" || this.hasUsedPityContinue) {
      return;
    }

    this.hasUsedPityContinue = true;
    this.gameState = "playing";
    this.setMusicMode("gameplay");
    this.lives = 1;
    this.lifeCooldownEndsAt = this.time.now + 1200;
    this.overlayText.setVisible(false);
    this.hideEndMenu();
    this.resetPositions();
    this.updateHud();
    this.showDialogue(PITY_RUNWAY_DIALOGUE, () => {
      this.openGhostGateAndRelease();
    });
  }

  private updatePowerMode(time: number): void {
    if (!this.isPowerModeActive(time)) {
      this.ghosts.forEach((ghost) => {
        if (!ghost.eaten && ghost.mode === "active") {
          ghost.sprite.setTexture(ghost.normalTexture);
          ghost.sprite.setAlpha(1);
        }
      });
      this.player.clearTint();
      return;
    }

    this.player.setTint(0xfff0a0);
    this.ghosts.forEach((ghost) => {
      if (!ghost.eaten && ghost.mode === "active") {
        ghost.sprite.setTexture(ghost.frightenedTexture);
        ghost.sprite.setAlpha(time > this.powerModeEndsAt - 2000 && Math.floor(time / 180) % 2 === 0 ? 0.72 : 1);
      }
    });
  }

  private movePlayer(delta: number): void {
    if (this.playerTargetTile) {
      this.moveSpriteTowardTile(this.player, this.playerTargetTile, GAME_CONFIG.playerSpeed, delta, () => {
        this.playerTile = this.normalizeTunnelArrival(this.playerTargetTile!);
        if (!this.sameTile(this.playerTile, this.playerTargetTile!)) {
          const world = this.tileToWorld(this.playerTile);
          this.player.setPosition(world.x, world.y);
        }
        this.playerTargetTile = null;
        this.collectAtTile(this.playerTile);
      });
      return;
    }

    if (this.canMove(this.playerTile, this.queuedDirection)) {
      this.currentDirection = this.queuedDirection;
    }

    if (!this.canMove(this.playerTile, this.currentDirection)) {
      this.currentDirection = "none";
      return;
    }

    this.playerTargetTile = this.nextTile(this.playerTile, this.currentDirection);
    this.player.setAngle(0);
    this.player.setTexture(this.playerTextureForDirection(this.currentDirection));
  }

  private playerTextureForDirection(direction: Direction): string {
    if (direction === "none") {
      return "player";
    }

    return `player-${direction}`;
  }

  private moveGhosts(delta: number, time: number): void {
    this.ghosts.forEach((ghost) => {
      if (ghost.mode === "returning") {
        if (time >= ghost.releaseAt) {
          this.moveReturningGhost(ghost, delta);
        }
        return;
      }

      if (ghost.eaten) {
        return;
      }

      if (time < ghost.releaseAt) {
        return;
      }

      const speed = this.isPowerModeActive(time)
        ? this.levelConfig.frightenedGhostSpeed
        : this.levelConfig.ghostSpeed;
      if (ghost.targetTile) {
        this.moveSpriteTowardTile(ghost.sprite, ghost.targetTile, speed, delta, () => {
          ghost.tile = this.normalizeTunnelArrival(ghost.targetTile!);
          if (!this.sameTile(ghost.tile, ghost.targetTile!)) {
            const world = this.tileToWorld(ghost.tile);
            ghost.sprite.setPosition(world.x, world.y);
          }
          ghost.targetTile = null;
        });
        return;
      }

      ghost.direction = this.chooseGhostDirection(ghost, time);
      ghost.targetTile = this.nextTile(ghost.tile, ghost.direction);
    });
  }

  private moveReturningGhost(ghost: GhostState, delta: number): void {
    if (ghost.targetTile) {
      this.moveSpriteTowardTile(ghost.sprite, ghost.targetTile, GAME_CONFIG.ghostReturnSpeed, delta, () => {
        ghost.tile = this.normalizeTunnelArrival(ghost.targetTile!);
        if (!this.sameTile(ghost.tile, ghost.targetTile!)) {
          const world = this.tileToWorld(ghost.tile);
          ghost.sprite.setPosition(world.x, world.y);
        }
        ghost.targetTile = null;

        if (this.sameTile(ghost.tile, ghost.startTile)) {
          this.settleGhostInPen(ghost);
        }
      });
      return;
    }

    if (this.sameTile(ghost.tile, ghost.startTile)) {
      this.settleGhostInPen(ghost);
      return;
    }

    const direction = this.findNextDirectionToward(ghost.tile, ghost.startTile, "ghost");
    if (direction === "none") {
      this.settleGhostInPen(ghost);
      return;
    }

    ghost.direction = direction;
    ghost.targetTile = this.nextTile(ghost.tile, direction);
  }

  private moveSpriteTowardTile(
    sprite: Phaser.GameObjects.Sprite,
    tile: GridPoint,
    speed: number,
    delta: number,
    onArrive: () => void,
  ): void {
    const target = this.tileToWorld(tile);
    const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y);
    const travel = (speed * delta) / 1000;

    if (distance <= travel) {
      sprite.setPosition(target.x, target.y);
      onArrive();
      return;
    }

    const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, target.x, target.y);
    sprite.x += Math.cos(angle) * travel;
    sprite.y += Math.sin(angle) * travel;
  }

  private chooseGhostDirection(ghost: GhostState, time: number): Direction {
    const options = this.validDirections(ghost.tile, "ghost").filter(
      (direction) => direction !== OPPOSITE_DIRECTION[ghost.direction],
    );
    const candidates = options.length > 0 ? options : this.validDirections(ghost.tile, "ghost");

    if (candidates.length === 0) {
      return "none";
    }

    const target = this.getGhostTarget(ghost, time);
    if (!this.isPowerModeActive(time) && Math.random() < this.levelConfig.chaseSkill) {
      const shortestPathDirection = this.findNextDirectionToward(ghost.tile, target, "ghost");
      if (shortestPathDirection !== "none" && this.canMove(ghost.tile, shortestPathDirection, "ghost")) {
        return shortestPathDirection;
      }
    }

    const ranked = [...candidates].sort((a, b) => {
      const tileA = this.nextTile(ghost.tile, a);
      const tileB = this.nextTile(ghost.tile, b);
      const distanceA = Phaser.Math.Distance.Squared(tileA.x, tileA.y, target.x, target.y);
      const distanceB = Phaser.Math.Distance.Squared(tileB.x, tileB.y, target.x, target.y);
      return this.isPowerModeActive(time) ? distanceB - distanceA : distanceA - distanceB;
    });

    return ranked[0];
  }

  private getGhostTarget(ghost: GhostState, time: number): GridPoint {
    if (this.isPowerModeActive(time)) {
      return { ...this.playerTile };
    }

    return { ...this.playerTile };
  }

  private collectAtTile(tile: GridPoint): void {
    const key = this.tileKey(tile);
    const pellet = this.pellets.get(key);
    if (pellet) {
      this.playSfx("pellet");
      pellet.destroy();
      this.pellets.delete(key);
      this.remainingDollarBills -= 1;
      this.score += GAME_CONFIG.scores.pellet;
      this.dollarScore += GAME_CONFIG.scores.pellet;
      this.checkWinCondition();
      return;
    }

    const powerPellet = this.powerPellets.get(key);
    if (powerPellet) {
      this.playSfx("power");
      powerPellet.destroy();
      this.powerPellets.delete(key);
      this.schedulePowerPelletRespawn();

      const activatePowerMode = (): void => {
        this.powerModeEndsAt = this.time.now + GAME_CONFIG.powerModeMs;
      };

      if (!this.hasShownPowerPelletDialogue) {
        this.hasShownPowerPelletDialogue = true;
        this.showDialogue(this.getPowerPelletDialogue(), activatePowerMode);
        return;
      }

      activatePowerMode();
    }
  }

  private getPowerPelletDialogue(): DialogueLine[] {
    return POWER_PELLET_DIALOGUE_BY_LEVEL[this.currentLevel - 1] ?? POWER_PELLET_DIALOGUE_BY_LEVEL[0];
  }

  private createCaptureLineDecks(source?: Partial<Record<PartnerId, string[]>>): Record<PartnerId, string[]> {
    const decks = {} as Record<PartnerId, string[]>;

    PARTNER_GHOSTS.forEach((partner) => {
      const savedDeck = source?.[partner.id];
      decks[partner.id] =
        savedDeck && savedDeck.length > 0
          ? [...savedDeck]
          : [...PARTNER_CAPTURE_LINES[partner.id]];
    });

    return decks;
  }

  private cloneCaptureLineDecks(): Record<PartnerId, string[]> {
    return this.createCaptureLineDecks(this.captureLineDecks);
  }

  private drawPartnerCaptureLine(partnerId: PartnerId): string {
    const deck = this.captureLineDecks[partnerId];
    if (deck.length === 0) {
      deck.push(...PARTNER_CAPTURE_LINES[partnerId]);
    }

    const index = Phaser.Math.Between(0, deck.length - 1);
    const [line] = deck.splice(index, 1);
    return line ?? PARTNER_CAPTURE_LINES[partnerId][0];
  }

  private checkGhostCollisions(time: number): void {
    if (time < this.lifeCooldownEndsAt) {
      return;
    }

    for (const ghost of this.ghosts) {
      if (ghost.eaten || ghost.mode !== "active" || this.gameState !== "playing") {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, ghost.sprite.x, ghost.sprite.y);
      if (distance > this.tileSize * 0.55) {
        continue;
      }

      if (this.isPowerModeActive(time)) {
        this.captureGhostInPowerMode(ghost);
        break;
      }

      this.loseLife(time, ghost);
      break;
    }
  }

  private captureGhostInPowerMode(ghost: GhostState): void {
    this.playSfx("partnerCapture");
    this.score += GAME_CONFIG.scores.ghost;
    this.updateHud();
    this.markGhostCaptured(ghost);

    const dialogueKey = `${this.currentLevel}:${ghost.id}`;
    if (this.shownCaptureDialogueKeys.has(dialogueKey)) {
      this.queueGhostReturnToPen(ghost);
      return;
    }

    this.shownCaptureDialogueKeys.add(dialogueKey);
    const powerPausedAt = this.time.now;
    this.showDialogue(this.getPartnerCaptureDialogue(ghost), () => {
      if (this.powerModeEndsAt > powerPausedAt) {
        this.powerModeEndsAt += this.time.now - powerPausedAt;
      }
      this.queueGhostReturnToPen(ghost, 180);
    });
  }

  private markGhostCaptured(ghost: GhostState): void {
    const capturedTile = this.nearestGhostTile(ghost);
    ghost.eaten = true;
    ghost.mode = "returning";
    ghost.sprite.setVisible(true);
    ghost.sprite.setAlpha(1);
    ghost.sprite.setDepth(12);
    ghost.sprite.setTexture(ghost.returnTexture);
    ghost.tile = { ...capturedTile };
    ghost.targetTile = null;
    ghost.direction = "none";
    ghost.releaseAt = Number.POSITIVE_INFINITY;
  }

  private getPartnerCaptureDialogue(ghost: GhostState): DialogueLine[] {
    const text = this.drawPartnerCaptureLine(ghost.id);
    return [
      {
        speaker: ghost.name,
        portraitKey: ghost.portraitKey,
        text,
      },
    ];
  }

  private queueGhostReturnToPen(ghost: GhostState, delayMs = 180): void {
    if (ghost.mode !== "returning") {
      return;
    }

    ghost.releaseAt = this.time.now + delayMs;
  }

  private settleGhostInPen(ghost: GhostState): void {
    const world = this.tileToWorld(ghost.startTile);
    ghost.sprite.setPosition(world.x, world.y);
    ghost.sprite.setTexture(ghost.normalTexture);
    ghost.sprite.setAlpha(0.78);
    ghost.sprite.setDepth(9);
    ghost.tile = { ...ghost.startTile };
    ghost.targetTile = null;
    ghost.direction = "none";
    ghost.mode = "pen";
    ghost.eaten = true;
    ghost.releaseAt = Number.POSITIVE_INFINITY;

    this.time.delayedCall(1000, () => {
      if (ghost.mode !== "pen") {
        return;
      }

      ghost.mode = "active";
      ghost.eaten = false;
      ghost.sprite.setAlpha(1);
      ghost.releaseAt = this.time.now + 650;
      ghost.direction = Phaser.Utils.Array.GetRandom(["left", "right"]);
    });
  }

  private loseLife(time: number, caughtBy?: GhostState): void {
    this.lives -= 1;
    this.lifeCooldownEndsAt = time + 1100;

    if (this.lives <= 0) {
      this.gameState = "gameover";
      this.showEndMenu("gameover");
      this.updateHud();
      return;
    }

    this.resetPositions();
    this.playSfx("caught");
    this.cameras.main.shake(180, 0.007);
    this.updateHud();

    if (caughtBy) {
      this.showDialogue(this.getPartnerCaughtDialogue(caughtBy), () => {
        this.openGhostGateAndRelease();
      });
      return;
    }

    this.openGhostGateAndRelease();
  }

  private getPartnerCaughtDialogue(ghost: GhostState): DialogueLine[] {
    const lines = PARTNER_CATCH_LINES[ghost.id];
    const text = lines[Phaser.Math.Between(0, lines.length - 1)] ?? lines[0];

    return [
      {
        speaker: ghost.name,
        portraitKey: ghost.portraitKey,
        text,
      },
    ];
  }

  private resetPositions(): void {
    const playerWorld = this.tileToWorld(this.playerStartTile);
    this.player.setPosition(playerWorld.x, playerWorld.y);
    this.playerTile = { ...this.playerStartTile };
    this.playerTargetTile = null;
    this.currentDirection = "none";
    this.queuedDirection = "none";
    this.powerModeEndsAt = 0;
    this.closeGhostGate();

    const resetDirections: Direction[] = ["left", "right", "up", "down"];
    this.ghosts.forEach((ghost, index) => {
      const ghostWorld = this.tileToWorld(ghost.startTile);
      ghost.sprite.setVisible(true);
      ghost.sprite.setAlpha(1);
      ghost.sprite.setTexture(ghost.normalTexture);
      ghost.sprite.setPosition(ghostWorld.x, ghostWorld.y);
      ghost.sprite.setDepth(9);
      ghost.tile = { ...ghost.startTile };
      ghost.targetTile = null;
      ghost.direction = resetDirections[index % resetDirections.length];
      ghost.eaten = false;
      ghost.mode = "active";
      ghost.releaseAt = Number.POSITIVE_INFINITY;
    });
  }

  private checkWinCondition(): void {
    if (this.dollarScore < this.dollarScoreTarget) {
      return;
    }

    if (!this.hasShownClearDialogue) {
      this.hasShownClearDialogue = true;
      this.showDialogue(this.getLevelClearDialogue(), () => {
        if (this.currentLevel >= LEVEL_CONFIGS.length) {
          this.finishWin();
          return;
        }

        this.showLevelPassedScreen();
      });
      return;
    }

    if (this.currentLevel >= LEVEL_CONFIGS.length) {
      this.finishWin();
      return;
    }

    this.showLevelPassedScreen();
  }

  private showLevelPassedScreen(): void {
    this.gameState = "levelclear";
    this.overlayText.setVisible(false);
    this.showEndMenu("levelclear");
    this.updateHud();
  }

  private finishLevel(): void {
    if (this.currentLevel >= LEVEL_CONFIGS.length) {
      this.finishWin();
      return;
    }

    this.scene.restart({
      level: this.currentLevel + 1,
      score: this.score,
      lives: this.lives,
      hasUsedPityContinue: this.hasUsedPityContinue,
      hasShownPowerPelletRespawnDialogue: this.hasShownPowerPelletRespawnDialogue,
      captureLineDecks: this.cloneCaptureLineDecks(),
      reviewMode: this.reviewMode,
      reviewScreen: this.reviewMode ? "map" : undefined,
    } satisfies PrototypeSceneData);
  }

  private finishWin(): void {
    this.gameState = "won";
    this.showEndMenu("won");
  }

  private createStartMenuUi(): void {
    const container = this.add.container(0, 0).setDepth(60).setVisible(false);
    const skyTop = "#163758";
    const skyMid = "#255f8b";
    const skyBridge = "#3f80a7";
    const skyLow = "#75a7c6";
    const grass = "#2fac88";
    const grassDark = "#1b7e6d";
    const dirt = "#675660";
    const dirtDark = "#443941";

    const startButton = this.createMenuButton(GAME_CONFIG.width / 2, 604, 244, "START GAME", () => {
      this.startGame();
    });

    const add = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
      container.add(object);
      return object;
    };

    add(this.add.rectangle(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, GAME_CONFIG.width, GAME_CONFIG.height, this.hex(skyTop), 1));
    add(this.add.rectangle(GAME_CONFIG.width / 2, 188, GAME_CONFIG.width, 226, this.hex(skyMid), 0.78));
    add(this.add.rectangle(GAME_CONFIG.width / 2, 296, GAME_CONFIG.width, 176, this.hex(skyBridge), 0.44));
    add(this.add.rectangle(GAME_CONFIG.width / 2, 396, GAME_CONFIG.width, 204, this.hex(skyLow), 0.52));
    add(this.add.rectangle(GAME_CONFIG.width / 2, 504, GAME_CONFIG.width, 64, this.hex("#214d73"), 0.38));

    for (let i = 0; i < 46; i += 1) {
      const x = (i * 53 + 31) % GAME_CONFIG.width;
      const y = 26 + ((i * 29) % 210);
      const star = add(this.add.rectangle(
        x,
        y,
        i % 3 === 0 ? 3 : 2,
        i % 4 === 0 ? 3 : 2,
        this.hex(GAME_CONFIG.colors.hudText),
        i % 5 === 0 ? 0.82 : 0.38,
      ));
      this.tweens.add({
        targets: star,
        alpha: i % 5 === 0 ? 0.28 : 0.1,
        scale: i % 4 === 0 ? 1.45 : 1.18,
        duration: 980 + (i % 7) * 160,
        delay: (i % 9) * 110,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }

    const cloudOne = this.drawPixelCloud(container, 112, 112, 1.2);
    const cloudTwo = this.drawPixelCloud(container, 612, 96, 1);
    const cloudThree = this.drawPixelCloud(container, 690, 180, 0.72);
    this.tweens.add({ targets: cloudOne, x: cloudOne.x + 62, duration: 18000, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.tweens.add({ targets: cloudTwo, x: cloudTwo.x - 74, duration: 22000, yoyo: true, repeat: -1, ease: "sine.inOut" });
    this.tweens.add({ targets: cloudThree, x: cloudThree.x + 48, duration: 15000, yoyo: true, repeat: -1, ease: "sine.inOut" });

    this.drawStartScreenMidground(container);

    add(this.add.rectangle(GAME_CONFIG.width / 2, 536, GAME_CONFIG.width, 62, this.hex(grass), 1));
    add(this.add.rectangle(GAME_CONFIG.width / 2, 564, GAME_CONFIG.width, 30, this.hex(grassDark), 1));
    this.drawSwayingTitleGrass(container);
    add(this.add.rectangle(GAME_CONFIG.width / 2, 590, GAME_CONFIG.width, 34, this.hex("#716069"), 1));
    add(this.add.rectangle(GAME_CONFIG.width / 2, 650, GAME_CONFIG.width, 120, this.hex(dirt), 1));
    for (let i = 0; i < 44; i += 1) {
      add(this.add.rectangle((i * 41) % GAME_CONFIG.width, 588 + ((i * 19) % 104), 18, 7, this.hex(dirtDark), 0.46));
    }

    add(this.add.rectangle(118, 515, 142, 18, this.hex("#272f42"), 1));
    add(this.add.rectangle(116, 504, 118, 16, this.hex(GAME_CONFIG.colors.logoBlue), 0.88));
    const titleTimmy = add(this.add.sprite(80, 484, "player-title").setScale(1.22));
    add(this.add.rectangle(138, 473, 42, 28, this.hex("#e9f2ff"), 0.95).setStrokeStyle(2, this.hex("#173250"), 0.65));
    add(this.add.rectangle(138, 466, 28, 3, this.hex(GAME_CONFIG.colors.logoBlue), 0.85));
    add(this.add.rectangle(131, 482, 7, 4, this.hex("#46e07d"), 0.9));
    add(this.add.rectangle(140, 478, 7, 8, this.hex("#46e07d"), 0.9));
    add(this.add.rectangle(149, 474, 7, 12, this.hex("#46e07d"), 0.9));

    add(this.add.rectangle(692, 516, 188, 18, this.hex("#272f42"), 1));
    add(this.add.rectangle(692, 497, 144, 36, this.hex("#152942"), 0.92).setStrokeStyle(2, this.hex(GAME_CONFIG.colors.wall), 0.72));
    const titlePartners = [
      add(this.add.sprite(632, 497, "ghost-austin").setScale(2.42)),
      add(this.add.sprite(672, 497, "ghost-teddy").setScale(2.42)),
      add(this.add.sprite(712, 497, "ghost-george").setScale(2.42)),
      add(this.add.sprite(752, 497, "ghost-kira").setScale(2.42)),
    ];
    this.tweens.add({ targets: titleTimmy, y: titleTimmy.y - 4, scaleY: 1.27, duration: 960, yoyo: true, repeat: -1, ease: "sine.inOut" });
    titlePartners.forEach((partner, index) => {
      this.tweens.add({
        targets: partner,
        y: partner.y - 3,
        scaleY: 2.5,
        duration: 900 + index * 90,
        delay: index * 120,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    });

    const titleShadow = add(this.add.text(GAME_CONFIG.width / 2 + 4, 172 + 5, "TIMMY", {
      fontFamily: "DM Sans, Arial, sans-serif",
      fontSize: "78px",
      fontStyle: "900",
      color: "#102035",
      align: "center",
    }).setOrigin(0.5));
    const titleMain = add(this.add.text(GAME_CONFIG.width / 2, 172, "TIMMY", {
      fontFamily: "DM Sans, Arial, sans-serif",
      fontSize: "78px",
      fontStyle: "900",
      color: GAME_CONFIG.colors.hudText,
      stroke: GAME_CONFIG.colors.logoBlue,
      strokeThickness: 8,
      align: "center",
    }).setOrigin(0.5));
    const subtitleShadow = add(this.add.text(GAME_CONFIG.width / 2 + 3, 242 + 4, "VS. THE WORLD", {
      fontFamily: "DM Sans, Arial, sans-serif",
      fontSize: "43px",
      fontStyle: "900",
      color: "#102035",
      align: "center",
    }).setOrigin(0.5));
    const subtitleMain = add(this.add.text(GAME_CONFIG.width / 2, 242, "VS. THE WORLD", {
      fontFamily: "DM Sans, Arial, sans-serif",
      fontSize: "43px",
      fontStyle: "900",
      color: GAME_CONFIG.colors.logoBlue,
      stroke: GAME_CONFIG.colors.hudText,
      strokeThickness: 4,
      align: "center",
    }).setOrigin(0.5));
    [titleShadow, titleMain, subtitleShadow, subtitleMain].forEach((text, index) => {
      const settledY = text.y;
      text.setAlpha(0);
      text.setY(settledY - 118);
      this.tweens.add({
        targets: text,
        y: settledY,
        alpha: 1,
        duration: 1460,
        delay: 360 + index * 150,
        ease: "back.out(1.12)",
        onComplete: () => {
          this.tweens.add({
            targets: text,
            y: settledY + 3,
            duration: 1400 + index * 120,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        },
      });
    });

    const titleDescription = add(this.add.text(GAME_CONFIG.width / 2, 326, "A journey through startupland: traction, pivots, and the art of being politely passed on.", {
      fontFamily: "DM Sans, Arial, sans-serif",
      fontSize: "18px",
      fontStyle: "800",
      color: GAME_CONFIG.colors.hudText,
      align: "center",
      wordWrap: { width: 610 },
    }).setOrigin(0.5));
    titleDescription.setAlpha(0);
    this.tweens.add({ targets: titleDescription, alpha: 1, y: titleDescription.y + 6, duration: 780, delay: 1320, ease: "sine.out" });
    const pressPrompt = add(this.add.text(GAME_CONFIG.width / 2, 652, "PRESS ENTER / SPACE", {
      fontFamily: "DM Sans, Arial, sans-serif",
      fontSize: "14px",
      fontStyle: "900",
      color: GAME_CONFIG.colors.wallInset,
      stroke: GAME_CONFIG.colors.dialoguePanel,
      strokeThickness: 3,
      align: "center",
    }).setOrigin(0.5));
    this.tweens.add({ targets: pressPrompt, alpha: 0.45, duration: 680, yoyo: true, repeat: -1, ease: "sine.inOut" });

    container.add(startButton);
    startButton.setAlpha(0);
    this.tweens.add({ targets: startButton, alpha: 1, y: 604, duration: 560, delay: 1520, ease: "back.out" });
    this.startMenu = { container, startButton };
    this.setMenuButtonVisible(startButton, false);
  }

  private drawPixelCloud(container: Phaser.GameObjects.Container, x: number, y: number, scale: number): Phaser.GameObjects.Container {
    const cloud = this.add.container(x, y);
    const shadow = this.hex("#7aa9c7");
    const white = this.hex(GAME_CONFIG.colors.hudText);
    const addRect = (rx: number, ry: number, width: number, height: number, color: number, alpha = 1): void => {
      cloud.add(this.add.rectangle(rx * scale, ry * scale, width * scale, height * scale, color, alpha));
    };

    addRect(0, 14, 92, 12, shadow, 0.5);
    addRect(-34, 20, 64, 14, white, 0.86);
    addRect(12, 12, 86, 18, white, 0.9);
    addRect(48, 3, 56, 20, white, 0.86);
    addRect(80, 19, 58, 12, white, 0.82);
    container.add(cloud);
    return cloud;
  }

  private drawSwayingTitleGrass(container: Phaser.GameObjects.Container): void {
    const tuftXs = [
      34, 58, 92, 126, 168, 204, 238, 276, 312, 354, 392, 430, 468, 506,
      548, 584, 626, 664, 704, 742, 782,
    ];
    const bladeColors = ["#70d6ba", "#4ec8a9", "#279d87", "#8ce0c7"];

    tuftXs.forEach((x, tuftIndex) => {
      const baseY = 546 + ((tuftIndex * 7) % 19);
      const tuft = this.add.container(x, baseY);
      const bladeCount = 3 + (tuftIndex % 3);

      for (let i = 0; i < bladeCount; i += 1) {
        const height = 10 + ((tuftIndex + i * 3) % 12);
        const offsetX = (i - (bladeCount - 1) / 2) * 3;
        const blade = this.add.rectangle(
          offsetX,
          0,
          2,
          height,
          this.hex(bladeColors[(tuftIndex + i) % bladeColors.length]),
          0.72,
        ).setOrigin(0.5, 1);

        blade.setRotation(Phaser.Math.DegToRad(-16 + i * 10 + (tuftIndex % 2) * 3));
        tuft.add(blade);
      }

      container.add(tuft);
      this.tweens.add({
        targets: tuft,
        rotation: Phaser.Math.DegToRad(tuftIndex % 2 === 0 ? 3.5 : -3.5),
        x: x + (tuftIndex % 2 === 0 ? 2 : -2),
        duration: 1300 + (tuftIndex % 5) * 180,
        delay: (tuftIndex % 7) * 105,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    });
  }

  private drawStartScreenMidground(container: Phaser.GameObjects.Container): void {
    const add = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
      container.add(object);
      return object;
    };
    const drawSteppedHill = (baseY: number, color: string, alpha: number, steps: Array<{ x: number; width: number; height: number }>): void => {
      steps.forEach((step) => {
        add(this.add.rectangle(
          step.x + step.width / 2,
          baseY - step.height / 2,
          step.width,
          step.height,
          this.hex(color),
          alpha,
        ));
      });
    };

    add(this.add.rectangle(GAME_CONFIG.width / 2, 432, GAME_CONFIG.width, 122, this.hex("#143c5d"), 0.18));
    drawSteppedHill(510, "#153b5e", 0.38, [
      { x: 0, width: 74, height: 46 },
      { x: 74, width: 78, height: 64 },
      { x: 152, width: 86, height: 88 },
      { x: 238, width: 74, height: 70 },
      { x: 312, width: 88, height: 96 },
      { x: 400, width: 70, height: 60 },
      { x: 470, width: 94, height: 78 },
      { x: 564, width: 86, height: 104 },
      { x: 650, width: 76, height: 66 },
      { x: 726, width: 74, height: 84 },
    ]);
    drawSteppedHill(506, "#1a4d73", 0.24, [
      { x: 26, width: 84, height: 32 },
      { x: 110, width: 64, height: 54 },
      { x: 190, width: 88, height: 40 },
      { x: 306, width: 80, height: 58 },
      { x: 432, width: 94, height: 38 },
      { x: 548, width: 72, height: 62 },
      { x: 670, width: 104, height: 42 },
    ]);

    const cards = [
      { x: 166, y: 396, w: 86, h: 34 },
      { x: 326, y: 414, w: 104, h: 42 },
      { x: 520, y: 392, w: 96, h: 36 },
      { x: 636, y: 432, w: 78, h: 34 },
    ];
    cards.forEach((card, index) => {
      const color = index % 2 === 0 ? "#224f77" : "#1c486d";
      add(this.add.rectangle(card.x, card.y, card.w, card.h, this.hex(color), 0.2)
        .setStrokeStyle(1, this.hex("#8cc8ec"), 0.16));
      add(this.add.rectangle(card.x - card.w / 2 + 18, card.y - 8, card.w - 34, 3, this.hex("#8cc8ec"), 0.15));
      add(this.add.rectangle(card.x - card.w / 2 + 20, card.y + 6, card.w - 48, 3, this.hex("#8cc8ec"), 0.1));
    });

    [
      { x: 92, y: 470, w: 76 },
      { x: 264, y: 452, w: 92 },
      { x: 472, y: 468, w: 82 },
      { x: 686, y: 446, w: 74 },
    ].forEach((line) => {
      add(this.add.rectangle(line.x, line.y, line.w, 3, this.hex("#9ed0ed"), 0.09));
      add(this.add.rectangle(line.x - line.w / 2 + 12, line.y + 12, Math.max(24, line.w - 34), 3, this.hex("#9ed0ed"), 0.07));
    });
  }

  private updateHud(): void {
    this.stageText.setText(HUD_STAGE_NAMES[this.currentLevel - 1] ?? `LEVEL ${this.currentLevel}`);
    this.levelText.setText(`LEVEL ${this.currentLevel}`);
    this.tractionText.setText(`TRACTION ${this.dollarScore}/${this.dollarScoreTarget}`);
    this.scoreText.setText(`VANITY SCORE ${this.score}`);
    this.livesText.setText(`LIVES ${this.lives}`);
    const powerLeft = Math.max(0, this.powerModeEndsAt - this.time.now);
    this.statusText.setText(powerLeft > 0 ? "PIVOT" : "");
    this.syncHudControls();
  }

  private showEndMenu(kind: ResultScreenKind): void {
    const canContinue = kind === "gameover" && !this.hasUsedPityContinue;
    const isLevelClear = kind === "levelclear";
    const isWon = kind === "won";

    this.setMusicMode(kind === "gameover" ? "silent" : "result");
    this.playSfx(kind === "gameover" ? "gameOver" : isWon ? "gameClear" : "levelWin");
    this.overlayText.setVisible(false);
    this.endMenu.title.setText(
      kind === "gameover" ? "THESIS REJECTED" : isWon ? "GAME CLEARED" : "LEVEL PASSED",
    );
    this.endMenu.title.setColor(kind === "gameover" ? GAME_CONFIG.colors.hudAccent : GAME_CONFIG.colors.hudText);
    this.drawResultIllustration(kind);
    this.endMenu.subtitle.setText(this.getResultScreenSubtitle(kind));
    this.endMenu.stats.setText(`TRACTION ${this.dollarScore}/${this.dollarScoreTarget}   •   VANITY SCORE ${this.score}`);

    this.setMenuButtonVisible(this.endMenu.continueButton, canContinue);
    this.setMenuButtonVisible(this.endMenu.nextButton, isLevelClear);
    this.setMenuButtonVisible(this.endMenu.restartButton, kind === "gameover" || isWon || isLevelClear);

    const buttonY = GAME_CONFIG.height / 2 + 216;
    if (canContinue) {
      this.endMenu.continueButton.setPosition(GAME_CONFIG.width / 2 - 144, buttonY);
      this.endMenu.restartButton.setPosition(GAME_CONFIG.width / 2 + 144, buttonY);
    } else if (isLevelClear) {
      this.endMenu.nextButton.setPosition(GAME_CONFIG.width / 2 - 124, buttonY);
      this.endMenu.restartButton.setPosition(GAME_CONFIG.width / 2 + 124, buttonY);
    } else {
      this.endMenu.restartButton.setPosition(GAME_CONFIG.width / 2, buttonY);
    }

    this.endMenu.container.setVisible(true);
  }

  private getResultScreenSubtitle(kind: ResultScreenKind): string {
    if (kind === "gameover") {
      return this.hasUsedPityContinue
        ? "The nepotism runway has burned off. Timmy must now experience consequences."
        : "The partners passed. There is, however, one deeply awkward backup plan.";
    }

    if (kind === "won") {
      return "IPO unlocked. Timmy is now legally required to say platform shift on every podcast.";
    }

    return LEVEL_PASSED_SCREEN_COPY[this.currentLevel - 1] ?? LEVEL_PASSED_SCREEN_COPY[0];
  }

  private hideEndMenu(): void {
    this.endMenu.container.setVisible(false);
    this.setMenuButtonVisible(this.endMenu.continueButton, false);
    this.setMenuButtonVisible(this.endMenu.nextButton, false);
    this.setMenuButtonVisible(this.endMenu.restartButton, false);
  }

  private showPauseMenu(): void {
    this.pauseMenu.container.setVisible(true);
    this.setMenuButtonVisible(this.pauseMenu.resumeButton, true);
  }

  private hidePauseMenu(): void {
    this.pauseMenu.container.setVisible(false);
    this.setMenuButtonVisible(this.pauseMenu.resumeButton, false);
  }

  private pauseGame(): void {
    if (this.gameState !== "playing" || (this.dialogue?.active ?? false) || this.startTransitionActive) {
      return;
    }

    this.pauseStartedAt = this.time.now;
    this.gameState = "paused";
    this.setMusicMode("silent");
    this.setPendingTimersPaused(true);
    this.showPauseMenu();
    this.syncHudControls();
    this.updateHud();
  }

  private resumeGame(): void {
    if (this.gameState !== "paused") {
      return;
    }

    const pausedFor = Math.max(0, this.time.now - this.pauseStartedAt);
    if (pausedFor > 0) {
      if (this.powerModeEndsAt > this.pauseStartedAt) {
        this.powerModeEndsAt += pausedFor;
      }
      if (this.lifeCooldownEndsAt > this.pauseStartedAt) {
        this.lifeCooldownEndsAt += pausedFor;
      }
      this.ghosts.forEach((ghost) => {
        if (Number.isFinite(ghost.releaseAt) && ghost.releaseAt > this.pauseStartedAt) {
          ghost.releaseAt += pausedFor;
        }
      });
    }

    this.pauseStartedAt = 0;
    this.gameState = "playing";
    this.setPendingTimersPaused(false);
    this.hidePauseMenu();
    this.syncGameplayMusic(this.time.now);
    this.syncHudControls();
    this.updateHud();
  }

  private setPendingTimersPaused(paused: boolean): void {
    if (this.pendingPowerPelletRespawn) {
      this.pendingPowerPelletRespawn.paused = paused;
    }
    if (this.pendingPowerPelletRespawnDialogue) {
      this.pendingPowerPelletRespawnDialogue.paused = paused;
    }
  }

  private toggleMute(): void {
    PrototypeScene.sharedMuted = !PrototypeScene.sharedMuted;
    this.applyMuteState();
    this.syncHudControls();
  }

  private applyMuteState(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = PrototypeScene.sharedMuted ? 0 : GAME_CONFIG.audio.masterVolume;
    }
  }

  private syncHudControls(): void {
    if (!this.pauseButton || !this.muteButton || !this.muteButtonText) {
      return;
    }

    const canShowControls = !this.reviewMode;
    const dialogueActive = this.dialogue?.active ?? false;
    const canPause = canShowControls && this.gameState === "playing" && !dialogueActive && !this.startTransitionActive;
    const canMute = canShowControls;
    this.setMenuButtonVisible(this.pauseButton, canPause);
    this.setMenuButtonVisible(this.muteButton, canMute);
    this.muteButtonText.setText(PrototypeScene.sharedMuted ? "OFF" : "VOL");
    this.muteButtonText.setColor(PrototypeScene.sharedMuted ? GAME_CONFIG.colors.hudAccent : GAME_CONFIG.colors.hudText);
  }

  private exposeDebugState(): void {
    if (!import.meta.env.DEV || typeof window === "undefined") {
      return;
    }

    window.__OUTSIDERS_DEBUG__ = () => this.getDebugState();
    this.syncDebugState();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      delete window.__OUTSIDERS_DEBUG__;
      delete document.body.dataset.outsidersDebug;
    });
  }

  private syncDebugState(): void {
    if (!import.meta.env.DEV || typeof document === "undefined") {
      return;
    }

    document.body.dataset.outsidersDebug = JSON.stringify(this.getDebugState());
  }

  private getDebugState(): OutsidersDebugState {
    return {
      score: this.score,
      dollarScore: this.dollarScore,
      lives: this.lives,
      currentLevel: this.currentLevel,
      playerTile: { ...this.playerTile },
      currentDirection: this.currentDirection,
      queuedDirection: this.queuedDirection,
      remainingCollectibles: this.remainingDollarBills,
      scoreTarget: this.dollarScoreTarget,
      gameState: this.gameState,
      dialogueActive: this.dialogue?.active ?? false,
      powerModeRemainingMs: Math.max(0, Math.round(this.powerModeEndsAt - this.time.now)),
      ghosts: this.ghosts.map((ghost) => ({
        name: ghost.name,
        tile: { ...ghost.tile },
        eaten: ghost.eaten,
        mode: ghost.mode,
      })),
    };
  }

  private findNextDirectionToward(start: GridPoint, target: GridPoint, mover: "player" | "ghost"): Direction {
    if (this.sameTile(start, target)) {
      return "none";
    }

    const startKey = this.tileKey(start);
    const targetKey = this.tileKey(target);
    const queue: GridPoint[] = [{ ...start }];
    const visited = new Set<string>([startKey]);
    const previous = new Map<string, { from: string; direction: Direction }>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentKey = this.tileKey(current);

      if (currentKey === targetKey) {
        break;
      }

      (["up", "down", "left", "right"] as Direction[]).forEach((direction) => {
        if (!this.canMove(current, direction, mover)) {
          return;
        }

        const next = this.normalizeTunnelArrival(this.nextTile(current, direction));
        const nextKey = this.tileKey(next);
        if (visited.has(nextKey)) {
          return;
        }

        visited.add(nextKey);
        previous.set(nextKey, { from: currentKey, direction });
        queue.push(next);
      });
    }

    if (!previous.has(targetKey)) {
      return "none";
    }

    let stepKey = targetKey;
    let step = previous.get(stepKey)!;
    while (step.from !== startKey) {
      stepKey = step.from;
      step = previous.get(stepKey)!;
    }

    return step.direction;
  }

  private isPowerModeActive(time: number): boolean {
    return time < this.powerModeEndsAt;
  }

  private canMove(tile: GridPoint, direction: Direction, mover: "player" | "ghost" = "player"): boolean {
    if (direction === "none") {
      return false;
    }

    if (this.isTunnelExit(tile, direction)) {
      return true;
    }

    return !this.isBlocked(this.nextTile(tile, direction), mover);
  }

  private validDirections(tile: GridPoint, mover: "player" | "ghost" = "player"): Direction[] {
    return (["up", "down", "left", "right"] as Direction[]).filter((direction) => this.canMove(tile, direction, mover));
  }

  private nextTile(tile: GridPoint, direction: Direction): GridPoint {
    const vector = DIRECTION_VECTORS[direction];
    return {
      x: tile.x + vector.x,
      y: tile.y + vector.y,
    };
  }

  private isTunnelExit(tile: GridPoint, direction: Direction): boolean {
    if (direction === "none") {
      return false;
    }

    if (this.tileAt(tile) !== "T") {
      return false;
    }

    const next = this.nextTile(tile, direction);

    if (direction === "left" || direction === "right") {
      if (next.x >= 0 && next.x < MAZE_LAYOUT[0].length) {
        return false;
      }

      const oppositeX = next.x < 0 ? MAZE_LAYOUT[0].length - 1 : 0;
      return this.tileAt({ x: oppositeX, y: tile.y }) === "T";
    }

    if (next.y >= 0 && next.y < MAZE_LAYOUT.length) {
      return false;
    }

    const oppositeY = next.y < 0 ? MAZE_LAYOUT.length - 1 : 0;
    return this.tileAt({ x: tile.x, y: oppositeY }) === "T";
  }

  private normalizeTunnelArrival(tile: GridPoint): GridPoint {
    if (tile.x < 0) {
      return { x: MAZE_LAYOUT[0].length - 1, y: tile.y };
    }

    if (tile.x >= MAZE_LAYOUT[0].length) {
      return { x: 0, y: tile.y };
    }

    if (tile.y < 0) {
      return { x: tile.x, y: MAZE_LAYOUT.length - 1 };
    }

    if (tile.y >= MAZE_LAYOUT.length) {
      return { x: tile.x, y: 0 };
    }

    return { ...tile };
  }

  private sameTile(a: GridPoint, b: GridPoint): boolean {
    return a.x === b.x && a.y === b.y;
  }

  private isBlocked(tile: GridPoint, mover: "player" | "ghost"): boolean {
    if (tile.x < 0 || tile.y < 0 || tile.y >= MAZE_LAYOUT.length || tile.x >= MAZE_LAYOUT[0].length) {
      return true;
    }

    const key = this.tileKey(tile);
    if (mover === "ghost") {
      return this.walls.has(key);
    }

    return this.playerBlockedTiles.has(key);
  }

  private tileAt(tile: GridPoint): string | null {
    if (tile.x < 0 || tile.y < 0 || tile.y >= MAZE_LAYOUT.length || tile.x >= MAZE_LAYOUT[0].length) {
      return null;
    }

    return MAZE_LAYOUT[tile.y][tile.x];
  }

  private tileToWorld(tile: GridPoint): GridPoint {
    return {
      x: this.boardOffsetX + tile.x * this.tileSize + this.tileSize / 2,
      y: this.boardOffsetY + tile.y * this.tileSize + this.tileSize / 2,
    };
  }

  private worldToTile(x: number, y: number): GridPoint {
    return {
      x: Phaser.Math.Clamp(Math.round((x - this.boardOffsetX - this.tileSize / 2) / this.tileSize), 0, MAZE_LAYOUT[0].length - 1),
      y: Phaser.Math.Clamp(Math.round((y - this.boardOffsetY - this.tileSize / 2) / this.tileSize), 0, MAZE_LAYOUT.length - 1),
    };
  }

  private nearestGhostTile(ghost: GhostState): GridPoint {
    const tile = this.worldToTile(ghost.sprite.x, ghost.sprite.y);
    return this.isBlocked(tile, "ghost") ? { ...ghost.tile } : tile;
  }

  private tileKey(tile: GridPoint): string {
    return `${tile.x},${tile.y}`;
  }
}
