import { Kart, KartInput } from './Kart';
import { KartClassId, BotDifficulty } from '../../types/game';
import { Vector2 } from '../physics/Vector2';

export class BotKart extends Kart {
  public difficulty: BotDifficulty;
  private decisionTimer: number = 0;
  private currentSteer: number = 0;
  private currentThrottle: number = 1;
  private shouldDrift: boolean = false;

  constructor(
    id: string,
    name: string,
    classId: KartClassId,
    pos: Vector2,
    angle: number = 0,
    difficulty: BotDifficulty = 'veteran',
    customColors?: { body?: string; accent?: string; underglow?: string; skinId?: any }
  ) {
    super(id, name, classId, pos, angle, false, customColors);
    this.difficulty = difficulty;
  }

  public updateAI(
    dt: number,
    allKarts: Kart[],
    waypoints: { x: number; y: number; radius: number }[]
  ): KartInput {
    this.decisionTimer += dt;

    const reactionInterval =
      this.difficulty === 'overlord' ? 0.04 : this.difficulty === 'ace' ? 0.08 : this.difficulty === 'veteran' ? 0.14 : 0.22;

    if (this.decisionTimer >= reactionInterval) {
      this.decisionTimer = 0;
      this.makeRacingDecisions(allKarts, waypoints);
    }

    return {
      throttle: this.currentThrottle,
      steer: this.currentSteer,
      drift: this.shouldDrift,
    };
  }

  private makeRacingDecisions(
    allKarts: Kart[],
    waypoints: { x: number; y: number; radius: number }[]
  ) {
    if (!waypoints || waypoints.length === 0) return;

    // 1. Target Next Waypoint on Circuit
    const targetWp = waypoints[this.currentWaypointIndex % waypoints.length];
    const distToWp = this.position.distanceTo(new Vector2(targetWp.x, targetWp.y));

    if (distToWp < targetWp.radius + 50) {
      // Advance to next waypoint
      const prevIdx = this.currentWaypointIndex;
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % waypoints.length;
      if (this.currentWaypointIndex === 0 && prevIdx === waypoints.length - 1) {
        this.completeLap();
      }
    }

    // 2. Steer towards apex target
    const toTarget = new Vector2(targetWp.x - this.position.x, targetWp.y - this.position.y);
    const targetAngle = Math.atan2(toTarget.y, toTarget.x);

    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Steering aggressiveness
    const steerSensitivity = this.difficulty === 'overlord' ? 2.5 : this.difficulty === 'ace' ? 2.0 : 1.6;
    this.currentSteer = Math.max(-1, Math.min(1, angleDiff * steerSensitivity));

    // 3. Drift on sharp cornering
    if (Math.abs(angleDiff) > 0.45 && this.speed > 160) {
      this.shouldDrift = true;
    } else {
      this.shouldDrift = false;
    }

    // 4. Throttle Control
    if (Math.abs(angleDiff) > 1.2) {
      this.currentThrottle = 0.6; // Feather throttle on sharp hairpin
    } else {
      this.currentThrottle = 1.0; // Full throttle on straights
    }

    // 5. Kart-to-Kart Spacing
    for (const other of allKarts) {
      if (other.id === this.id) continue;
      const d = this.position.distanceTo(other.position);
      if (d < 45) {
        // Nudge steering slightly to avoid jamming
        const away = this.position.clone().subtract(other.position);
        if (away.x * Math.cos(this.angle) + away.y * Math.sin(this.angle) > 0) {
          this.currentSteer += (away.y > 0 ? 0.3 : -0.3);
        }
      }
    }
  }
}
