import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { Parrot } from '../entities/Parrot';
import { CompanionAI } from '../entities/CompanionAI';
import { InputManager } from '../systems/InputManager';
import { TouchControls } from '../systems/TouchControls';
import { gameState } from '../systems/GameState';
import { GAME_WIDTH, GAME_HEIGHT, DEFAULT_WORLD_WIDTH, LEVELS, LEVEL_SCENE_MAP } from '../config/constants';
import type { LevelKey } from '../config/constants';

export abstract class BaseGameScene extends Phaser.Scene {
  protected player1!: Player;
  protected player2!: Player;
  protected parrot!: Parrot;
  protected bullets!: Phaser.Physics.Arcade.Group;
  protected enemies!: Phaser.Physics.Arcade.Group;
  protected controls!: InputManager;
  protected companionAI!: CompanionAI;

  /** Subclasses can override to make the physics/camera world wider */
  protected worldWidth: number = DEFAULT_WORLD_WIDTH;

  /** Extend below GAME_HEIGHT so players can fall off platforms (fall-death levels) */
  protected worldHeight: number = GAME_HEIGHT;

  /** Set true in subclasses where falling off platforms kills the player */
  protected hasFallDeath = false;

  /** Spawn position used when respawning after a fall */
  protected respawnX = GAME_WIDTH * 0.15;
  protected respawnY = GAME_HEIGHT - 80;

  /** Subclasses set this to expose the terrain group for collision setup */
  protected groundGroup?: Phaser.Physics.Arcade.StaticGroup;

  protected abstract levelKey: LevelKey;
  protected abstract enemyCount: number;
  private arrested = 0;
  private levelDone = false;

  /** Override to false in wave-based levels until all waves have spawned */
  protected get allEnemiesSpawned(): boolean { return true; }

  create() {
    this.arrested = 0;
    this.levelDone = false;

    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 20,
      runChildUpdate: true,
    });
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.controls = new InputManager(this);
    this.companionAI = new CompanionAI();

    this.createWorld();
    this.setupPlayers();
    this.spawnEnemies();
    this.setupCamera();
    this.setupCollisions();

    this.parrot = new Parrot(this, this.player1);

    this.scene.launch('HUDScene', { levelKey: this.levelKey });
    // Give HUDScene one frame to register its event listener, then send initial count
    this.time.delayedCall(50, () =>
      this.events.emit('enemy-arrested', this.enemies.countActive(true)),
    );
    this.deliverParrotItem();

    if (this.sys.game.device.input.touch) {
      const tc = new TouchControls(this);
      this.controls.setTouchControls(tc);
      this.showTouchOverlay();
    }
  }

  protected abstract createWorld(): void;
  protected abstract spawnEnemies(): void;

  /**
   * Create a static physics tile whose collision body matches its display size.
   * setDisplaySize + refreshBody alone only repositions the body; it leaves the
   * body width/height at the original frame size (32×32 or 32×16). Calling
   * body.setSize() first fixes that.
   */
  protected makeTile(x: number, y: number, w: number, h: number, key: 'ground' | 'platform' = 'ground') {
    const tile = this.groundGroup!.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
    tile.setDisplaySize(w, h);
    (tile.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h);
    tile.refreshBody();
    return tile;
  }

  protected setupPlayers() {
    this.player1 = new Player(this, GAME_WIDTH * 0.15, GAME_HEIGHT - 48, 1, this.bullets);
    this.player2 = new Player(this, GAME_WIDTH * 0.22, GAME_HEIGHT - 48, 2, this.bullets);
  }

  protected setupCamera() {
    this.cameras.main.setBounds(0, 0, this.worldWidth, GAME_HEIGHT);
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    if (this.worldWidth > GAME_WIDTH) {
      // Scrolling level: follow player with a slight lead
      this.cameras.main.startFollow(this.player1, false, 0.12, 0);
      this.cameras.main.setFollowOffset(-GAME_WIDTH * 0.15, 0);
    }
    // Single-screen level: camera is fixed — no follow needed
  }

  protected setupCollisions() {
    if (this.groundGroup) {
      this.physics.add.collider(this.player1, this.groundGroup);
      this.physics.add.collider(this.player2, this.groundGroup);
      this.physics.add.collider(this.enemies,  this.groundGroup);
      this.physics.add.collider(this.bullets,  this.groundGroup, (_b) => {
        (_b as Phaser.Physics.Arcade.Sprite).setActive(false).setVisible(false);
      });
    }

    // Bullet hits enemy → stun
    this.physics.add.overlap(this.bullets, this.enemies, (bulletObj, enemyObj) => {
      const bullet = bulletObj as Bullet;
      const enemy  = enemyObj as Enemy;
      if (!enemy.isStunned && !enemy.isArrested) {
        enemy.stun();
        bullet.setActive(false).setVisible(false);
        this.showArrestPrompt(enemy);
      }
    });
  }

  private showArrestPrompt(enemy: Enemy) {
    const icon = this.add.text(enemy.x, enemy.y - 14, '👮', { fontSize: '8px' })
      .setOrigin(0.5, 1);

    const timer = this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        // Clean up if enemy was removed or recovered from stun
        if (!enemy.active || !enemy.isStunned) { icon.destroy(); timer.remove(); return; }
        // Track enemy movement so the icon stays above them
        icon.setPosition(enemy.x, enemy.y - 14);
        const d1 = Phaser.Math.Distance.Between(this.player1.x, this.player1.y, enemy.x, enemy.y);
        const d2 = Phaser.Math.Distance.Between(this.player2.x, this.player2.y, enemy.x, enemy.y);
        if (d1 < 28 || d2 < 28) {
          icon.destroy();
          timer.remove();
          this.doArrest(enemy);
        }
      },
    });
  }

  private doArrest(enemy: Enemy) {
    if (!enemy.active || enemy.isArrested) return;

    // Commit the arrest NOW (stun was validated when the player walked close).
    // Using force=true so expiry during the 500ms animation can't block it.
    if (!enemy.arrest(true)) return;

    this.arrested++;
    this.events.emit('enemy-arrested', this.enemies.countActive(true));

    // Play the handcuffs visual, then check win condition
    const cuffs = this.add.image(enemy.x, enemy.y, 'handcuffs').setScale(1.5);
    this.tweens.add({
      targets: cuffs,
      alpha: 0, scaleX: 3, scaleY: 3,
      duration: 500,
      onComplete: () => {
        cuffs.destroy();
        if (this.arrested >= this.enemyCount || this.enemies.countActive(true) === 0) {
          this.levelComplete();
        }
      },
    });
  }

  private deliverParrotItem() {
    this.time.delayedCall(5000, () => {
      if (!this.scene.isActive()) return;
      const item = gameState.nextParrotItem;
      this.parrot.deliverItem(item, () => gameState.advanceParrotItem());
    });
  }

  protected levelComplete() {
    if (this.levelDone) return;
    this.levelDone = true;

    gameState.completeLevel(this.levelKey, 3);
    this.scene.stop('HUDScene');
    this.showLevelCompleteOverlay();
  }

  private showLevelCompleteOverlay() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(200);

    this.add.text(cx, cy - 50, '⭐ ⭐ ⭐', { fontSize: '42px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(201);

    this.add.text(cx, cy + 10, 'Level Complete!', {
      fontFamily: 'monospace', fontSize: '30px',
      color: '#ffdd44', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    this.add.text(cx, cy + 56, 'Get ready…', {
      fontFamily: 'monospace', fontSize: '16px',
      color: '#ffffff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    this.time.delayedCall(2500, () => {
      const idx = LEVELS.indexOf(this.levelKey);
      if (idx < LEVELS.length - 1) {
        this.scene.start(LEVEL_SCENE_MAP[LEVELS[idx + 1]]);
      } else {
        this.scene.start('OverworldScene');
      }
    });
  }

  /** Called when players fail the level (gate breached, etc.). Loses a life and restarts. */
  protected levelFail() {
    if (this.levelDone) return;
    this.levelDone = true;

    gameState.loseLife();
    this.scene.stop('HUDScene');

    if (gameState.lives <= 0) {
      this.scene.start('GameOverScene');
      return;
    }

    this.showFailOverlay();
  }

  private showFailOverlay() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x220000, 0.75)
      .setScrollFactor(0).setDepth(200);

    this.add.text(cx, cy - 30, '💀 Level Failed!', {
      fontFamily: 'monospace', fontSize: '28px',
      color: '#ff4444', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    this.add.text(cx, cy + 20, `Lives left: ${'❤'.repeat(gameState.lives)}`, {
      fontFamily: 'monospace', fontSize: '20px',
      color: '#ffffff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    this.time.delayedCall(2200, () => {
      this.scene.start(LEVEL_SCENE_MAP[this.levelKey]);
    });
  }

  private showTouchOverlay() {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const SPLIT_Y  = H * 0.4;   // 216
    const SPLIT_X1 = W / 3;     // 320
    const SPLIT_X2 = (W * 2) / 3; // 640
    const DEPTH = 300;

    const g = this.add.graphics().setScrollFactor(0).setDepth(DEPTH);

    // Zone fills
    g.fillStyle(0x4488ff, 0.12); g.fillRect(0,        0,       W,              SPLIT_Y);           // jump
    g.fillStyle(0x44ff88, 0.12); g.fillRect(0,        SPLIT_Y, SPLIT_X1,       H - SPLIT_Y);       // left
    g.fillStyle(0xff8833, 0.15); g.fillRect(SPLIT_X1, SPLIT_Y, SPLIT_X2 - SPLIT_X1, H - SPLIT_Y); // fire
    g.fillStyle(0x44ff88, 0.12); g.fillRect(SPLIT_X2, SPLIT_Y, W - SPLIT_X2,  H - SPLIT_Y);       // right

    // Zone dividers
    g.lineStyle(1, 0xffffff, 0.25);
    g.strokeLineShape(new Phaser.Geom.Line(0,        SPLIT_Y, W,        SPLIT_Y)); // horizontal split
    g.strokeLineShape(new Phaser.Geom.Line(SPLIT_X1, SPLIT_Y, SPLIT_X1, H));      // left|fire
    g.strokeLineShape(new Phaser.Geom.Line(SPLIT_X2, SPLIT_Y, SPLIT_X2, H));      // fire|right

    const labelStyle = {
      fontFamily: 'monospace', fontSize: '22px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 3, alpha: 0.8,
    };

    const labels = [
      this.add.text(W / 2,              SPLIT_Y / 2,         '↑  JUMP',  labelStyle).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 1),
      this.add.text(SPLIT_X1 / 2,       SPLIT_Y + (H - SPLIT_Y) / 2, '◄  LEFT',  labelStyle).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 1),
      this.add.text((SPLIT_X1 + SPLIT_X2) / 2, SPLIT_Y + (H - SPLIT_Y) / 2, '●  FIRE',  labelStyle).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 1),
      this.add.text(SPLIT_X2 + (W - SPLIT_X2) / 2, SPLIT_Y + (H - SPLIT_Y) / 2, 'RIGHT  ►', labelStyle).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 1),
    ];

    const targets = [g, ...labels];

    // Hold for 2 s, then fade over 1 s
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets,
        alpha: 0,
        duration: 1000,
        onComplete: () => targets.forEach(t => t.destroy()),
      });
    });
  }

  private respawnPlayer(player: Player) {
    player.setPosition(this.respawnX, this.respawnY);
    (player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  update(_time: number, delta: number) {
    if (this.levelDone) return;

    // Continuous win check: catches cases where the last enemy is removed outside doArrest
    if (this.allEnemiesSpawned && this.enemies.countActive(true) === 0 && this.arrested > 0) {
      this.levelComplete();
      return;
    }

    const p1Input = this.controls.getP1();
    this.player1.update(p1Input, delta);

    if (gameState.playerMode === 1) {
      const aiInput = this.companionAI.generate(this.player2, this.player1, this.enemies, delta);
      this.player2.update(aiInput, delta);
    } else {
      this.player2.update(this.controls.getP2(), delta);
    }

    this.parrot.update(null, delta);
    this.enemies.getChildren().forEach(e => (e as Enemy).update(null, delta));

    // Fall detection for levels with gaps (Train, PoliceShip)
    if (this.hasFallDeath) {
      if (this.player1.y > GAME_HEIGHT + 60) this.respawnPlayer(this.player1);
      if (this.player2.y > GAME_HEIGHT + 60) this.respawnPlayer(this.player2);
    }
  }
}
