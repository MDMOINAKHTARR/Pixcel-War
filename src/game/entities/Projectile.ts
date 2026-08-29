import { Vector2 } from '../physics/Vector2';
import { WeaponType, WeaponDef } from '../../types/game';
import { WEAPONS } from '../config/weapons';
import { ParticleEngine } from '../systems/ParticleEngine';

export class Projectile {
  public id: string;
  public ownerId: string;
  public ownerName: string;
  public type: WeaponType;
  public def: WeaponDef;

  public position: Vector2;
  public velocity: Vector2;
  public angle: number;
  public radius: number = 8;

  public distanceTraveled: number = 0;
  public maxDistance: number;
  public isDead: boolean = false;
  public isMine: boolean = false;
  public mineArmed: boolean = false;
  public mineArmTimer: number = 0;
  public lifeTimer: number = 0;
  public maxLifeTime: number = 8; // in seconds

  // Shockwave specific
  public currentRadius: number = 0;
  public maxRadius: number = 200;

  // Cryo homing target
  public targetPos?: Vector2;

  constructor(
    ownerId: string,
    ownerName: string,
    type: WeaponType,
    pos: Vector2,
    angle: number,
    targetPos?: Vector2
  ) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.ownerId = ownerId;
    this.ownerName = ownerName;
    this.type = type;
    this.def = WEAPONS[type];
    this.position = pos.clone();
    this.angle = angle;
    this.targetPos = targetPos;

    this.maxDistance = this.def.range || 600;
    const speed = this.def.projectileSpeed || 600;

    if (type === 'mine') {
      this.isMine = true;
      this.velocity = Vector2.fromAngle(angle, -60); // Drop softly behind
      this.radius = 14;
      this.maxDistance = 99999;
    } else if (type === 'shockwave') {
      this.velocity = new Vector2(0, 0);
      this.maxRadius = this.def.range || 200;
      this.radius = 10;
    } else {
      this.velocity = Vector2.fromAngle(angle, speed);
      if (type === 'laser') this.radius = 12;
      else if (type === 'vulcan') this.radius = 5;
      else if (type === 'emp') this.radius = 14;
      else if (type === 'cryo') this.radius = 10;
      else this.radius = 8;
    }
  }

  public update(dt: number, particleEngine?: ParticleEngine) {
    if (this.isDead) return;

    this.lifeTimer += dt;
    if (this.lifeTimer > this.maxLifeTime && !this.isMine) {
      this.isDead = true;
      return;
    }

    if (this.type === 'mine') {
      this.mineArmTimer += dt;
      if (this.mineArmTimer > 0.6) {
        this.mineArmed = true;
      }
      this.velocity.multiplyScalar(0.92);
      this.position.add(this.velocity.clone().multiplyScalar(dt));
      return;
    }

    if (this.type === 'shockwave') {
      this.currentRadius += dt * 450;
      this.radius = this.currentRadius;
      if (this.currentRadius >= this.maxRadius) {
        this.isDead = true;
      }
      return;
    }

    // Cryo slight homing
    if (this.type === 'cryo' && this.targetPos) {
      const dirToTarget = this.targetPos.clone().subtract(this.position).normalize();
      const currentDir = this.velocity.clone().normalize();
      currentDir.lerp(dirToTarget, dt * 2.5).normalize();
      this.velocity = currentDir.multiplyScalar(this.def.projectileSpeed || 600);
      this.angle = this.velocity.angle();
    }

    const step = this.velocity.clone().multiplyScalar(dt);
    this.position.add(step);
    this.distanceTraveled += step.length();

    if (this.distanceTraveled >= this.maxDistance) {
      this.isDead = true;
    }

    // Emit trail particles
    if (particleEngine && Math.random() > 0.3) {
      if (this.type === 'emp') {
        particleEngine.emitDriftSparks(this.position, this.angle, 1);
      } else if (this.type === 'laser') {
        particleEngine.emitDriftSparks(this.position, this.angle, 3);
      } else if (this.type === 'cryo') {
        particleEngine.emitIceShatter(this.position);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    if (this.type === 'mine') {
      // Landmine body
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Blinking red beacon
      const blink = Math.sin(Date.now() * 0.01) > 0;
      ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      if (this.mineArmed) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ef4444';
      }
    } else if (this.type === 'shockwave') {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 0, this.currentRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.rotate(this.angle);

      if (this.type === 'laser') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#a855f7';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-20, -3, 40, 6);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-24, -5, 48, 10);
      } else if (this.type === 'vulcan') {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-6, -2, 12, 4);
      } else if (this.type === 'emp') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#eab308';
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (this.type === 'cryo') {
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#67e8f9';
        ctx.fillStyle = '#cffafe';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-8, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 6);
        ctx.closePath();
        ctx.fill();
      } else {
        // Blaster
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00f0ff';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
