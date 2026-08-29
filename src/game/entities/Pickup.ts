import { Vector2 } from '../physics/Vector2';
import { PickupType } from '../../types/game';
import { drawSafeRoundRect } from '../graphics/PixelArtVehicles';

export class Pickup {
  public id: string;
  public type: PickupType;
  public position: Vector2;
  // Increased collision radius to 32px for crisp pickup at high racing speeds
  public radius: number = 32;
  public isActive: boolean = true;
  public respawnTimer: number = 0;
  public respawnCooldown: number = 5.5;

  private hoverOffset: number = 0;
  private rotation: number = 0;

  constructor(type: PickupType, pos: Vector2, respawnCooldown: number = 5.5) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.type = type;
    this.position = pos.clone();
    this.respawnCooldown = respawnCooldown;
    this.rotation = Math.random() * Math.PI * 2;
  }

  public update(dt: number) {
    this.rotation += dt * 1.8;
    this.hoverOffset = Math.sin(Date.now() * 0.004 + this.position.x) * 5;

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

    // 1. Soft Dynamic Ground Ambient Occlusion Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 22 - this.hoverOffset * 0.6, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'mystery_box') {
      // 3D Isometric Shaded Mystery Crate (38x38px visual footprint)
      ctx.rotate(this.rotation * 0.4);

      // Crate Base with 3D Timber Gradient
      const crateGrad = ctx.createLinearGradient(-19, -19, 19, 19);
      crateGrad.addColorStop(0, '#f59e0b');
      crateGrad.addColorStop(0.5, '#d97706');
      crateGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = crateGrad;
      drawSafeRoundRect(ctx, -19, -19, 38, 38, 6);
      ctx.fill();

      // Metallic Gold Corner Edge Reinforcements
      ctx.fillStyle = '#facc15';
      drawSafeRoundRect(ctx, -19, -19, 9, 9, 2);
      ctx.fill();
      drawSafeRoundRect(ctx, 10, -19, 9, 9, 2);
      ctx.fill();
      drawSafeRoundRect(ctx, -19, 10, 9, 9, 2);
      ctx.fill();
      drawSafeRoundRect(ctx, 10, 10, 9, 9, 2);
      ctx.fill();

      // Planks Separators
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(-19, -6, 38, 2.5);
      ctx.fillRect(-19, 6, 38, 2.5);

      // 3D Holographic Glowing Question Mark "?"
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 14;
      ctx.font = 'bold 19px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 1);
      ctx.shadowBlur = 0;
    } else if (this.type === 'monad_coin') {
      // 3D Metallic Monad Gold Coin
      ctx.rotate(this.rotation * 0.6);

      const coinGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
      coinGrad.addColorStop(0, '#fef08a');
      coinGrad.addColorStop(0.6, '#eab308');
      coinGrad.addColorStop(1, '#a16207');
      ctx.fillStyle = coinGrad;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner Coin Rim
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.stroke();

      // Monad "M" Center Stamp
      ctx.fillStyle = '#713f12';
      ctx.font = 'bold 13px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', 0, 1);
    } else if (this.type === 'nitro') {
      // 3D Nitro Turbo NOS Bottle
      ctx.rotate(this.rotation * 0.3);

      const nosGrad = ctx.createLinearGradient(-11, 0, 11, 0);
      nosGrad.addColorStop(0, '#0369a1');
      nosGrad.addColorStop(0.3, '#0284c7');
      nosGrad.addColorStop(0.6, '#38bdf8');
      nosGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = nosGrad;
      drawSafeRoundRect(ctx, -11, -18, 22, 36, 5);
      ctx.fill();

      // Chrome Valve Top
      ctx.fillStyle = '#e2e8f0';
      drawSafeRoundRect(ctx, -7, -23, 14, 6, 2);
      ctx.fill();

      // Cyan Flame Turbo Symbol
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', 0, 1);
      ctx.shadowBlur = 0;
    } else if (this.type === 'repair_kit') {
      // 3D Heavy Medical Hardcase
      const medGrad = ctx.createLinearGradient(-18, -15, 18, 15);
      medGrad.addColorStop(0, '#f87171');
      medGrad.addColorStop(0.4, '#dc2626');
      medGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = medGrad;
      drawSafeRoundRect(ctx, -18, -15, 36, 30, 5);
      ctx.fill();

      // Steel Corner Latches
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-16, -15, 4, 3);
      ctx.fillRect(12, -15, 4, 3);
      ctx.fillRect(-16, 12, 4, 3);
      ctx.fillRect(12, 12, 4, 3);

      // Glowing White Medical Cross
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.fillRect(-4, -10, 8, 20);
      ctx.fillRect(-10, -4, 20, 8);
      ctx.shadowBlur = 0;
    } else if (this.type === 'shield_pack') {
      // 3D Hexagonal Plasma Shield
      ctx.rotate(this.rotation * 0.5);

      const shieldGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
      shieldGrad.addColorStop(0, '#93c5fd');
      shieldGrad.addColorStop(0.5, '#3b82f6');
      shieldGrad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = shieldGrad;
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * 18;
        const y = Math.sin(angle) * 18;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Hex Rim
      ctx.strokeStyle = '#bfdbfe';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
