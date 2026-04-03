import Phaser from 'phaser';
import type { TouchControls } from './TouchControls';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
  interact: boolean;
}

/**
 * P1: Arrow keys + Space (shoot) + Enter (interact)
 * P2: WASD + F (shoot) + G (interact)
 *
 * On touch devices, call setTouchControls() after construction to merge
 * mobile zone input into P1.
 */
export class InputManager {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private touch?: TouchControls;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = kb.addKeys({
      // P1
      p1Left:     Phaser.Input.Keyboard.KeyCodes.LEFT,
      p1Right:    Phaser.Input.Keyboard.KeyCodes.RIGHT,
      p1Up:       Phaser.Input.Keyboard.KeyCodes.UP,
      p1Down:     Phaser.Input.Keyboard.KeyCodes.DOWN,
      p1Shoot:    Phaser.Input.Keyboard.KeyCodes.SPACE,
      p1Interact: Phaser.Input.Keyboard.KeyCodes.ENTER,
      // P2
      p2Left:     Phaser.Input.Keyboard.KeyCodes.A,
      p2Right:    Phaser.Input.Keyboard.KeyCodes.D,
      p2Up:       Phaser.Input.Keyboard.KeyCodes.W,
      p2Down:     Phaser.Input.Keyboard.KeyCodes.S,
      p2Shoot:    Phaser.Input.Keyboard.KeyCodes.F,
      p2Interact: Phaser.Input.Keyboard.KeyCodes.G,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  setTouchControls(touch: TouchControls): void {
    this.touch = touch;
  }

  getP1(): PlayerInput {
    const k  = this.keys;
    const tc = this.touch;
    return {
      left:     k.p1Left.isDown  || (tc ? tc.left  : false),
      right:    k.p1Right.isDown || (tc ? tc.right : false),
      up:       k.p1Up.isDown    || (tc ? tc.up    : false),
      down:     k.p1Down.isDown,
      shoot:    Phaser.Input.Keyboard.JustDown(k.p1Shoot) || (tc ? tc.shoot : false),
      interact: Phaser.Input.Keyboard.JustDown(k.p1Interact),
    };
  }

  getP2(): PlayerInput {
    return {
      left:     this.keys.p2Left.isDown,
      right:    this.keys.p2Right.isDown,
      up:       this.keys.p2Up.isDown,
      down:     this.keys.p2Down.isDown,
      shoot:    Phaser.Input.Keyboard.JustDown(this.keys.p2Shoot),
      interact: Phaser.Input.Keyboard.JustDown(this.keys.p2Interact),
    };
  }
}
