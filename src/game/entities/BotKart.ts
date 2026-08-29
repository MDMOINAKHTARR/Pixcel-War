import { Kart, KartInput } from './Kart';
import { KartClassId, BotDifficulty } from '../../types/game';
import { Vector2 } from '../physics/Vector2';
import { Pickup } from './Pickup';

export class BotKart extends Kart {
  public difficulty: BotDifficulty;
  private decisionTimer: number = 0;
  private currentSteer: number = 0;
  private currentThrottle: number = 1;
  private shouldDrift: boolean = false;
  private shouldFire: boolean = false;
  public targetPos?: Vector2;

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
    pickups: Pickup[],
    waypoints: { x: number; y: number; radius: number }[],
    isBattleMode: boolean = false
  ): KartInput {
    this.decisionTimer += dt;

    const reactionInterval =
      this.difficulty === 'overlord' ? 0.04 : this.difficulty === 'ace' ? 0.08 : this.difficulty === 'veteran' ? 0.14 : 0.22;

    if (this.decisionTimer >= reactionInterval) {
      this.decisionTimer = 0;
      this.makeCombatAndRacingDecisions(allKarts, pickups, waypoints, isBattleMode);
    }

    return {
      throttle: this.currentThrottle,
      steer: this.currentSteer,
      drift: this.shouldDrift,
      fire: this.shouldFire,
    };
  }

  private makeCombatAndRacingDecisions(
    allKarts: Kart[],
    pickups: Pickup[],
    waypoints: { x: number; y: number; radius: number }[],
    isBattleMode: boolean
  ) {
    this.shouldFire = false;

    // 1. Check for Emergency Health / Shield foraging if low on HP
    let targetPos: Vector2 | null = null;
    if (this.health < this.maxHealth * 0.45) {
      const repairPickup = pickups.find(
        (p) => p.isActive && (p.type === 'repair_kit' || p.type === 'shield_pack')
      );
      if (repairPickup && this.position.distanceTo(repairPickup.position) < 700) {
        targetPos = repairPickup.position;
      }
    }

    // 2. Search for nearby active mystery boxes if low on ammo
    if (!targetPos && this.ammo <= 2) {
      const activeMystery = pickups.filter((p) => p.isActive && p.type === 'mystery_box');
      let closestBox: Pickup | null = null;
      let minBoxDist = 500;
      for (const p of activeMystery) {
        const dist = this.position.distanceTo(p.position);
        if (dist < minBoxDist) {
          minBoxDist = dist;
          closestBox = p;
        }
      }
      if (closestBox) {
        targetPos = closestBox.position;
      }
    }

    // 3. Find Nearest Enemy Kart to Target and Engage
    let nearestEnemy: Kart | null = null;
    let minEnemyDist = 650;
    for (const other of allKarts) {
      if (other.id === this.id || other.isDead) continue;
      const dist = this.position.distanceTo(other.position);
      if (dist < minEnemyDist) {
        minEnemyDist = dist;
        nearestEnemy = other;
      }
    }

    // In Battle Mode: prioritize chasing nearest enemies
    if (isBattleMode && nearestEnemy && !targetPos) {
      targetPos = nearestEnemy.position;
    }

    // In Race Mode: follow circuit waypoints
    if (!targetPos && waypoints && waypoints.length > 0) {
      const targetWp = waypoints[this.currentWaypointIndex % waypoints.length];
      const distToWp = this.position.distanceTo(new Vector2(targetWp.x, targetWp.y));

      if (distToWp < targetWp.radius + 50) {
        const prevIdx = this.currentWaypointIndex;
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % waypoints.length;
        if (this.currentWaypointIndex === 0 && prevIdx === waypoints.length - 1) {
          this.completeLap();
        }
      }
      targetPos = new Vector2(targetWp.x, targetWp.y);
    }

    if (!targetPos) return;

    // 4. Steer towards target position
    const toTarget = targetPos.clone().subtract(this.position);
    const targetAngle = Math.atan2(toTarget.y, toTarget.x);

    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const steerSensitivity = this.difficulty === 'overlord' ? 2.5 : this.difficulty === 'ace' ? 2.0 : 1.6;
    this.currentSteer = Math.max(-1, Math.min(1, angleDiff * steerSensitivity));

    // 5. Tactical Drifting on sharp turns
    if (Math.abs(angleDiff) > 0.45 && this.speed > 160) {
      this.shouldDrift = true;
    } else {
      this.shouldDrift = false;
    }

    // 6. Throttle Control
    if (Math.abs(angleDiff) > 1.2) {
      this.currentThrottle = 0.6;
    } else {
      this.currentThrottle = 1.0;
    }

    // 7. Combat Firing AI: If nearest enemy is in forward crosshair cone (< 35 degrees)
    if (nearestEnemy && minEnemyDist < 600 && this.ammo > 0) {
      const toEnemy = nearestEnemy.position.clone().subtract(this.position);
      const enemyAngle = Math.atan2(toEnemy.y, toEnemy.x);
      let fireAngleDiff = enemyAngle - this.angle;
      while (fireAngleDiff > Math.PI) fireAngleDiff -= Math.PI * 2;
      while (fireAngleDiff < -Math.PI) fireAngleDiff += Math.PI * 2;

      if (Math.abs(fireAngleDiff) < 0.35) {
        this.shouldFire = true;
        this.targetPos = nearestEnemy.position.clone();
      }
    }
  }
}
