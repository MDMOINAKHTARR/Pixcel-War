import { Kart, KartInput } from './Kart';
import { KartClassId } from '../../types/game';
import { Vector2 } from '../physics/Vector2';

export class PlayerKart extends Kart {
  private keys: Record<string, boolean> = {};

  // Touch / Virtual Joystick inputs
  public touchThrottle: number = 0;
  public touchSteer: number = 0;
  public touchDrift: boolean = false;
  public touchFire: boolean = false;

  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onBlur: () => void;

  constructor(
    id: string,
    name: string,
    classId: KartClassId,
    pos: Vector2,
    angle: number = 0,
    customColors?: { body?: string; accent?: string; underglow?: string; skinId?: any }
  ) {
    super(id, name, classId, pos, angle, true, customColors);

    this.onKeyDown = (e: KeyboardEvent) => {
      this.keys[e.code] = true;
      if (e.key) {
        this.keys[e.key.toLowerCase()] = true;
        this.keys[e.key] = true;
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
    };

    this.onKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
      if (e.key) {
        this.keys[e.key.toLowerCase()] = false;
        this.keys[e.key] = false;
      }
    };

    this.onBlur = () => {
      this.keys = {};
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  public checkWaypointProgress(waypoints: { x: number; y: number; radius: number }[]) {
    if (!waypoints || waypoints.length === 0) return;

    const targetWp = waypoints[this.currentWaypointIndex % waypoints.length];
    const distToWp = this.position.distanceTo(new Vector2(targetWp.x, targetWp.y));

    if (distToWp < targetWp.radius + 70) {
      const prevIdx = this.currentWaypointIndex;
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % waypoints.length;
      if (this.currentWaypointIndex === 0 && prevIdx === waypoints.length - 1) {
        this.completeLap();
      }
    }
  }

  public getInput(): KartInput {
    let throttle = 0;
    let steer = 0;
    let drift = false;
    let fire = false;

    // Keyboard Throttle (W / Up / S / Down)
    if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) throttle += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) throttle -= 1;

    // Keyboard Steer (A / Left / D / Right)
    if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) steer -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) steer += 1;

    // Drift (Shift / KeyC)
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyC'] || this.keys['shift'] || this.keys['c']) {
      drift = true;
    }

    // Fire Weapon (Space / KeyF / KeyE / KeyJ / Enter)
    if (
      this.keys['Space'] ||
      this.keys['KeyF'] ||
      this.keys['KeyE'] ||
      this.keys['KeyJ'] ||
      this.keys['Enter'] ||
      this.keys[' '] ||
      this.keys['f'] ||
      this.keys['e'] ||
      this.keys['j'] ||
      this.keys['enter']
    ) {
      fire = true;
    }

    // Blend touch / mobile virtual joystick if active
    if (Math.abs(this.touchThrottle) > 0.01) throttle = this.touchThrottle;
    if (Math.abs(this.touchSteer) > 0.01) steer = this.touchSteer;
    if (this.touchDrift) drift = true;
    if (this.touchFire) fire = true;

    return { throttle, steer, drift, fire };
  }

  public destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
