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
  public damage: number;

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

  // Homing missile specific
  public targetPos?: Vector2;
  public lockOnActive: boolean = false;

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
    this.damage = this.def?.damage || 20;
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
      else if (type === 'cryo') this.radius = 14;
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

    // Direct-Hit Homing Missile Steering Logic
    if (this.type === 'cryo' && this.targetPos) {
      const dirToTarget = this.targetPos.clone().subtract(this.position).normalize();
      const currentDir = this.velocity.clone().normalize();
      currentDir.lerp(dirToTarget, dt * 3.5).normalize();
      this.velocity = currentDir.multiplyScalar(this.def.projectileSpeed || 650);
      this.angle = this.velocity.angle();
    }

    const step = this.velocity.clone().multiplyScalar(dt);
    this.position.add(step);
    this.distanceTraveled += step.length();

    if (this.distanceTraveled >= this.maxDistance) {
      this.isDead = true;
    }

    // High-Fidelity Trail Particles
    if (particleEngine) {
      if (this.type === 'cryo') {
        particleEngine.emitExhaustSmoke(this.position, this.angle + Math.PI);
        if (Math.random() > 0.4) {
          particleEngine.emitIceShatter(this.position);
        }
      } else if (this.type === 'emp') {
        if (Math.random() > 0.3) {
          particleEngine.emitDriftSparks(this.position, this.angle, 1);
        }
      } else if (this.type === 'laser') {
        if (Math.random() > 0.3) {
          particleEngine.emitDriftSparks(this.position, this.angle, 3);
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    if (this.type === 'mine') {
      // 3D Metallic Armed Proximity Landmine (Area Denial Trap)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 5, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flashing Proximity Danger Ring on Track
      const pulse = (Math.sin(Date.now() * 0.008) + 1) * 0.5;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + pulse * 0.4})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 28 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Steel Mine Body
      const mineGrad = ctx.createRadialGradient(0, -2, 2, 0, 0, 16);
      mineGrad.addColorStop(0, '#475569');
      mineGrad.addColorStop(0.5, '#1e293b');
      mineGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = mineGrad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Blinking Red Armed Beacon
      const blink = Math.sin(Date.now() * 0.014) > 0;
      ctx.fillStyle = blink ? '#ff0055' : '#7f1d1d';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = blink ? 16 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.type === 'shockwave') {
      // 3D Expanding EMP Shockwave Ring
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 6;
      ctx.shadowBlur = 22;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 0, this.currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.rotate(this.angle);

      if (this.type === 'cryo') {
        // PROOF OF CONCEPT 2: Direct-Hit Homing Cruise Missile (Tier 3 Epic)
        // Aerodynamic 3D missile fuselage, grid fins, thruster flame & ceramic radome
        ctx.save();

        // 1. Glowing Ion Thruster Plume
        const plumeFlicker = Math.sin(Date.now() * 0.06) * 5;
        const thrusterGrad = ctx.createLinearGradient(-16, 0, -32, 0);
        thrusterGrad.addColorStop(0, '#00f0ff');
        thrusterGrad.addColorStop(0.4, '#a855f7');
        thrusterGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = thrusterGrad;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-14, -3);
        ctx.lineTo(-28 - plumeFlicker, 0);
        ctx.lineTo(-14, 3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // 2. 4 Deployable Grid Stabilizer Fins
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-12, -10, 6, 4);
        ctx.fillRect(-12, 6, 6, 4);
        ctx.fillRect(-6, -8, 4, 3);
        ctx.fillRect(-6, 5, 4, 3);

        // 3. Metallic 3D Missile Fuselage Body
        const missileGrad = ctx.createLinearGradient(0, -6, 0, 6);
        missileGrad.addColorStop(0, '#38bdf8');
        missileGrad.addColorStop(0.3, '#f0f9ff');
        missileGrad.addColorStop(0.7, '#0284c7');
        missileGrad.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = missileGrad;
        drawSafeRoundRect(ctx, -16, -6, 32, 12, 4);
        ctx.fill();

        // 4. Ceramic Guidance Radome Nose
        const noseGrad = ctx.createRadialGradient(16, 0, 1, 16, 0, 7);
        noseGrad.addColorStop(0, '#ffffff');
        noseGrad.addColorStop(0.6, '#38bdf8');
        noseGrad.addColorStop(1, '#0369a1');
        ctx.fillStyle = noseGrad;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(16, -5);
        ctx.lineTo(24, 0);
        ctx.lineTo(16, 5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      } else if (this.type === 'laser') {
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

  /**
   * Render Pre-Firing Lock-On Targeting Reticle Cue over targeted enemy kart
   */
  static renderLockOnCue(ctx: CanvasRenderingContext2D, targetPos: Vector2, isLocked: boolean = true) {
    ctx.save();
    ctx.translate(targetPos.x, targetPos.y);

    const time = Date.now() * 0.005;
    ctx.rotate(time);

    const reticleColor = isLocked ? '#ff0055' : '#facc15';
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = reticleColor;
    ctx.shadowBlur = 12;

    // Outer Rotating Lock Ring with Crosshair Notches
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 0.4);
    ctx.arc(0, 0, 32, Math.PI * 0.5, Math.PI * 0.9);
    ctx.arc(0, 0, 32, Math.PI, Math.PI * 1.4);
    ctx.arc(0, 0, 32, Math.PI * 1.5, Math.PI * 1.9);
    ctx.stroke();

    // Inner Corner Brackets
    ctx.lineWidth = 3;
    const r = 24;
    ctx.beginPath();
    ctx.moveTo(-r, -r + 8);
    ctx.lineTo(-r, -r);
    ctx.lineTo(-r + 8, -r);
    ctx.moveTo(r, -r + 8);
    ctx.lineTo(r, -r);
    ctx.lineTo(r - 8, -r);
    ctx.moveTo(-r, r - 8);
    ctx.lineTo(-r, r);
    ctx.lineTo(-r + 8, r);
    ctx.moveTo(r, r - 8);
    ctx.lineTo(r, r);
    ctx.lineTo(r - 8, r);
    ctx.stroke();

    // Center Diamond
    ctx.fillStyle = reticleColor;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 4);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
