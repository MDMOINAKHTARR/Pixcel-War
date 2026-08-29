import { Vector2 } from '../physics/Vector2';
import { WeaponType, WeaponDef } from '../../types/game';
import { WEAPONS } from '../config/weapons';
import { ParticleEngine } from '../systems/ParticleEngine';
import { drawSafeRoundRect } from '../graphics/PixelArtVehicles';

export class Projectile {
  public id: string;
  public ownerId: string;
  public ownerName: string;
  public type: WeaponType;
  public def: WeaponDef;

  public position: Vector2;
  public velocity: Vector2;
  public angle: number;
  public radius: number = 10;

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
    const speed = this.def.projectileSpeed || 650;

    if (type === 'mine') {
      this.isMine = true;
      this.velocity = Vector2.fromAngle(angle, -60);
      this.radius = 16;
      this.maxDistance = 99999;
    } else if (type === 'shockwave') {
      this.velocity = new Vector2(0, 0);
      this.maxRadius = this.def.range || 200;
      this.radius = 10;
    } else {
      this.velocity = Vector2.fromAngle(angle, speed);
      if (type === 'laser') this.radius = 14;
      else if (type === 'vulcan') this.radius = 6;
      else if (type === 'emp') this.radius = 16;
      else if (type === 'cryo') this.radius = 12;
      else this.radius = 10;
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

    // Cryo missile homing
    if (this.type === 'cryo' && this.targetPos) {
      const dirToTarget = this.targetPos.clone().subtract(this.position).normalize();
      const currentDir = this.velocity.clone().normalize();
      currentDir.lerp(dirToTarget, dt * 2.8).normalize();
      this.velocity = currentDir.multiplyScalar(this.def.projectileSpeed || 650);
      this.angle = this.velocity.angle();
    }

    const step = this.velocity.clone().multiplyScalar(dt);
    this.position.add(step);
    this.distanceTraveled += step.length();

    if (this.distanceTraveled >= this.maxDistance) {
      this.isDead = true;
    }

    // Trail FX
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
      // 3D Metallic Armed Proximity Landmine
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Steel Mine Dome
      const mineGrad = ctx.createRadialGradient(0, -2, 2, 0, 0, 16);
      mineGrad.addColorStop(0, '#475569');
      mineGrad.addColorStop(0.5, '#1e293b');
      mineGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = mineGrad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Blinking Red LED Trigger Dome
      const blink = Math.sin(Date.now() * 0.012) > 0;
      ctx.fillStyle = blink ? '#ff0055' : '#7f1d1d';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = blink ? 14 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.type === 'shockwave') {
      // 3D Expanding Shockwave Ring
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 0, this.currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.rotate(this.angle);

      if (this.type === 'laser') {
        // 3D Railgun Plasma Beam
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#c084fc';
        ctx.fillStyle = '#ffffff';
        drawSafeRoundRect(ctx, -24, -4, 48, 8, 3);
        ctx.fill();

        ctx.fillStyle = '#a855f7';
        drawSafeRoundRect(ctx, -28, -6, 56, 12, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (this.type === 'vulcan') {
        // 3D High-Velocity Tracer Round
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 10;
        drawSafeRoundRect(ctx, -8, -2.5, 16, 5, 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        drawSafeRoundRect(ctx, -12, -3.5, 24, 7, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (this.type === 'emp') {
        // 3D EMP Lightning Orb
        const empGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
        empGrad.addColorStop(0, '#ffffff');
        empGrad.addColorStop(0.4, '#fef08a');
        empGrad.addColorStop(1, '#eab308');
        ctx.fillStyle = empGrad;
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.type === 'cryo') {
        // 3D Cryo Ice Missile with Stabilizing Fins
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-12, -4, 24, 8);

        // Missile Fuselage
        const missileGrad = ctx.createLinearGradient(-14, 0, 14, 0);
        missileGrad.addColorStop(0, '#0284c7');
        missileGrad.addColorStop(0.5, '#bae6fd');
        missileGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = missileGrad;
        drawSafeRoundRect(ctx, -14, -5, 28, 10, 4);
        ctx.fill();

        // 4 Ice Fins
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-12, -9, 5, 4);
        ctx.fillRect(-12, 5, 5, 4);

        // Glowing Ice Nosecone
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(8, -5);
        ctx.lineTo(8, 5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // 3D Twin Blaster Plasma Bolt
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#00f0ff';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }
}
