export type VehicleSkinId =
  | 'red'
  | 'police'
  | 'surf'
  | 'pickup'
  | 'roadster'
  | 'santa'
  | 'harvester'
  | 'bigfoot'
  | 'old_f1'
  | 'dark_m'
  | 'rocket'
  | 'locked';

export interface VehicleSkinDef {
  id: VehicleSkinId;
  name: string;
  category: string;
  speed: number;
  accel: number;
  armor: number;
  drift: number;
  unlocked: boolean;
  price: number;
  tokenPrice: number;
}

export const VEHICLE_SKINS: Record<VehicleSkinId, VehicleSkinDef> = {
  red: {
    id: 'red',
    name: 'Red Lightning GT',
    category: 'Supercar',
    speed: 96,
    accel: 92,
    armor: 68,
    drift: 88,
    unlocked: true,
    price: 0,
    tokenPrice: 0,
  },
  police: {
    id: 'police',
    name: 'Police Interceptor 3D',
    category: 'Patrol',
    speed: 92,
    accel: 88,
    armor: 85,
    drift: 80,
    unlocked: true,
    price: 300,
    tokenPrice: 20,
  },
  surf: {
    id: 'surf',
    name: 'Surf Woody Wagon',
    category: 'Classic',
    speed: 85,
    accel: 82,
    armor: 82,
    drift: 92,
    unlocked: true,
    price: 450,
    tokenPrice: 30,
  },
  pickup: {
    id: 'pickup',
    name: 'Heavy Duty 4x4',
    category: 'Utility',
    speed: 82,
    accel: 78,
    armor: 95,
    drift: 75,
    unlocked: true,
    price: 350,
    tokenPrice: 25,
  },
  roadster: {
    id: 'roadster',
    name: 'British Roadster',
    category: 'Vintage',
    speed: 90,
    accel: 86,
    armor: 72,
    drift: 90,
    unlocked: true,
    price: 500,
    tokenPrice: 35,
  },
  santa: {
    id: 'santa',
    name: 'Santa Sleigh Cruiser',
    category: 'Holiday',
    speed: 88,
    accel: 85,
    armor: 88,
    drift: 82,
    unlocked: false,
    price: 600,
    tokenPrice: 40,
  },
  harvester: {
    id: 'harvester',
    name: 'Agro Combine Titan',
    category: 'Heavy',
    speed: 72,
    accel: 65,
    armor: 100,
    drift: 60,
    unlocked: false,
    price: 750,
    tokenPrice: 50,
  },
  bigfoot: {
    id: 'bigfoot',
    name: 'Bigfoot Monster Truck',
    category: 'Monster',
    speed: 80,
    accel: 75,
    armor: 98,
    drift: 72,
    unlocked: false,
    price: 850,
    tokenPrice: 60,
  },
  old_f1: {
    id: 'old_f1',
    name: 'Grand Prix Cigar F1',
    category: 'Formula',
    speed: 100,
    accel: 98,
    armor: 55,
    drift: 96,
    unlocked: false,
    price: 1000,
    tokenPrice: 75,
  },
  dark_m: {
    id: 'dark_m',
    name: 'Dark-M Stealth Hypercar',
    category: 'Stealth',
    speed: 97,
    accel: 95,
    armor: 78,
    drift: 89,
    unlocked: false,
    price: 1200,
    tokenPrice: 85,
  },
  rocket: {
    id: 'rocket',
    name: 'Quantum Plasma Jet',
    category: 'Prototype',
    speed: 100,
    accel: 100,
    armor: 70,
    drift: 98,
    unlocked: false,
    price: 1500,
    tokenPrice: 100,
  },
  locked: {
    id: 'locked',
    name: 'Classified Vehicle',
    category: 'Mystery',
    speed: 0,
    accel: 0,
    armor: 0,
    drift: 0,
    unlocked: false,
    price: 0,
    tokenPrice: 0,
  },
};

export function drawSafeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number = 6
) {
  let radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * High-Fidelity 3D-Rendered Top-Down Vehicle Engine
 * Renders shaded 3D top-down vehicles with metallic gradients, ambient occlusion,
 * 3D tire treads, glass reflections, hood scoops, spoilers, and persistent damage layers.
 */
export class PixelArtVehicles {
  /**
   * Draw 3D vehicle centered at (0,0) with high visual presence and detail.
   * Standard on-screen scale ~1.35x for maximum readability.
   */
  static drawVehicle(
    ctx: CanvasRenderingContext2D,
    skinId: VehicleSkinId,
    scale: number = 1.35,
    customColor?: string,
    healthRatio: number = 1.0,
    isAccelerating: boolean = false
  ) {
    ctx.save();
    ctx.scale(scale, scale);

    // 1. Multi-Stop Volumetric Ambient Occlusion Ground Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 8;
    drawSafeRoundRect(ctx, -20, -34, 40, 68, 10);
    ctx.fill();
    ctx.restore();

    if (skinId === 'locked') {
      ctx.fillStyle = '#0f0c1b';
      drawSafeRoundRect(ctx, -18, -32, 36, 64, 8);
      ctx.fill();
      ctx.strokeStyle = '#312e81';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      return;
    }

    switch (skinId) {
      case 'rocket':
        PixelArtVehicles.drawRocket3D(ctx, isAccelerating);
        break;
      case 'red':
        PixelArtVehicles.drawRedLightning3D(ctx, customColor);
        break;
      case 'police':
        PixelArtVehicles.drawPolice3D(ctx);
        break;
      case 'surf':
        PixelArtVehicles.drawSurf3D(ctx);
        break;
      case 'pickup':
        PixelArtVehicles.drawPickup3D(ctx);
        break;
      case 'roadster':
        PixelArtVehicles.drawRoadster3D(ctx);
        break;
      case 'santa':
        PixelArtVehicles.drawSanta3D(ctx);
        break;
      case 'harvester':
        PixelArtVehicles.drawHarvester3D(ctx);
        break;
      case 'bigfoot':
        PixelArtVehicles.drawBigfoot3D(ctx);
        break;
      case 'old_f1':
        PixelArtVehicles.drawOldF13D(ctx);
        break;
      case 'dark_m':
        PixelArtVehicles.drawDarkM3D(ctx);
        break;
      default:
        PixelArtVehicles.drawRocket3D(ctx, isAccelerating);
        break;
    }

    // 2. Persistent Visual Damage Overlay System (scuffs, dents, and sparking)
    if (healthRatio < 0.75) {
      PixelArtVehicles.renderDamageOverlay(ctx, healthRatio);
    }

    ctx.restore();
  }

  /**
   * Helper: Render 3D Rubber Tire with Grooved Treads & Alloy Rims
   */
  private static draw3DWheel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number = 7,
    h: number = 16
  ) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    drawSafeRoundRect(ctx, x - 1, y - 1, w + 2, h + 2, 3);
    ctx.fill();

    const tireGrad = ctx.createLinearGradient(x, y, x + w, y);
    tireGrad.addColorStop(0, '#111827');
    tireGrad.addColorStop(0.5, '#374151');
    tireGrad.addColorStop(1, '#111827');
    ctx.fillStyle = tireGrad;
    drawSafeRoundRect(ctx, x, y, w, h, 2);
    ctx.fill();

    // Tread Grooves
    ctx.fillStyle = '#0b0f19';
    for (let ty = y + 2; ty < y + h - 2; ty += 4) {
      ctx.fillRect(x, ty, w, 1.5);
    }

    // Alloy Rim
    const rimGrad = ctx.createLinearGradient(x + 1, y + 3, x + w - 1, y + h - 3);
    rimGrad.addColorStop(0, '#e2e8f0');
    rimGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = rimGrad;
    drawSafeRoundRect(ctx, x + 1.5, y + 4, w - 3, h - 8, 1);
    ctx.fill();

    ctx.restore();
  }

  /**
   * PROOF OF CONCEPT 1: 3D Quantum Plasma Jet Rocket Car
   * Features: Nose cone panel lines, swept delta wings, vertical stabilizer fins,
   * canopy glass with driver silhouette, and animated exhaust glow + heat shimmer under throttle.
   */
  private static drawRocket3D(ctx: CanvasRenderingContext2D, isAccelerating: boolean = false) {
    // 1. Dynamic Throttle Heat-Shimmer Waves & Ion Exhaust
    if (isAccelerating) {
      ctx.save();
      const wave = Math.sin(Date.now() * 0.04) * 5;
      const shimmerGrad = ctx.createRadialGradient(0, 42, 4, 0, 48, 28);
      shimmerGrad.addColorStop(0, 'rgba(0, 240, 255, 0.6)');
      shimmerGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.35)');
      shimmerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shimmerGrad;
      ctx.beginPath();
      ctx.ellipse(0, 46 + wave * 0.5, 18, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Swept Delta Wings with 3D Carbon Bevels
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(24, 22);
    ctx.lineTo(22, 32);
    ctx.lineTo(-22, 32);
    ctx.lineTo(-24, 22);
    ctx.closePath();
    ctx.fill();

    // 3. Metallic Fuselage Hull (Multi-stop gradient)
    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#3b0764');
    bodyGrad.addColorStop(0.25, '#6b21a8');
    bodyGrad.addColorStop(0.5, '#c084fc');
    bodyGrad.addColorStop(0.75, '#6b21a8');
    bodyGrad.addColorStop(1, '#3b0764');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(16, -6);
    ctx.lineTo(16, 26);
    ctx.lineTo(12, 34);
    ctx.lineTo(-12, 34);
    ctx.lineTo(-16, 26);
    ctx.lineTo(-16, -6);
    ctx.closePath();
    ctx.fill();

    // 4. Ceramic Thermal Tile Panel Seams on Nosecone
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(0, -14);
    ctx.moveTo(-6, -26);
    ctx.lineTo(6, -26);
    ctx.moveTo(-11, -16);
    ctx.lineTo(11, -16);
    ctx.stroke();

    // 5. Dual Fin-Like Rear Vertical Stabilizers
    const finGradLeft = ctx.createLinearGradient(-15, 12, -11, 12);
    finGradLeft.addColorStop(0, '#00f0ff');
    finGradLeft.addColorStop(1, '#0284c7');
    ctx.fillStyle = finGradLeft;
    drawSafeRoundRect(ctx, -16, 10, 5, 22, 2);
    ctx.fill();

    const finGradRight = ctx.createLinearGradient(11, 12, 15, 12);
    finGradRight.addColorStop(0, '#0284c7');
    finGradRight.addColorStop(1, '#00f0ff');
    ctx.fillStyle = finGradRight;
    drawSafeRoundRect(ctx, 11, 10, 5, 22, 2);
    ctx.fill();

    // 6. Cockpit Canopy with Pilot Silhouette Inside
    const glassGrad = ctx.createLinearGradient(0, -14, 0, 6);
    glassGrad.addColorStop(0, '#083344');
    glassGrad.addColorStop(0.5, '#06b6d4');
    glassGrad.addColorStop(1, '#083344');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.ellipse(0, -4, 7, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pilot Helmet Silhouette
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-2, -6, 4, 2); // Visor

    // Canopy Specular Glare
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -4, 5.5, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();

    // 7. Dual Plasma Thruster Nozzles & Animated Flame Jets
    ctx.fillStyle = '#020617';
    drawSafeRoundRect(ctx, -11, 30, 8, 6, 2);
    drawSafeRoundRect(ctx, 3, 30, 8, 6, 2);
    ctx.fill();

    // Plasma Exhaust Core
    const flicker = Math.sin(Date.now() * 0.05) * 4;
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(-10, 36);
    ctx.lineTo(-7, 46 + flicker);
    ctx.lineTo(-4, 36);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(4, 36);
    ctx.lineTo(7, 46 + flicker);
    ctx.lineTo(10, 36);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  /**
   * Persistent Battle Damage Feedback System
   */
  private static renderDamageOverlay(ctx: CanvasRenderingContext2D, healthRatio: number) {
    ctx.save();

    // Abrasive Scratches & Scuffs (HP < 75%)
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(-4, -6);
    ctx.moveTo(6, 4);
    ctx.lineTo(12, 8);
    ctx.stroke();

    // Heavy Impact Dents & Scorched Hull (HP < 50%)
    if (healthRatio < 0.5) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.ellipse(-7, 2, 4, 3, 0.4, 0, Math.PI * 2);
      ctx.ellipse(8, -10, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Micro Electrical Sparks & Smoking Vents (HP < 25%)
    if (healthRatio < 0.25) {
      if (Math.sin(Date.now() * 0.03) > 0) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(-8, 6);
        ctx.lineTo(-12, 10);
        ctx.lineTo(-7, 14);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }

  /**
   * 2. 3D Red Lightning GT Supercar
   */
  private static drawRedLightning3D(ctx: CanvasRenderingContext2D, bodyColor: string = '#ef4444') {
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    ctx.fillStyle = '#1e293b';
    drawSafeRoundRect(ctx, -16, -34, 32, 6, 2);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#991b1b');
    bodyGrad.addColorStop(0.2, bodyColor);
    bodyGrad.addColorStop(0.5, '#fca5a5');
    bodyGrad.addColorStop(0.8, bodyColor);
    bodyGrad.addColorStop(1, '#7f1d1d');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 8);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-6, -32, 4, 64);
    ctx.fillRect(2, -32, 4, 64);

    const glassGrad = ctx.createLinearGradient(0, -18, 0, -4);
    glassGrad.addColorStop(0, '#1e1b4b');
    glassGrad.addColorStop(0.5, '#312e81');
    glassGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = glassGrad;
    drawSafeRoundRect(ctx, -13, -16, 26, 13, 4);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    drawSafeRoundRect(ctx, -12, -2, 24, 16, 3);
    ctx.fill();

    ctx.fillStyle = '#020617';
    ctx.fillRect(-6, 23, 2, 6);
    ctx.fillRect(4, 23, 2, 6);
    drawSafeRoundRect(ctx, -16, 27, 32, 5, 2);
    ctx.fill();
  }

  /**
   * 3. 3D Police Interceptor Patrol Cruiser
   */
  private static drawPolice3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    ctx.fillStyle = '#0f172a';
    drawSafeRoundRect(ctx, -15, -35, 30, 6, 2);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#0f172a');
    bodyGrad.addColorStop(0.3, '#1e293b');
    bodyGrad.addColorStop(0.5, '#334155');
    bodyGrad.addColorStop(0.7, '#1e293b');
    bodyGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 7);
    ctx.fill();

    const roofGrad = ctx.createLinearGradient(0, -10, 0, 15);
    roofGrad.addColorStop(0, '#f8fafc');
    roofGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = roofGrad;
    drawSafeRoundRect(ctx, -13, -12, 26, 30, 4);
    ctx.fill();

    const isRedActive = Math.floor(Date.now() / 120) % 2 === 0;
    ctx.fillStyle = isRedActive ? '#ef4444' : '#7f1d1d';
    drawSafeRoundRect(ctx, -10, -3.5, 9, 5, 1.5);
    ctx.fill();

    ctx.fillStyle = !isRedActive ? '#00e5ff' : '#0369a1';
    drawSafeRoundRect(ctx, 1, -3.5, 9, 5, 1.5);
    ctx.fill();
  }

  /**
   * 4. 3D Surf Woody Wagon
   */
  private static drawSurf3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#b45309');
    bodyGrad.addColorStop(0.3, '#f59e0b');
    bodyGrad.addColorStop(0.5, '#fde68a');
    bodyGrad.addColorStop(0.7, '#f59e0b');
    bodyGrad.addColorStop(1, '#b45309');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 7);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.fillRect(-16, -18, 3, 44);
    ctx.fillRect(13, -18, 3, 44);

    const roofGrad = ctx.createLinearGradient(-12, 0, 12, 0);
    roofGrad.addColorStop(0, '#0e7490');
    roofGrad.addColorStop(0.5, '#22d3ee');
    roofGrad.addColorStop(1, '#0e7490');
    ctx.fillStyle = roofGrad;
    drawSafeRoundRect(ctx, -13, -16, 26, 44, 4);
    ctx.fill();
  }

  /**
   * 5. 3D Heavy Duty 4x4 Pickup
   */
  private static drawPickup3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#92400e');
    bodyGrad.addColorStop(0.3, '#d97706');
    bodyGrad.addColorStop(0.5, '#fde68a');
    bodyGrad.addColorStop(0.7, '#d97706');
    bodyGrad.addColorStop(1, '#92400e');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 6);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    drawSafeRoundRect(ctx, -14, -20, 28, 22, 4);
    ctx.fill();

    ctx.fillStyle = '#334155';
    drawSafeRoundRect(ctx, -12, 6, 24, 23, 2);
    ctx.fill();
  }

  /**
   * 6. 3D British Roadster
   */
  private static drawRoadster3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -21, -26, 6, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 6, 16);
    PixelArtVehicles.draw3DWheel(ctx, -21, 10, 6, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 6, 17);

    const bodyGrad = ctx.createLinearGradient(-15, 0, 15, 0);
    bodyGrad.addColorStop(0, '#14532d');
    bodyGrad.addColorStop(0.3, '#16a34a');
    bodyGrad.addColorStop(0.5, '#86efac');
    bodyGrad.addColorStop(0.7, '#16a34a');
    bodyGrad.addColorStop(1, '#14532d');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -15, -32, 30, 64, 10);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    drawSafeRoundRect(ctx, -10, 0, 20, 20, 5);
    ctx.fill();
  }

  /**
   * 7. 3D Santa Sleigh
   */
  private static drawSanta3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#991b1b');
    bodyGrad.addColorStop(0.3, '#dc2626');
    bodyGrad.addColorStop(0.5, '#fca5a5');
    bodyGrad.addColorStop(0.7, '#dc2626');
    bodyGrad.addColorStop(1, '#991b1b');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 6);
    ctx.fill();
  }

  /**
   * 8. 3D Agro Combine Harvester
   */
  private static drawHarvester3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -24, -20, 9, 20);
    PixelArtVehicles.draw3DWheel(ctx, 15, -20, 9, 20);
    PixelArtVehicles.draw3DWheel(ctx, -20, 12, 7, 14);
    PixelArtVehicles.draw3DWheel(ctx, 13, 12, 7, 14);

    ctx.fillStyle = '#15803d';
    drawSafeRoundRect(ctx, -23, -36, 46, 9, 2);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#14532d');
    bodyGrad.addColorStop(0.3, '#22c55e');
    bodyGrad.addColorStop(0.5, '#86efac');
    bodyGrad.addColorStop(0.7, '#22c55e');
    bodyGrad.addColorStop(1, '#14532d');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -26, 32, 56, 5);
    ctx.fill();
  }

  /**
   * 9. 3D Bigfoot Camo Monster Truck
   */
  private static drawBigfoot3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -26, -30, 10, 22);
    PixelArtVehicles.draw3DWheel(ctx, 16, -30, 10, 22);
    PixelArtVehicles.draw3DWheel(ctx, -26, 8, 10, 22);
    PixelArtVehicles.draw3DWheel(ctx, 16, 8, 10, 22);

    const bodyGrad = ctx.createLinearGradient(-15, 0, 15, 0);
    bodyGrad.addColorStop(0, '#365314');
    bodyGrad.addColorStop(0.3, '#4d7c0f');
    bodyGrad.addColorStop(0.5, '#a3e635');
    bodyGrad.addColorStop(0.7, '#4d7c0f');
    bodyGrad.addColorStop(1, '#365314');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -15, -28, 30, 56, 5);
    ctx.fill();
  }

  /**
   * 10. 3D Grand Prix Cigar F1
   */
  private static drawOldF13D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -23, -24, 6, 14);
    PixelArtVehicles.draw3DWheel(ctx, 17, -24, 6, 14);
    PixelArtVehicles.draw3DWheel(ctx, -23, 10, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 16, 10, 7, 16);

    const bodyGrad = ctx.createLinearGradient(-9, 0, 9, 0);
    bodyGrad.addColorStop(0, '#0369a1');
    bodyGrad.addColorStop(0.3, '#0ea5e9');
    bodyGrad.addColorStop(0.5, '#bae6fd');
    bodyGrad.addColorStop(0.7, '#0ea5e9');
    bodyGrad.addColorStop(1, '#0369a1');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -9, -32, 18, 64, 6);
    ctx.fill();
  }

  /**
   * 11. 3D Dark-M Stealth Hypercar
   */
  private static drawDarkM3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#090d16');
    bodyGrad.addColorStop(0.3, '#1e1b2e');
    bodyGrad.addColorStop(0.5, '#3730a3');
    bodyGrad.addColorStop(0.7, '#1e1b2e');
    bodyGrad.addColorStop(1, '#090d16');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 8);
    ctx.fill();
  }
}
