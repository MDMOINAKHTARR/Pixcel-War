import { Kart, KartInput } from './Kart';
import { Vector2 } from '../physics/Vector2';
import { KartClassId } from '../../types/game';

export class RemoteKart extends Kart {
  public targetPosition: Vector2;
  public targetAngle: number;
  public targetSpeed: number;
  public targetSteer: number;
  public targetDrift: boolean;

  constructor(
    id: string,
    name: string,
    kartClass: KartClassId,
    startPos: Vector2,
    startAngle: number,
    colors?: { body?: string; accent?: string; underglow?: string; skinId?: any }
  ) {
    super(id, name, kartClass, startPos, startAngle, false, colors);
    this.targetPosition = startPos.clone();
    this.targetAngle = startAngle;
    this.targetSpeed = 0;
    this.targetSteer = 0;
    this.targetDrift = false;
  }

  public applyNetworkState(data: {
    x: number;
    y: number;
    angle: number;
    speed: number;
    steer: number;
    drift: boolean;
    lap: number;
    waypoint: number;
  }) {
    this.targetPosition.set(data.x, data.y);
    this.targetAngle = data.angle;
    this.targetSpeed = data.speed;
    this.targetSteer = data.steer;
    this.targetDrift = data.drift;
    this.currentLap = data.lap;
    this.currentWaypointIndex = data.waypoint;
  }

  public updateRemote(dt: number, particleEngine: any, soundEngine: any) {
    // Smooth interpolation towards target position & angle
    const lerpFactor = Math.min(1.0, dt * 15);
    this.position.x += (this.targetPosition.x - this.position.x) * lerpFactor;
    this.position.y += (this.targetPosition.y - this.position.y) * lerpFactor;

    // Angle interpolation (shortest path)
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * lerpFactor;

    this.speed = this.targetSpeed;
    this.isDrifting = this.targetDrift;

    // Update wheels, boost, and particle effects
    const fakeInput: KartInput = {
      throttle: this.speed > 0 ? 1 : 0,
      steer: this.targetSteer,
      drift: this.targetDrift,
      fire: false,
    };
    super.update(dt, fakeInput, particleEngine, soundEngine);
  }
}
