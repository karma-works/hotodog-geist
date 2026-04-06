import { BaseGameScene } from './BaseGameScene';
import { Enemy } from '../entities/Enemy';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

// Balcony platforms
const BALCONY_Y   = 390;
const BALCONY_W   = 200;
// Upper gallery
const GALLERY_Y   = 240;
const GALLERY_W   = 680;

export class CastleInteriorScene extends BaseGameScene {
  protected levelKey   = 'CastleInterior' as const;
  protected enemyCount = 9;
  protected worldWidth = GAME_WIDTH;

  private wavesSpawned = 0;
  protected get allEnemiesSpawned(): boolean { return this.wavesSpawned >= 3; }

  constructor() { super('CastleInteriorScene'); }

  create() {
    super.create();
    this.time.delayedCall(15000, () => this.spawnWave(2));
    this.time.delayedCall(30000, () => this.spawnWave(3));
  }

  protected createWorld() {
    // Castle background darkened for an interior feel
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_castle');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000022, 0.55);

    this.groundGroup = this.physics.add.staticGroup();

    // Ground floor
    this.makeTile(GAME_WIDTH / 2, GAME_HEIGHT - 8, GAME_WIDTH, 32);

    // Left and right balconies
    this.makeTile(100, BALCONY_Y, BALCONY_W, 16, 'platform');
    this.makeTile(860, BALCONY_Y, BALCONY_W, 16, 'platform');

    // Upper gallery
    this.makeTile(GAME_WIDTH / 2, GALLERY_Y, GALLERY_W, 16, 'platform');

    // Decorative stone pillars
    [240, 720].forEach(x =>
      this.add.rectangle(x, GAME_HEIGHT - 120, 22, 240, 0x2a2040),
    );

    // Throne at center of upper gallery
    this.add.rectangle(GAME_WIDTH / 2, GALLERY_Y + 8, 80, 14, 0x996633);
    this.add.text(GAME_WIDTH / 2, GALLERY_Y - 8, '👑', { fontSize: '18px' }).setOrigin(0.5);

    // Torch flames on left/right walls
    [50, 910].forEach(x => {
      const torchY = GAME_HEIGHT - 120;
      this.add.rectangle(x, torchY + 10, 6, 20, 0x664422);
      const flame = this.add.circle(x, torchY - 4, 8, 0xff8800);
      this.tweens.add({
        targets: flame, scaleX: 0.7, alpha: 0.6,
        duration: 220 + Math.random() * 180,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });

    // Balcony torch accents
    [100, 860].forEach(x => {
      const flame = this.add.circle(x, BALCONY_Y - 20, 5, 0xff9900);
      this.tweens.add({
        targets: flame, scaleY: 0.6, alpha: 0.5,
        duration: 300 + Math.random() * 150,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });

    this.add.text(GAME_WIDTH / 2, 18, '🏰 Castle Interior', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ddbbff',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0);
  }

  protected spawnEnemies() {
    // Wave 1: 3 ghosts patrolling the ground floor
    this.wavesSpawned = 1;
    [200, 480, 760].forEach(x =>
      this.enemies.add(new Enemy(this, x, GAME_HEIGHT - 48, 'ghost')),
    );
  }

  private spawnWave(wave: number) {
    if (!this.scene.isActive()) return;
    this.wavesSpawned = wave;

    const showBanner = (msg: string) => {
      const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, msg, {
        fontFamily: 'monospace', fontSize: '18px', color: '#cc88ff',
        stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
      this.tweens.add({
        targets: label, alpha: 0, y: label.y - 30, duration: 1800,
        onComplete: () => label.destroy(),
      });
    };

    const fadeIn = (ghost: Enemy) => {
      ghost.setAlpha(0);
      this.enemies.add(ghost);
      this.tweens.add({ targets: ghost, alpha: 1, duration: 1200 });
    };

    if (wave === 2) {
      showBanner('👻 Spirits seep through the walls!');

      // Left balcony ghost (x=0–200)
      const gLeft = new Enemy(this, 80, BALCONY_Y - 28, 'ghost');
      gLeft.patrolLeft = 20;  gLeft.patrolRight = 180;

      // Right balcony ghost (x=760–960)
      const gRight = new Enemy(this, 880, BALCONY_Y - 28, 'ghost');
      gRight.patrolLeft = 780; gRight.patrolRight = 940;

      // Upper gallery ghost
      const gUp = new Enemy(this, GAME_WIDTH / 2, GALLERY_Y - 28, 'ghost');
      gUp.patrolLeft = 160; gUp.patrolRight = 800;

      [gLeft, gRight, gUp].forEach(fadeIn);

    } else if (wave === 3) {
      showBanner('👻 More spirits materialize!');

      // Left half of upper gallery
      const g1 = new Enemy(this, 220, GALLERY_Y - 28, 'ghost');
      g1.patrolLeft = 160; g1.patrolRight = 490;

      // Right half of upper gallery
      const g2 = new Enemy(this, 740, GALLERY_Y - 28, 'ghost');
      g2.patrolLeft = 470; g2.patrolRight = 800;

      // Extra ground ghost
      const g3 = new Enemy(this, 480, GAME_HEIGHT - 48, 'ghost');

      [g1, g2, g3].forEach(fadeIn);
    }

    // Refresh HUD enemy count after the new ghosts are added
    this.events.emit('enemy-arrested', this.enemies.countActive(true));
  }
}
