import { Vector2 } from '../physics/Vector2';
import { PickupType } from '../../types/game';
import { drawSafeRoundRect } from '../graphics/PixelArtVehicles';

export class Pickup {
  public id: string;
  public type: PickupType;
  public position: Vector2;
  public radius: number = 24;
  public isActive: boolean = true;
  public respawnTimer: number = 0;
  public respawnCooldown: number = 6;

  private hoverOffset: number = 0;
  private rotation: number = 0;

  constructor(type: PickupType, pos: Vector2, respawnCooldown: number = 6) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.type = type;
    this.position = pos.clone();
    this.respawnCooldown = respawnCooldown;
    this.rotation = Math.random() * Math.PI * 2;
  }

  public update(dt: number) {
    this.rotation += dt * 1.8;
    this.hoverOffset = Math.sin(Date.now() * 0.005 + this.position.x) * 4;

    if (!this.isActive) {
      this.respawnTimer += dt;
      if (this.respawnTimer >= this.respawnCooldown) {
        this.isActive = true;
        this.respawnTimer = 0;
      }
    }
  }

  public collect() {
    this.isActive = false;
    this.respawnTimer = 0;
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y + this.hoverOffset);

    // 1. Soft Ground Drop Shadow
    ctx.fillStyle = 'rgba(15, 12, 28, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 16 - this.hoverOffset * 0.5, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'mystery_box') {
      // Realistic Pixel Wooden Crate (matching Pixel Wheels screenshot 1 & 2)
      ctx.rotate(this.rotation * 0.5);

      // Crate Box Shadow / Outer Border
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-17, -17, 34, 34);

      // Crate Main Wooden Planks (Warm Tan Wood)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-14, -14, 28, 28);

      // Wooden Plank Seams
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-14, -5, 28, 2);
      ctx.fillRect(-14, 5, 28, 2);

      // Diagonal Cross Brace Slats (matching Screenshot 1 & 2)
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-12, -12);
      ctx.lineTo(12, 12);
      ctx.stroke();

      // Corner Metal Nails
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-12, -12, 3, 3);
      ctx.fillRect(9, -12, 3, 3);
      ctx.fillRect(-12, 9, 3, 3);
      ctx.fillRect(9, 9, 3, 3);
    } else if (this.type === 'monad_coin') {
      // Glowing Emerald Gem with Ruby Jewel Core (matching Screenshot 1)
      ctx.rotate(this.rotation);

      // Emerald Gem Body (Octagon)
      ctx.fillStyle = '#10b981';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#34d399';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(12, -8);
      ctx.lineTo(16, 4);
      ctx.lineTo(8, 15);
      ctx.lineTo(-8, 15);
      ctx.lineTo(-16, 4);
      ctx.lineTo(-12, -8);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Facet Highlight Lines
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ruby Red Jewel Center Dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'nitro') {
      // Blue Nitro Canister
      ctx.rotate(this.rotation * 0.3);
      ctx.fillStyle = '#0284c7';
      drawSafeRoundRect(ctx, -8, -14, 16, 28, 4);
      ctx.fill();

      // Silver Cap
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-5, -17, 10, 4);

      // Glowing Flame Icon
      ctx.fillStyle = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#38bdf8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', 0, 0);
      ctx.shadowBlur = 0;
    } else if (this.type === 'repair_kit') {
      // Red Cross Medical Kit
      ctx.fillStyle = '#dc2626';
      drawSafeRoundRect(ctx, -14, -12, 28, 24, 4);
      ctx.fill();

      // White Cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -8, 6, 16);
      ctx.fillRect(-8, -3, 16, 6);
    } else if (this.type === 'shield_pack') {
      // Blue Diamond Energy Shield
      ctx.fillStyle = '#2563eb';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(14, -4);
      ctx.lineTo(9, 14);
      ctx.lineTo(-9, 14);
      ctx.lineTo(-14, -4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
