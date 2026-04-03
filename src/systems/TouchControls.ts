import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

const JUMP_SPLIT_Y  = GAME_HEIGHT * 0.4;      // 216 — top 40% = jump
const LEFT_SPLIT_X  = GAME_WIDTH / 3;         // 320 — left third
const RIGHT_SPLIT_X = (GAME_WIDTH * 2) / 3;   // 640 — right third

type Zone = 'jump' | 'left' | 'fire' | 'right';

function classify(x: number, y: number): Zone {
  if (y < JUMP_SPLIT_Y)  return 'jump';
  if (x < LEFT_SPLIT_X)  return 'left';
  if (x < RIGHT_SPLIT_X) return 'fire';
  return 'right';
}

/**
 * Tracks touch zones for player 1 on mobile.
 *
 * Zone layout (960×540 game coords):
 *   ┌─────────────────────────────────┐
 *   │           JUMP (top 40%)        │
 *   ├──────────┬──────────┬───────────┤
 *   │  LEFT    │   FIRE   │   RIGHT   │
 *   └──────────┴──────────┴───────────┘
 *
 * - LEFT / RIGHT: held while finger is in zone (isDown-style).
 * - JUMP: held while finger is in zone.
 * - FIRE: pulse on each new finger entering the zone (JustDown-style).
 *
 * Moving a held finger into FIRE does NOT trigger a shot — only a fresh
 * pointerdown in the fire zone does.
 */
export class TouchControls {
  private heldLeft   = new Set<number>(); // pointer IDs in left zone
  private heldRight  = new Set<number>(); // pointer IDs in right zone
  private heldJump   = new Set<number>(); // pointer IDs in jump zone
  private shootPulse = false;

  constructor(scene: Phaser.Scene) {
    // Add extra pointer slots so up to 4 simultaneous touches are tracked.
    scene.input.addPointer(3);

    scene.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.assign(ptr.id, classify(ptr.x, ptr.y), /* isNew */ true);
    });

    // Sliding a finger between zones updates the held state.
    // Fire is NOT triggered by sliding — only by a fresh tap.
    scene.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.isDown) return;
      this.clearPointer(ptr.id);
      const zone = classify(ptr.x, ptr.y);
      if (zone !== 'fire') this.assign(ptr.id, zone, /* isNew */ false);
    });

    scene.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      this.clearPointer(ptr.id);
    });
  }

  private assign(id: number, zone: Zone, isNew: boolean): void {
    switch (zone) {
      case 'jump':  this.heldJump.add(id);              break;
      case 'left':  this.heldLeft.add(id);              break;
      case 'right': this.heldRight.add(id);             break;
      case 'fire':  if (isNew) this.shootPulse = true;  break;
    }
  }

  private clearPointer(id: number): void {
    this.heldLeft.delete(id);
    this.heldRight.delete(id);
    this.heldJump.delete(id);
  }

  get left():  boolean { return this.heldLeft.size  > 0; }
  get right(): boolean { return this.heldRight.size > 0; }
  get up():    boolean { return this.heldJump.size  > 0; }

  /** True for exactly one getP1() call after each fire tap. */
  get shoot(): boolean {
    const v = this.shootPulse;
    this.shootPulse = false;
    return v;
  }
}
