import { Vector2 } from '../physics/Vector2';
import {
  KartClassDef,
  KartClassId,
  DriftStage,
  KartStatusEffects,
  WeaponType,
} from '../../types/game';
import { KART_CLASSES } from '../config/kartClasses';
import { WEAPONS } from '../config/weapons';
import { ParticleEngine } from '../systems/ParticleEngine';
import { SoundEngine } from '../systems/SoundEngine';
import { PixelArtVehicles, VehicleSkinId } from '../graphics/PixelArtVehicles';
import { Projectile } from './Projectile';

export interface KartInput {
  throttle: number; // -1 (reverse) to 1 (forward)
  steer: number;    // -1 (left) to 1 (right)
  drift: boolean;   // Holding drift
  fire?: boolean;   // Firing weapon
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
  public radius: number = 24;

  // Drift Mechanics
  public isDrifting: boolean = false;
  public driftDirection: number = 0; // -1 left, 1 right
  public driftTime: number = 0;
  public driftStage: DriftStage = 0;

  // Combat Stats
  public health: number;
  public maxHealth: number;
  public shield: number;
  public maxShield: number;
  public shieldRechargeTimer: number = 0;
  public shieldRechargeRate: number = 16; // HP per sec

  public kills: number = 0;
  public deaths: number = 0;
  public score: number = 0;
  public damageDealt: number = 0;
  public coinsCollected: number = 0;
  public isDead: boolean = false;
  public respawnTimer: number = 0;

  // Weapon Inventory
  public currentWeapon: WeaponType | null = null;
  public ammo: number = 0;
  public weaponCooldownTimer: number = 0;

  // Racing & Lap Progression
  public currentLap: number = 1;
  public totalLaps: number = 3;
  public currentWaypointIndex: number = 0;
  public currentLapTimer: number = 0;
  public bestLapTime: number = 999;
  public lapTimes: number[] = [];
  public raceFinished: boolean = false;
  public raceFinishTime: number = 0;
  public racePosition: number = 1;

  // Status Effects
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
    customColors?: { body?: string; accent?: string; underglow?: string; skinId?: any }
  ) {
    this.id = id;
    this.name = name;
    this.classId = classId;
    this.classDef = KART_CLASSES[classId] || KART_CLASSES['balanced'];
    this.isPlayer = isPlayer;

    this.position = pos.clone();
    this.velocity = new Vector2(0, 0);
    this.angle = angle;

    this.maxHealth = this.classDef.stats.maxHealth || 100;
    this.health = this.maxHealth;
    this.maxShield = this.classDef.stats.maxShield || 50;
    this.shield = this.maxShield;

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

    // Start armed with Twin Blaster
    this.giveWeapon('blaster', 8);
  }

  public update(
    dt: number,
    input: KartInput,
    particleEngine: ParticleEngine,
    soundEngine: SoundEngine
  ) {
    // 1. Process Respawn
    if (this.isDead) {
      this.respawnTimer -= dt;
      return;
    }

    // Advance lap timer
    this.currentLapTimer += dt;

    // 2. Weapon Cooldowns & Shield Recharge
    if (this.weaponCooldownTimer > 0) {
      this.weaponCooldownTimer -= dt * 1000;
    }

    this.shieldRechargeTimer += dt;
    if (this.shieldRechargeTimer > 3.5 && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + this.shieldRechargeRate * dt);
    }

    // 3. Process Status Effects
    if (this.status.invulnerableTimer > 0) {
      this.status.invulnerableTimer -= dt;
    }

    if (this.status.isFrozen) {
      this.status.frozenTimer -= dt;
      if (this.status.frozenTimer <= 0) {
        this.status.isFrozen = false;
        particleEngine.emitIceShatter(this.position);
      }
    }

    if (this.status.isEMPDisabled) {
      this.status.empTimer -= dt;
      if (this.status.empTimer <= 0) {
        this.status.isEMPDisabled = false;
      } else if (Math.random() > 0.6) {
        particleEngine.emitDriftSparks(this.position, this.angle, 1);
      }
    }

    if (this.status.isBoosting) {
      this.status.boostTimer -= dt;
      if (this.status.boostTimer <= 0) {
        this.status.isBoosting = false;
        this.status.boostMultiplier = 1.0;
      }
    }

    // 4. Process Physics & Steering
    this.processMovement(dt, input, particleEngine, soundEngine);

    // 5. Tire Skid Marks
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
    if (this.status.isFrozen) {
      this.velocity.multiplyScalar(0.985);
      this.position.add(this.velocity.clone().multiplyScalar(dt));
      this.speed = this.velocity.length();
      return;
    }

    const stats = this.classDef.stats;
    let maxSpeed = stats.topSpeed;
    let accel = stats.acceleration;
    let turnSpeed = stats.handling;

    if (this.status.isBoosting) {
      maxSpeed *= this.status.boostMultiplier;
      accel *= 1.8;
    }

    if (this.status.isEMPDisabled) {
      turnSpeed *= 0.3;
      accel *= 0.4;
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

    // Lateral grip
    const rightDir = new Vector2(-forwardDir.y, forwardDir.x);
    const lateralVel = rightDir.clone().multiplyScalar(this.velocity.dot(rightDir));
    const forwardVel = forwardDir.clone().multiplyScalar(this.velocity.dot(forwardDir));

    const gripFactor = this.isDrifting ? 0.88 : 0.94;
    this.velocity = forwardVel.add(lateralVel.multiplyScalar(gripFactor));

    // Update Position
    this.position.add(this.velocity.clone().multiplyScalar(dt));
    this.speed = this.velocity.length();
  }

  public fireWeapon(targetPos?: Vector2): Projectile[] | null {
    if (this.isDead || !this.currentWeapon || this.ammo <= 0 || this.weaponCooldownTimer > 0) {
      return null;
    }

    const def = WEAPONS[this.currentWeapon];
    this.weaponCooldownTimer = def.cooldown * (this.classDef.stats.cooldownReduction || 1.0);
    this.ammo--;

    const projectiles: Projectile[] = [];
    const forwardDir = Vector2.fromAngle(this.angle);
    const muzzlePos = this.position.clone().add(forwardDir.clone().multiplyScalar(22));

    if (this.currentWeapon === 'blaster') {
      const perp = new Vector2(-forwardDir.y, forwardDir.x).multiplyScalar(7);
      projectiles.push(new Projectile(this.id, this.name, 'blaster', muzzlePos.clone().add(perp), this.angle));
      projectiles.push(new Projectile(this.id, this.name, 'blaster', muzzlePos.clone().subtract(perp), this.angle));
    } else if (this.currentWeapon === 'rocket') {
      this.applyBoost(1.6, 2.2);
    } else {
      projectiles.push(new Projectile(this.id, this.name, this.currentWeapon, muzzlePos, this.angle, targetPos));
    }

    if (this.ammo <= 0) {
      this.currentWeapon = 'blaster';
      this.ammo = 8;
    }

    return projectiles;
  }

  public giveWeapon(type: WeaponType, ammo?: number) {
    this.currentWeapon = type;
    this.ammo = ammo || WEAPONS[type].ammo;
    this.weaponCooldownTimer = 0;
  }

  public takeDamage(amount: number, attacker?: Kart): boolean {
    if (this.isDead || this.status.invulnerableTimer > 0) return false;

    this.shieldRechargeTimer = 0;

    // Grant 1.8s hit cooldown invulnerability to prevent unfair chained hits
    this.status.invulnerableTimer = 1.8;

    // Fair recovery: preserve 60% speed momentum instead of stopping dead (0 km/h)
    this.velocity.multiplyScalar(0.6);
    this.speed = this.velocity.length();

    let remainingDmg = amount;
    if (this.shield > 0) {
      if (this.shield >= remainingDmg) {
        this.shield -= remainingDmg;
        remainingDmg = 0;
      } else {
        remainingDmg -= this.shield;
        this.shield = 0;
      }
    }

    if (remainingDmg > 0) {
      this.health -= remainingDmg;
      if (this.health <= 0) {
        this.health = 0;
        this.isDead = true;
        this.deaths++;
        this.respawnTimer = 2.5;

        if (attacker && attacker.id !== this.id) {
          attacker.kills++;
          attacker.score += 150;
          attacker.coinsCollected += 50;
        }
        return true; // Fatal elimination!
      }
    }
    return false;
  }

  public applyStatus(type: 'freeze' | 'emp', duration: number) {
    if (this.status.invulnerableTimer > 0) return;
    if (type === 'freeze') {
      this.status.isFrozen = true;
      this.status.frozenTimer = Math.min(1.2, duration); // Punishing but not run-ending
      this.velocity.multiplyScalar(0.7); // Maintain sliding momentum
    } else if (type === 'emp') {
      this.status.isEMPDisabled = true;
      this.status.empTimer = Math.min(1.8, duration);
    }
  }

  public heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public rechargeShield(amount: number) {
    this.shield = Math.min(this.maxShield, this.shield + amount);
  }

  public respawn(pos: Vector2, angle: number) {
    this.position = pos.clone();
    this.velocity = new Vector2(0, 0);
    this.angle = angle;
    this.health = this.maxHealth;
    this.shield = this.maxShield;
    this.isDead = false;
    this.status.invulnerableTimer = 3.0;
    this.giveWeapon('blaster', 8);
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
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Invulnerability flashing
    if (this.status.invulnerableTimer > 0 && Math.sin(Date.now() * 0.03) > 0) {
      ctx.globalAlpha = 0.4;
    }

    // Forward Projector Headlight Beam Cones
    ctx.save();
    ctx.rotate(this.angle);
    const lightGrad = ctx.createRadialGradient(0, 0, 10, 80, 0, 90);
    lightGrad.addColorStop(0, 'rgba(255, 255, 200, 0.35)');
    lightGrad.addColorStop(0.5, 'rgba(255, 255, 150, 0.12)');
    lightGrad.addColorStop(1, 'rgba(255, 255, 100, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(10, -12);
    ctx.lineTo(120, -45);
    ctx.lineTo(120, 45);
    ctx.lineTo(10, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Neon Underglow
    ctx.shadowBlur = 18;
    ctx.shadowColor = this.underglowColor;
    ctx.fillStyle = this.underglowColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 16, this.angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw 3D-Rendered Vehicle Sprite
    ctx.rotate(this.angle + Math.PI * 0.5); // Align sprite forward
    const hpRatio = Math.max(0, this.health / this.maxHealth);
    const isAcc = this.speed > 30 || this.status.isBoosting;
    PixelArtVehicles.drawVehicle(ctx, this.skinId, 1.35, this.bodyColor, hpRatio, isAcc);

    ctx.restore();

    // Shield Bubble if active
    if (this.shield > 0) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Frozen Ice Cube
    if (this.status.isFrozen) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.fillStyle = 'rgba(165, 243, 252, 0.65)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.fillRect(-22, -22, 44, 44);
      ctx.strokeRect(-22, -22, 44, 44);
      ctx.restore();
    }

    // Overhead Pilot Health / Shield HUD
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
    ctx.fillText(this.name, this.position.x, hudY - 7);

    const barW = 38;
    const barH = 4;
    const barX = this.position.x - barW * 0.5;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(barX - 1, hudY - 1, barW + 2, barH + 6);

    // Health Bar
    const hpRatio = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(barX, hudY, barW * hpRatio, barH);

    // Shield Bar
    if (this.maxShield > 0) {
      const shieldRatio = Math.max(0, this.shield / this.maxShield);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(barX, hudY + barH + 1, barW * shieldRatio, 2);
    }

    ctx.restore();
  }
}
