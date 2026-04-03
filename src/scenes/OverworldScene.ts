import Phaser from 'phaser';
import { LEVELS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import type { LevelKey } from '../config/constants';
import { gameState } from '../systems/GameState';
import { t } from '../i18n/i18n';

const LEVEL_POSITIONS: Record<LevelKey, { x: number; y: number }> = {
  CityStreets:  { x: 120, y: 360 },
  PoliceCastle: { x: 260, y: 280 },
  GhostCastle:  { x: 400, y: 220 },
  Train:        { x: 560, y: 260 },
  PoliceShip:   { x: 700, y: 320 },
  CarRoad:      { x: 840, y: 380 },
};

const LEVEL_SCENE: Record<LevelKey, string> = {
  CityStreets:  'CityStreetsScene',
  PoliceCastle: 'PoliceCastleScene',
  GhostCastle:  'GhostCastleScene',
  Train:        'TrainScene',
  PoliceShip:   'PoliceShipScene',
  CarRoad:      'CarRoadScene',
};

export class OverworldScene extends Phaser.Scene {
  private selectedIndex = 0;
  private unlockedLevels: LevelKey[] = [];
  private nodeCircles: Phaser.GameObjects.Arc[] = [];

  constructor() { super('OverworldScene'); }

  create() {
    this.selectedIndex = 0;
    this.nodeCircles   = [];
    this.unlockedLevels = LEVELS.filter(l => gameState.unlockedLevels.has(l));

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2d4a22);

    this.add.text(GAME_WIDTH / 2, 30, 'Select Level', {
      fontFamily: 'monospace', fontSize: '28px',
      color: '#ffdd44', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Path between nodes
    const path = this.add.graphics();
    path.lineStyle(3, 0xbbaa88, 0.7);
    const positions = LEVELS.map(l => LEVEL_POSITIONS[l]);
    for (let i = 1; i < positions.length; i++) {
      path.strokeLineShape(new Phaser.Geom.Line(
        positions[i - 1].x, positions[i - 1].y,
        positions[i].x,     positions[i].y,
      ));
    }

    LEVELS.forEach((level, i) => {
      const pos      = LEVEL_POSITIONS[level];
      const unlocked = gameState.unlockedLevels.has(level);
      const stars    = gameState.levelStars[level] ?? 0;

      const circle = this.add.circle(pos.x, pos.y, 22, unlocked ? 0x3388ff : 0x334455);
      this.nodeCircles.push(circle);

      // Level number inside node
      this.add.text(pos.x, pos.y, String(i + 1), {
        fontFamily: 'monospace', fontSize: '16px',
        color: unlocked ? '#ffffff' : '#555566',
      }).setOrigin(0.5);

      // Level name below node
      this.add.text(pos.x, pos.y + 30, t(`levels.${level}`), {
        fontFamily: 'monospace', fontSize: '12px',
        color: unlocked ? '#ffffff' : '#556655',
        align: 'center',
      }).setOrigin(0.5, 0);

      if (stars > 0) {
        this.add.text(pos.x, pos.y - 34, '★'.repeat(stars), {
          fontFamily: 'monospace', fontSize: '12px', color: '#ffdd44',
        }).setOrigin(0.5);
      }

      if (unlocked) {
        circle.setInteractive(new Phaser.Geom.Circle(0, 0, 26), Phaser.Geom.Circle.Contains);
        circle.on('pointerover',  () => { this.selectedIndex = this.unlockedLevels.indexOf(level); this.refreshHighlight(); });
        circle.on('pointerdown',  () => this.enterLevel(level));
        const zone = this.add.zone(pos.x, pos.y + 42, 100, 28).setInteractive();
        zone.on('pointerdown', () => this.enterLevel(level));
      }
    });

    this.refreshHighlight();

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT',  () => this.moveSelection(-1));
    kb.on('keydown-RIGHT', () => this.moveSelection(1));
    kb.on('keydown-ENTER', () => this.enterSelected());
    kb.on('keydown-SPACE', () => this.enterSelected());

    this.add.text(GAME_WIDTH - 16, 16, `❤ ${gameState.lives}`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff6677',
    }).setOrigin(1, 0);

    const hint = this.sys.game.device.input.touch
      ? 'Tap a level to play'
      : '← → to select   ENTER to play';
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, hint, {
      fontFamily: 'monospace', fontSize: '12px', color: '#aaaaaa',
    }).setOrigin(0.5, 1);
  }

  private moveSelection(dir: -1 | 1) {
    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex + dir, 0, this.unlockedLevels.length - 1);
    this.refreshHighlight();
  }

  private refreshHighlight() {
    LEVELS.forEach((level, i) => {
      const unlocked   = gameState.unlockedLevels.has(level);
      const isSelected = this.unlockedLevels[this.selectedIndex] === level;
      if (unlocked) this.nodeCircles[i].setFillStyle(isSelected ? 0xffdd44 : 0x3388ff);
    });
  }

  private enterSelected() {
    const level = this.unlockedLevels[this.selectedIndex];
    if (level) this.enterLevel(level);
  }

  private enterLevel(level: LevelKey) {
    this.scene.start(LEVEL_SCENE[level]);
  }
}
