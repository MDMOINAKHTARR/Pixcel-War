import { Vector2 } from '../physics/Vector2';
import { MapHazardDef, HazardType } from '../../types/game';

export class Hazard {
  public id: string;
  public type: HazardType;
  public position: Vector2;
  public width: number;
  public height: number;
  public rotation: number;
  public boostAngle: number;
  public boostForce: number;
  public damagePerSec: number;

  private animOffset: number = 0;

  constructor(def: MapHazardDef) {
    this.id = def.id;
    this.type = def.type;
    this.position = new Vector2(def.x, def.y);
    this.width = def.width;
    this.height = def.height;
    this.rotation = def.rotation || 0;
    this.boostAngle = def.boostAngle ?? this.rotation;
    this.boostForce = def.boostForce || 600;
    this.damagePerSec = def.damagePerSec || 15;
  }

  public update(dt: number) {
    this.animOffset = (this.animOffset + dt * 4) % 1;
  }

  public containsPoint(pt: Vector2): boolean {
    // Unrotate point around center
    const cx = this.position.x + this.width * 0.5;
    const cy = this.position.y + this.height * 0.5;

    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    const dx = pt.x - cx;
    const dy = pt.y - cy;

    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    return (
      rx >= -this.width * 0.5 &&
      rx <= this.width * 0.5 &&
      ry >= -this.height * 0.5 &&
      ry <= this.height * 0.5
    );
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const cx = this.position.x + this.width * 0.5;
    const cy = this.position.y + this.height * 0.5;
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    const halfW = this.width * 0.5;
    const halfH = this.height * 0.5;

    if (this.type === 'boost_pad') {
      // Golden Chevron Boost Strip (matching Pixel Wheels Screenshot 2)
      ctx.fillStyle = 'rgba(23, 15, 38, 0.5)';
      ctx.fillRect(-halfW, -halfH, this.width, this.height);

      const chevronCount = Math.max(3, Math.floor(this.height / 28));
      const stepY = this.height / chevronCount;

      for (let i = 0; i < chevronCount; i++) {
        const cy = -halfH + (i + 0.5) * stepY;
        const pulse = Math.sin(this.animOffset * Math.PI * 2 + i * 0.8) * 2;

        ctx.save();
        ctx.translate(0, cy);

        // Chevron Outer Border / Shadow
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(8 + pulse, 0);
        ctx.lineTo(-10 + pulse, -12);
        ctx.lineTo(-4 + pulse, -12);
        ctx.lineTo(14 + pulse, 0);
        ctx.lineTo(-4 + pulse, 12);
        ctx.lineTo(-10 + pulse, 12);
        ctx.closePath();
        ctx.fill();

        // Chevron Bright Golden Core
        ctx.fillStyle = '#fde047';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(6 + pulse, 0);
        ctx.lineTo(-8 + pulse, -10);
        ctx.lineTo(-4 + pulse, -10);
        ctx.lineTo(10 + pulse, 0);
        ctx.lineTo(-4 + pulse, 10);
        ctx.lineTo(-8 + pulse, 10);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      }
    } else if (this.type === 'toxic_sludge') {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
      ctx.fillRect(-halfW, -halfH, this.width, this.height);

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(-halfW, -halfH, this.width, this.height);

      // Sludge bubbles
      ctx.fillStyle = '#4ade80';
      const bubbleCount = 4;
      for (let i = 0; i < bubbleCount; i++) {
        const bx = Math.sin(this.animOffset * 6 + i * 2) * halfW * 0.6;
        const by = Math.cos(this.animOffset * 6 + i * 3) * halfH * 0.6;
        ctx.beginPath();
        ctx.arc(bx, by, 4 + Math.sin(this.animOffset * 8 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === 'ice_surface') {
      ctx.fillStyle = 'rgba(103, 232, 249, 0.35)';
      ctx.fillRect(-halfW, -halfH, this.width, this.height);

      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-halfW, -halfH, this.width, this.height);

      // Ice sheen streaks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.7, -halfH * 0.5);
      ctx.lineTo(halfW * 0.7, halfH * 0.5);
      ctx.stroke();
    } else if (this.type === 'void_hazard') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(-halfW, -halfH, this.width, this.height);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(-halfW, -halfH, this.width, this.height);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.font = '12px "Russo One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DANGER VOID', 0, 0);
    }

    ctx.restore();
  }
}
