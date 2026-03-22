import Phaser from 'phaser';
import { BaseGameScene } from './BaseGameScene';
import { Enemy } from '../entities/Enemy';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

const DECK_Y = GAME_HEIGHT - 100;

export class PoliceShipScene extends BaseGameScene {
  protected levelKey    = 'PoliceShip' as const;
  protected enemyCount  = 8;
  protected worldWidth  = GAME_WIDTH;
  protected worldHeight = GAME_HEIGHT + 300;
  protected hasFallDeath = true;
  protected respawnX    = GAME_WIDTH * 0.15;
  protected respawnY    = DECK_Y - 48;

  private water!: Phaser.GameObjects.Rectangle;

  constructor() { super('PoliceShipScene'); }

  protected createWorld() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.4,  GAME_WIDTH, GAME_HEIGHT * 0.8, 0x003366);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.85, GAME_WIDTH, GAME_HEIGHT * 0.3, 0x004488);

    this.water = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, GAME_WIDTH, 80, 0x0077cc, 0.75);
    this.tweens.add({ targets: this.water, alpha: 0.5, duration: 900, yoyo: true, repeat: -1 });
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH, 6, 0x0099ff, 0.9);

    this.groundGroup = this.physics.add.staticGroup();

    // Main deck
    this.makeTile(GAME_WIDTH / 2, DECK_Y + 16, GAME_WIDTH, 32);
    // Below-deck walkway
    this.makeTile(GAME_WIDTH / 2, GAME_HEIGHT - 8, Math.round(GAME_WIDTH * 0.75), 16, 'platform');

    // Hull side walls
    this.add.rectangle(40,            GAME_HEIGHT - 60, 32, 120, 0x335577);
    this.add.rectangle(GAME_WIDTH - 40, GAME_HEIGHT - 60, 32, 120, 0x335577);
    // Mast
    this.add.rectangle(GAME_WIDTH / 2, DECK_Y - 80, 6, 160, 0x554433);
    this.add.text(GAME_WIDTH / 2, DECK_Y - 160, '🚢', { fontSize: '24px' }).setOrigin(0.5);
  }

  protected spawnEnemies() {
    // Main deck is full-width — world-bounds patrol is fine
    [120, 320, 600, 800].forEach(x =>
      this.enemies.add(new Enemy(this, x, DECK_Y - 40, 'monster')),
    );
    // Below-deck walkway spans x=120–840; clamp patrol so ghosts can't walk off the ends
    const walkLeft  = 140;
    const walkRight = 820;
    [240, 440, 640, 840].forEach(x => {
      const e = new Enemy(this, x, GAME_HEIGHT - 64, 'ghost');
      e.patrolLeft  = walkLeft;
      e.patrolRight = walkRight;
      this.enemies.add(e);
    });
  }

  update(time: number, delta: number) {
    super.update(time, delta);
    this.water.y = GAME_HEIGHT - 20 + Math.sin(time / 600) * 3;
  }
}
