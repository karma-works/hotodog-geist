import Phaser from 'phaser';
import { STUN_DURATION_MS } from '../config/constants';

export type EnemyType = 'monster' | 'ghost';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly enemyType: EnemyType;
  isStunned = false;
  isArrested = false;
  /** Custom patrol range. -1 = fall back to world bounds with margin. */
  patrolLeft  = -1;
  patrolRight = -1;
  private stunTimer = 0;
  private patrolDir = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    super(scene, x, y, type === 'ghost' ? 'ghost' : 'monster');
    this.enemyType = type;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    // Start facing toward the center of the world so enemies spread out
    const worldCenterX = scene.physics.world.bounds.centerX || scene.scale.width / 2;
    this.patrolDir = x < worldCenterX ? 1 : -1;
  }

  stun() {
    if (this.isArrested || this.isStunned) return;
    this.isStunned = true;
    this.stunTimer = STUN_DURATION_MS;
    this.setVelocity(0, 0);
    this.setTint(0x88aaff);
  }

  /**
   * @param force Skip the isStunned check — use when stun was validated earlier
   *              and arrest was already committed (e.g. during the arrest animation).
   */
  arrest(force = false) {
    if (this.isArrested) return false;
    if (!force && !this.isStunned) return false;
    this.isArrested = true;
    this.setActive(false).setVisible(false);
    this.destroy();
    return true;
  }

  update(_input: unknown, delta: number) {
    if (this.isArrested || !this.active) return;

    if (this.isStunned) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.clearTint();
      }
      return;
    }

    this.patrol();
  }

  protected patrol() {
    const bounds = this.scene.physics.world.bounds;
    const margin = 40;
    const left  = this.patrolLeft  >= 0 ? this.patrolLeft  : bounds.left  + margin;
    const right = this.patrolRight >= 0 ? this.patrolRight : bounds.right - margin;

    if (this.x <= left)  this.patrolDir = 1;
    if (this.x >= right) this.patrolDir = -1;

    this.setVelocityX(50 * this.patrolDir);
    this.setFlipX(this.patrolDir < 0);
  }
}
