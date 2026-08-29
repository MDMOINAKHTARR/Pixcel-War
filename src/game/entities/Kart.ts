import { Vector2 } from '../physics/Vector2';
import {
  KartClassDef,
  KartClassId,
  DriftStage,
  KartStatusEffects,
} from '../../types/game';
import { KART_CLASSES } from '../config/kartClasses';
import { ParticleEngine } from '../systems/ParticleEngine';
import { SoundEngine } from '../systems/SoundEngine';
import { PixelArtVehicles, VehicleSkinId } from '../graphics/PixelArtVehicles';

export interface KartInput {
  throttle: number; // -1 (reverse) to 1 (forward)
  steer: number;    // -1 (left) to 1 (right)
  drift: boolean;   // Holding drift
  fire?: boolean;   // Unused in pure racing
}

export class Kart {
  public id: string;
  public name: string;
  public isPlayer: boolean = false;
  public classId: KartClassId;
  public classDef: KartClassDef;
  public skinId: VehicleSkinId = 'red';

  // Visual Customization
  public bodyColor: string;
  public accentColor: string;
  public underglowColor: string;

  // Transform & Physics
  public position: Vector2;
  public velocity: Vector2;
  public angle: number = 0; // In radians
  public angularVelocity: number = 0;
  public speed: number = 0;
  public radius: number = 20;

  // Drift Mechanics
  public isDrifting: boolean = false;
  public driftDirection: number = 0; // -1 left, 1 right
  public driftTime: number = 0;
  public driftStage: DriftStage = 0;

  // Pure Racing & Lap Progression
  public currentLap: number = 1;
  public totalLaps: number = 3;
  public currentWaypointIndex: number = 0;
  public currentLapTimer: number = 0;
  public bestLapTime: number = 999;
  public lapTimes: number[] = [];
  public raceFinished: boolean = false;
  public raceFinishTime: number = 0;
  public racePosition: number = 1;
  public coinsCollected: number = 0;

  // Status Effects (Boosts)
  public status: KartStatusEffects = {
    isFrozen: false,
    frozenTimer: 0,
    isEMPDisabled: false,
    empTimer: 0,
    isBoosting: false,
    boostTimer: 0,
    boostMultiplier: 1.0,
    invulnerableTimer: 0,
    inSludge: false,
    onIce: false,
  };

  // Last skid mark positions
  private lastLeftWheelPos: Vector2 | null = null;
  private lastRightWheelPos: Vector2 | null = null;

  constructor(
    id: string,
    name: string,
    classId: KartClassId,
    pos: Vector2,
    angle: number = 0,
    isPlayer: boolean = false,
    customColors?: { body?: string; accent?: string; underglow?: string }
  ) {
    this.id = id;
    this.name = name;
    this.classId = classId;
    this.classDef = KART_CLASSES[classId] || KART_CLASSES['balanced'];
    this.isPlayer = isPlayer;

    this.position = pos.clone();
    this.velocity = new Vector2(0, 0);
    this.angle = angle;

    this.bodyColor = customColors?.body || this.classDef.color;
    this.accentColor = customColors?.accent || this.classDef.accentColor;
    this.underglowColor = customColors?.underglow || this.classDef.glowColor;

    const skinMap: Record<KartClassId, VehicleSkinId> = {
      scout: 'red',
      tank: 'bigfoot',
      balanced: 'police',
      drift: 'surf',
      cyber: 'dark_m',
    };
    this.skinId = (customColors as { skinId?: VehicleSkinId })?.skinId || skinMap[classId] || 'red';
  }

  public update(
    dt: number,
    input: KartInput,
    particleEngine: ParticleEngine,
    soundEngine: SoundEngine
  ) {
    if (this.raceFinished) {
      // Auto-decelerate slowly across the finish line
      this.velocity.multiplyScalar(0.96);
      this.position.add(this.velocity.clone().multiplyScalar(dt));
      this.speed = this.velocity.length();
      return;
    }

    // Advance lap timer
    this.currentLapTimer += dt;

    // 1. Process Status Effects
    if (this.status.isBoosting) {
      this.status.boostTimer -= dt;
      if (this.status.boostTimer <= 0) {
        this.status.isBoosting = false;
        this.status.boostMultiplier = 1.0;
      }
    }

    // 2. Process Physics & Steering
    this.processMovement(dt, input, particleEngine, soundEngine);

    // 3. Tire Skid Marks
    const maxSpeed = this.classDef.stats.topSpeed;
    if (this.isDrifting || (this.speed > maxSpeed * 0.6 && Math.abs(input.steer) > 0.6)) {
      const perpDir = new Vector2(-Math.sin(this.angle), Math.cos(this.angle));
      const leftW = this.position.clone().add(perpDir.clone().multiplyScalar(-10));
      const rightW = this.position.clone().add(perpDir.clone().multiplyScalar(10));

      if (this.lastLeftWheelPos && this.lastRightWheelPos) {
        particleEngine.addSkidMark(this.lastLeftWheelPos.x, this.lastLeftWheelPos.y, leftW.x, leftW.y);
        particleEngine.addSkidMark(this.lastRightWheelPos.x, this.lastRightWheelPos.y, rightW.x, rightW.y);
      }
      this.lastLeftWheelPos = leftW;
      this.lastRightWheelPos = rightW;
    } else {
      this.lastLeftWheelPos = null;
      this.lastRightWheelPos = null;
    }
  }

  private processMovement(
    dt: number,
    input: KartInput,
    particleEngine: ParticleEngine,
    soundEngine: SoundEngine
  ) {
    const stats = this.classDef.stats;
    let maxSpeed = stats.topSpeed;
    let accel = stats.acceleration;
    let turnSpeed = stats.handling;

    if (this.status.isBoosting) {
      maxSpeed *= this.status.boostMultiplier;
      accel *= 1.8;
    }

    // Steering
    if (Math.abs(input.steer) > 0.05) {
      const speedRatio = Math.min(1.0, this.speed / (maxSpeed * 0.4));
      const turnDir = this.speed < 0 ? -input.steer : input.steer;
      this.angle += turnDir * turnSpeed * speedRatio * dt;
    }

    // Drift Logic
    if (input.drift && Math.abs(input.steer) > 0.3 && this.speed > maxSpeed * 0.35) {
      if (!this.isDrifting) {
        this.isDrifting = true;
        this.driftDirection = input.steer > 0 ? 1 : -1;
        this.driftTime = 0;
        this.driftStage = 0;
      }

      this.driftTime += dt * stats.driftMultiplier;

      // Charge drift stages
      if (this.driftTime > 2.6) {
        this.driftStage = 3; // Purple Supreme
      } else if (this.driftTime > 1.5) {
        this.driftStage = 2; // Orange
      } else if (this.driftTime > 0.5) {
        this.driftStage = 1; // Blue
      }

      if (this.driftStage > 0) {
        particleEngine.emitDriftSparks(this.position, this.angle, this.driftStage as 1 | 2 | 3);
        if (this.isPlayer && Math.random() > 0.7) {
          soundEngine.playDriftScreech();
        }
      }
    } else {
      if (this.isDrifting) {
        // Release drift boost!
        if (this.driftStage > 0) {
          const boostDurations = [0, 0.9, 1.5, 2.3];
          const boostMultipliers = [1.0, 1.35, 1.6, 2.0];
          this.applyBoost(boostDurations[this.driftStage], boostMultipliers[this.driftStage]);
          if (this.isPlayer) {
            soundEngine.playBoost();
          }
        }
        this.isDrifting = false;
        this.driftStage = 0;
        this.driftTime = 0;
      }
    }

    // Forward / Reverse Acceleration
    const forwardDir = Vector2.fromAngle(this.angle);
    if (input.throttle > 0) {
      const targetVel = forwardDir.clone().multiplyScalar(maxSpeed * input.throttle);
      this.velocity.lerp(targetVel, (accel / maxSpeed) * dt * 3.8);
      particleEngine.emitExhaustSmoke(this.position, this.angle);
    } else if (input.throttle < 0) {
      const reverseVel = forwardDir.clone().multiplyScalar(-maxSpeed * 0.45);
      this.velocity.lerp(reverseVel, (accel / maxSpeed) * dt * 2.5);
    } else {
      // Natural rolling drag
      this.velocity.multiplyScalar(Math.pow(0.92, dt * 60));
    }

    // Lateral tire grip
    const rightDir = new Vector2(-forwardDir.y, forwardDir.x);
    const lateralVel = rightDir.clone().multiplyScalar(this.velocity.dot(rightDir));
    const forwardVel = forwardDir.clone().multiplyScalar(this.velocity.dot(forwardDir));

    const gripFactor = this.isDrifting ? 0.88 : 0.94;
    this.velocity = forwardVel.add(lateralVel.multiplyScalar(gripFactor));

    // Update Position
    this.position.add(this.velocity.clone().multiplyScalar(dt));
    this.speed = this.velocity.length();
  }

  public completeLap() {
    this.lapTimes.push(this.currentLapTimer);
    if (this.currentLapTimer < this.bestLapTime) {
      this.bestLapTime = this.currentLapTimer;
    }
    this.currentLapTimer = 0;
    this.currentLap++;

    if (this.currentLap > this.totalLaps) {
      this.raceFinished = true;
      this.raceFinishTime = this.lapTimes.reduce((a, b) => a + b, 0);
    }
  }

  public applyBoost(duration: number, multiplier: number = 1.5) {
    this.status.isBoosting = true;
    this.status.boostTimer = Math.max(this.status.boostTimer, duration);
    this.status.boostMultiplier = multiplier;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Neon Underglow
    ctx.shadowBlur = 18;
    ctx.shadowColor = this.underglowColor;
    ctx.fillStyle = this.underglowColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 14, this.angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Pixel Art Vehicle Sprite
    ctx.rotate(this.angle + Math.PI * 0.5); // Align sprite forward
    PixelArtVehicles.drawVehicle(ctx, this.skinId, 1.1, this.bodyColor);

    ctx.restore();

    // Overhead Pilot Name Tag
    this.renderOverheadHUD(ctx);
  }

  private renderOverheadHUD(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const hudY = this.position.y - 32;

    // Pilot Name
    ctx.font = 'bold 9px "Press Start 2P", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.isPlayer ? '#00f0ff' : '#ffffff';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillText(this.name, this.position.x, hudY);

    ctx.restore();
  }
}
