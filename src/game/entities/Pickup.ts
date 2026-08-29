import { Vector2 } from '../physics/Vector2';
import { PickupType } from '../../types/game';
import { drawSafeRoundRect } from '../graphics/PixelArtVehicles';

export class Pickup {
  public id: string;
  public type: PickupType;
  public position: Vector2;
  // Crisp pickup radius at high racing speeds
  public radius: number = 34;
  public isActive: boolean = true;
  public respawnTimer: number = 0;
  public respawnCooldown: number = 5.5;

  private hoverOffset: number = 0;
  private rotation: number = 0;
  private pulseTimer: number = 0;

  constructor(type: PickupType, pos: Vector2, respawnCooldown: number = 5.5) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.type = type;
    this.position = pos.clone();
    this.respawnCooldown = respawnCooldown;
    this.rotation = Math.random() * Math.PI * 2;
    this.pulseTimer = Math.random() * Math.PI * 2;
  }

  public update(dt: number) {
    this.rotation += dt * 1.6;
    this.pulseTimer += dt * 3.5;
    // Smooth idle bobbing animation
    this.hoverOffset = Math.sin(Date.now() * 0.0035 + this.position.x * 0.01) * 6;

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

    const pulse = (Math.sin(this.pulseTimer) + 1) * 0.5; // 0 to 1

    // 1. Road Surface Ground Presence: Soft Pulsing Aura & Ground Drop Shadow
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Soft Pulsing Radial Aura on Road
    let glowColor = 'rgba(245, 158, 11, ';
    if (this.type === 'nitro') glowColor = 'rgba(56, 189, 248, ';
    else if (this.type === 'repair_kit') glowColor = 'rgba(239, 68, 68, ';
    else if (this.type === 'shield_pack') glowColor = 'rgba(59, 130, 246, ';
    else if (this.type === 'monad_coin') glowColor = 'rgba(234, 179, 8, ';

    const auraRadius = 26 + pulse * 6;
    const auraGrad = ctx.createRadialGradient(0, 18, 4, 0, 18, auraRadius);
    auraGrad.addColorStop(0, `${glowColor}${0.35 + pulse * 0.2})`);
    auraGrad.addColorStop(0.6, `${glowColor}${0.15 + pulse * 0.1})`);
    auraGrad.addColorStop(1, `${glowColor}0)`);
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(0, 18, auraRadius, auraRadius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ground Drop Shadow (Scales inversely with hover height for realistic surface separation)
    const shadowScale = Math.max(0.7, 1 - (this.hoverOffset + 6) * 0.035);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 22 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 2. Floating Animated 3D Sprite
    ctx.save();
    ctx.translate(this.position.x, this.position.y + this.hoverOffset);

    if (this.type === 'mystery_box') {
      // 3D Isometric Mystery Weapon Crate with Gentle Spin & Rich Detailing
      ctx.rotate(this.rotation * 0.35);

      // Crate Base with 3D Timber Gradient
      const crateGrad = ctx.createLinearGradient(-20, -20, 20, 20);
      crateGrad.addColorStop(0, '#f59e0b');
      crateGrad.addColorStop(0.5, '#d97706');
      crateGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = crateGrad;
      drawSafeRoundRect(ctx, -20, -20, 40, 40, 6);
      ctx.fill();

      // Outer Bevel Highlight Border
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      drawSafeRoundRect(ctx, -19, -19, 38, 38, 5);
      ctx.stroke();

      // Metallic Gold Corner Edge Reinforcements
      ctx.fillStyle = '#facc15';
      drawSafeRoundRect(ctx, -20, -20, 10, 10, 2);
      ctx.fill();
      drawSafeRoundRect(ctx, 10, -20, 10, 10, 2);
      ctx.fill();
      drawSafeRoundRect(ctx, -20, 10, 10, 10, 2);
      ctx.fill();
      drawSafeRoundRect(ctx, 10, 10, 10, 10, 2);
      ctx.fill();

      // Steel Corner Rivets
      ctx.fillStyle = '#713f12';
      ctx.fillRect(-17, -17, 3, 3);
      ctx.fillRect(14, -17, 3, 3);
      ctx.fillRect(-17, 14, 3, 3);
      ctx.fillRect(14, 14, 3, 3);

      // Horizontal Plank Inset Separators
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(-20, -7, 40, 3);
      ctx.fillRect(-20, 5, 40, 3);

      // High-Contrast Holographic Glowing Question Mark "?"
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 16 + pulse * 6;
      ctx.font = 'bold 20px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 1);
      ctx.shadowBlur = 0;
    } else if (this.type === 'monad_coin') {
      // 3D Metallic Monad Gold Coin
      ctx.rotate(this.rotation * 0.6);

      const coinGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 19);
      coinGrad.addColorStop(0, '#fef08a');
      coinGrad.addColorStop(0.6, '#eab308');
      coinGrad.addColorStop(1, '#a16207');
      ctx.fillStyle = coinGrad;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 14 + pulse * 6;
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner Coin Rim
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Monad "M" Center Stamp
      ctx.fillStyle = '#713f12';
      ctx.font = 'bold 14px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', 0, 1);
    } else if (this.type === 'nitro') {
      // 3D Nitro Turbo NOS Bottle
      ctx.rotate(this.rotation * 0.3);

      const nosGrad = ctx.createLinearGradient(-12, 0, 12, 0);
      nosGrad.addColorStop(0, '#0369a1');
      nosGrad.addColorStop(0.3, '#0284c7');
      nosGrad.addColorStop(0.6, '#38bdf8');
      nosGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = nosGrad;
      drawSafeRoundRect(ctx, -12, -19, 24, 38, 5);
      ctx.fill();

      // Chrome Valve Top
      ctx.fillStyle = '#e2e8f0';
      drawSafeRoundRect(ctx, -8, -24, 16, 6, 2);
      ctx.fill();

      // Cyan Flame Turbo Symbol
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12 + pulse * 6;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', 0, 1);
      ctx.shadowBlur = 0;
    } else if (this.type === 'repair_kit') {
      // 3D Heavy Medical Hardcase
      const medGrad = ctx.createLinearGradient(-19, -16, 19, 16);
      medGrad.addColorStop(0, '#f87171');
      medGrad.addColorStop(0.4, '#dc2626');
      medGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = medGrad;
      drawSafeRoundRect(ctx, -19, -16, 38, 32, 5);
      ctx.fill();

      // Steel Corner Latches
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-17, -16, 4, 3);
      ctx.fillRect(13, -16, 4, 3);
      ctx.fillRect(-17, 13, 4, 3);
      ctx.fillRect(13, 13, 4, 3);

      // Glowing White Medical Cross
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10 + pulse * 6;
      ctx.fillRect(-5, -11, 10, 22);
      ctx.fillRect(-11, -5, 22, 10);
      ctx.shadowBlur = 0;
    } else if (this.type === 'shield_pack') {
      // 3D Hexagonal Plasma Shield
      ctx.rotate(this.rotation * 0.5);

      const shieldGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 19);
      shieldGrad.addColorStop(0, '#93c5fd');
      shieldGrad.addColorStop(0.5, '#3b82f6');
      shieldGrad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = shieldGrad;
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 14 + pulse * 6;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * 19;
        const y = Math.sin(angle) * 19;
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
