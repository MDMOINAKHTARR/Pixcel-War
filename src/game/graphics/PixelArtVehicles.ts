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
 * 3D tire treads, glass reflections, hood scoops, spoilers, and dynamic light halos.
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
    customColor?: string
  ) {
    ctx.save();
    ctx.scale(scale, scale);

    // 1. Multi-Stop Volumetric Ambient Occlusion Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 7;
    drawSafeRoundRect(ctx, -19, -32, 38, 64, 10);
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
      case 'rocket':
        PixelArtVehicles.drawRocket3D(ctx);
        break;
      default:
        PixelArtVehicles.drawRedLightning3D(ctx, customColor);
        break;
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
    h: number = 16,
    isLarge: boolean = false
  ) {
    ctx.save();
    // Tire Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    drawSafeRoundRect(ctx, x - 1, y - 1, w + 2, h + 2, 3);
    ctx.fill();

    // Rubber Tire Base (Dark Gray with gradient)
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

    // Alloy Rim Center Hub
    const rimGrad = ctx.createLinearGradient(x + 1, y + 3, x + w - 1, y + h - 3);
    rimGrad.addColorStop(0, '#e2e8f0');
    rimGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = rimGrad;
    drawSafeRoundRect(ctx, x + 1.5, y + 4, w - 3, h - 8, 1);
    ctx.fill();

    ctx.restore();
  }

  /**
   * 1. 3D Red Lightning GT Supercar
   */
  private static drawRedLightning3D(ctx: CanvasRenderingContext2D, bodyColor: string = '#ef4444') {
    // 4 3D Wide Performance Tires
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    // Aerodynamic Carbon Front Splitter
    ctx.fillStyle = '#1e293b';
    drawSafeRoundRect(ctx, -16, -34, 32, 6, 2);
    ctx.fill();

    // Sculpted 3D Body Chassis (Curved metallic gradient)
    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#991b1b');
    bodyGrad.addColorStop(0.2, bodyColor);
    bodyGrad.addColorStop(0.5, '#fca5a5');
    bodyGrad.addColorStop(0.8, bodyColor);
    bodyGrad.addColorStop(1, '#7f1d1d');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 8);
    ctx.fill();

    // Side Door Aero Recesses
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-15, -12, 3, 26);
    ctx.fillRect(12, -12, 3, 26);

    // Dual White Racing Stripes with 3D drop depth
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-6, -32, 4, 64);
    ctx.fillRect(2, -32, 4, 64);

    // Hood Heat Extraction Vents
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-11, -26, 3, 7);
    ctx.fillRect(8, -26, 3, 7);

    // 3D Glass Windshield (Curved gradient + specular glare)
    const glassGrad = ctx.createLinearGradient(0, -18, 0, -4);
    glassGrad.addColorStop(0, '#1e1b4b');
    glassGrad.addColorStop(0.5, '#312e81');
    glassGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = glassGrad;
    drawSafeRoundRect(ctx, -13, -16, 26, 13, 4);
    ctx.fill();

    // Windshield Specular Glass Glare
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.lineTo(-4, -14);
    ctx.lineTo(-7, -6);
    ctx.lineTo(-12, -6);
    ctx.closePath();
    ctx.fill();

    // Carbon Fiber Roof
    ctx.fillStyle = '#0f172a';
    drawSafeRoundRect(ctx, -12, -2, 24, 16, 3);
    ctx.fill();

    // Rear Window Glass
    ctx.fillStyle = '#1e1b4b';
    drawSafeRoundRect(ctx, -11, 14, 22, 9, 2);
    ctx.fill();

    // GT Carbon Rear Spoiler (Raised on struts)
    ctx.fillStyle = '#020617';
    ctx.fillRect(-6, 23, 2, 6);
    ctx.fillRect(4, 23, 2, 6);
    drawSafeRoundRect(ctx, -16, 27, 32, 5, 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillRect(-15, 27, 30, 1.5); // Top highlight

    // Dual Chrome Exhaust Pipes (Glowing heat core)
    ctx.fillStyle = '#e2e8f0';
    drawSafeRoundRect(ctx, -10, 31, 5, 3, 1);
    drawSafeRoundRect(ctx, 5, 31, 5, 3, 1);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-9, 32, 3, 1.5);
    ctx.fillRect(6, 32, 3, 1.5);

    // Projector LED Headlights (Glowing)
    ctx.fillStyle = '#fef08a';
    drawSafeRoundRect(ctx, -14, -32, 6, 3, 1);
    drawSafeRoundRect(ctx, 8, -32, 6, 3, 1);
    ctx.fill();

    // Crimson LED Taillight Bar
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 8;
    ctx.fillRect(-14, 30, 28, 2);
    ctx.shadowBlur = 0;
  }

  /**
   * 2. 3D Police Interceptor Patrol Cruiser
   */
  private static drawPolice3D(ctx: CanvasRenderingContext2D) {
    // 4 3D Heavy Tires
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    // Heavy Steel Bullbar Push Bumper
    ctx.fillStyle = '#0f172a';
    drawSafeRoundRect(ctx, -15, -35, 30, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillRect(-12, -34, 24, 2);

    // Navy Blue Body with 3D metallic gradient
    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#0f172a');
    bodyGrad.addColorStop(0.3, '#1e293b');
    bodyGrad.addColorStop(0.5, '#334155');
    bodyGrad.addColorStop(0.7, '#1e293b');
    bodyGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 7);
    ctx.fill();

    // White High-Visibility Roof Section
    const roofGrad = ctx.createLinearGradient(0, -10, 0, 15);
    roofGrad.addColorStop(0, '#f8fafc');
    roofGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = roofGrad;
    drawSafeRoundRect(ctx, -13, -12, 26, 30, 4);
    ctx.fill();

    // Tinted Windshield Glass
    ctx.fillStyle = '#090d16';
    drawSafeRoundRect(ctx, -12, -18, 24, 9, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(-9, -16, 4, 5);

    // Rear Window Glass
    ctx.fillStyle = '#090d16';
    drawSafeRoundRect(ctx, -12, 16, 24, 7, 2);
    ctx.fill();

    // 3D Animated Police LED Lightbar (Flashing Red/Blue with Bloom)
    const isRedActive = Math.floor(Date.now() / 120) % 2 === 0;

    // Lightbar Base
    ctx.fillStyle = '#020617';
    drawSafeRoundRect(ctx, -11, -4, 22, 6, 2);
    ctx.fill();

    // Red Strobe Lens
    ctx.save();
    ctx.fillStyle = isRedActive ? '#ef4444' : '#7f1d1d';
    if (isRedActive) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
    }
    drawSafeRoundRect(ctx, -10, -3.5, 9, 5, 1.5);
    ctx.fill();
    ctx.restore();

    // Blue Strobe Lens
    ctx.save();
    ctx.fillStyle = !isRedActive ? '#00e5ff' : '#0369a1';
    if (!isRedActive) {
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
    }
    drawSafeRoundRect(ctx, 1, -3.5, 9, 5, 1.5);
    ctx.fill();
    ctx.restore();

    // Center White Strobe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -3, 2, 4);

    // Dual Projector Headlights
    ctx.fillStyle = '#ffffff';
    drawSafeRoundRect(ctx, -14, -32, 5, 3, 1);
    drawSafeRoundRect(ctx, 9, -32, 5, 3, 1);
    ctx.fill();

    // Taillights
    ctx.fillStyle = '#ff1133';
    ctx.fillRect(-14, 30, 5, 2);
    ctx.fillRect(9, 30, 5, 2);
  }

  /**
   * 3. 3D Surf Woody Wagon (Yellow body, rich wood trim, dual surfboards)
   */
  private static drawSurf3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    // Warm Sunburst Yellow Body
    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#b45309');
    bodyGrad.addColorStop(0.3, '#f59e0b');
    bodyGrad.addColorStop(0.5, '#fde68a');
    bodyGrad.addColorStop(0.7, '#f59e0b');
    bodyGrad.addColorStop(1, '#b45309');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 7);
    ctx.fill();

    // Rich Mahogany Wood-Grain Side Panels
    const woodGrad = ctx.createLinearGradient(0, -20, 0, 24);
    woodGrad.addColorStop(0, '#78350f');
    woodGrad.addColorStop(0.5, '#92400e');
    woodGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(-16, -18, 3, 44);
    ctx.fillRect(13, -18, 3, 44);

    // Vintage Teal Cab Roof
    const roofGrad = ctx.createLinearGradient(-12, 0, 12, 0);
    roofGrad.addColorStop(0, '#0e7490');
    roofGrad.addColorStop(0.5, '#22d3ee');
    roofGrad.addColorStop(1, '#0e7490');
    ctx.fillStyle = roofGrad;
    drawSafeRoundRect(ctx, -13, -16, 26, 44, 4);
    ctx.fill();

    // Windshield Glass
    ctx.fillStyle = '#164e63';
    drawSafeRoundRect(ctx, -12, -20, 24, 6, 2);
    ctx.fill();

    // Chrome Roof Rack Bars
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-12, -8, 24, 2);
    ctx.fillRect(-12, 14, 24, 2);

    // 3D Surfboard 1 (Emerald Green with yellow racing stripe)
    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.ellipse(-5, 4, 3.5, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-6, 0, 2, 8);
    ctx.restore();

    // 3D Surfboard 2 (Coral Red with white racing stripe)
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(5, 4, 3.5, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 0, 2, 8);
    ctx.restore();
  }

  /**
   * 4. 3D Classic Pickup Truck (Heavy duty chassis, recessed steel bed)
   */
  private static drawPickup3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    // Warm Tan / Bronze Body
    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#92400e');
    bodyGrad.addColorStop(0.3, '#d97706');
    bodyGrad.addColorStop(0.5, '#fde68a');
    bodyGrad.addColorStop(0.7, '#d97706');
    bodyGrad.addColorStop(1, '#92400e');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 6);
    ctx.fill();

    // Elevated Cabin Roof
    ctx.fillStyle = '#f59e0b';
    drawSafeRoundRect(ctx, -14, -20, 28, 22, 4);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#451a03';
    drawSafeRoundRect(ctx, -12, -22, 24, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -21, 5, 3);

    // Heavy Rollbar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-13, 2, 26, 3);

    // Recessed Steel Truck Bed with Grooved Ribs
    ctx.fillStyle = '#334155';
    drawSafeRoundRect(ctx, -12, 6, 24, 23, 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    for (let by = 9; by < 27; by += 4) {
      ctx.fillRect(-10, by, 20, 1.5);
    }
  }

  /**
   * 5. 3D British Roadster (Vintage curved fenders, open leather cockpit)
   */
  private static drawRoadster3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -21, -26, 6, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 6, 16);
    PixelArtVehicles.draw3DWheel(ctx, -21, 10, 6, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 6, 17);

    // Racing Green Metallic Body
    const bodyGrad = ctx.createLinearGradient(-15, 0, 15, 0);
    bodyGrad.addColorStop(0, '#14532d');
    bodyGrad.addColorStop(0.3, '#16a34a');
    bodyGrad.addColorStop(0.5, '#86efac');
    bodyGrad.addColorStop(0.7, '#16a34a');
    bodyGrad.addColorStop(1, '#14532d');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -15, -32, 30, 64, 10);
    ctx.fill();

    // Chrome Radiator Grill
    ctx.fillStyle = '#e2e8f0';
    drawSafeRoundRect(ctx, -7, -34, 14, 4, 1);
    ctx.fill();

    // Hood Louvers
    ctx.fillStyle = '#052e16';
    ctx.fillRect(-5, -24, 10, 14);

    // Aero Curved Windscreen
    ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
    drawSafeRoundRect(ctx, -11, -8, 22, 5, 2);
    ctx.fill();

    // Tan Leather Open Cockpit
    ctx.fillStyle = '#b45309';
    drawSafeRoundRect(ctx, -10, 0, 20, 20, 5);
    ctx.fill();

    // Steering Wheel & Headrests
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 5, 3.5, 0, Math.PI * 2);
    ctx.stroke();

    // Twin Headrest Fairings
    ctx.fillStyle = '#15803d';
    drawSafeRoundRect(ctx, -7, 18, 5, 8, 2);
    drawSafeRoundRect(ctx, 2, 18, 5, 8, 2);
    ctx.fill();
  }

  /**
   * 6. 3D Santa Sleigh Truck (Holiday crimson, gold bumper, holiday decal)
   */
  private static drawSanta3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    // Holiday Crimson Gradient
    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#991b1b');
    bodyGrad.addColorStop(0.3, '#dc2626');
    bodyGrad.addColorStop(0.5, '#fca5a5');
    bodyGrad.addColorStop(0.7, '#dc2626');
    bodyGrad.addColorStop(1, '#991b1b');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 6);
    ctx.fill();

    // Gold Trim Front Bumper
    ctx.fillStyle = '#facc15';
    drawSafeRoundRect(ctx, -14, -34, 28, 4, 1.5);
    ctx.fill();

    // Cabin
    ctx.fillStyle = '#b91c1c';
    drawSafeRoundRect(ctx, -14, -20, 28, 22, 4);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#1e1b4b';
    drawSafeRoundRect(ctx, -12, -22, 24, 6, 2);
    ctx.fill();

    // Santa Cargo Box
    ctx.fillStyle = '#1e293b';
    drawSafeRoundRect(ctx, -12, 6, 24, 23, 2);
    ctx.fill();

    // Santa Face Emblem
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 17, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fecaca';
    ctx.beginPath();
    ctx.arc(0, 15, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3, 10, 6, 4);
  }

  /**
   * 7. 3D Agro Combine Titan (Heavy green harvester with front cutter reel)
   */
  private static drawHarvester3D(ctx: CanvasRenderingContext2D) {
    // 2 Giant Front Traction Wheels + 2 Rear Steer Wheels
    PixelArtVehicles.draw3DWheel(ctx, -24, -20, 9, 20, true);
    PixelArtVehicles.draw3DWheel(ctx, 15, -20, 9, 20, true);
    PixelArtVehicles.draw3DWheel(ctx, -20, 12, 7, 14);
    PixelArtVehicles.draw3DWheel(ctx, 13, 12, 7, 14);

    // Front Rotating Cutter Header
    ctx.fillStyle = '#15803d';
    drawSafeRoundRect(ctx, -23, -36, 46, 9, 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    for (let i = -20; i <= 18; i += 5) {
      ctx.fillRect(i, -39, 2.5, 5);
    }

    // Heavy Body
    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#14532d');
    bodyGrad.addColorStop(0.3, '#22c55e');
    bodyGrad.addColorStop(0.5, '#86efac');
    bodyGrad.addColorStop(0.7, '#22c55e');
    bodyGrad.addColorStop(1, '#14532d');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -26, 32, 56, 5);
    ctx.fill();

    // Large Panoramic Glass Cabin
    ctx.fillStyle = '#06b6d4';
    drawSafeRoundRect(ctx, -12, -22, 24, 14, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(-8, -20, 6, 6);
  }

  /**
   * 8. 3D Bigfoot Monster Truck (Giant pneumatic tires, camouflage body)
   */
  private static drawBigfoot3D(ctx: CanvasRenderingContext2D) {
    // 4 Massive Monster Truck Tires with Deep Chevron Treads
    PixelArtVehicles.draw3DWheel(ctx, -26, -30, 10, 22, true);
    PixelArtVehicles.draw3DWheel(ctx, 16, -30, 10, 22, true);
    PixelArtVehicles.draw3DWheel(ctx, -26, 8, 10, 22, true);
    PixelArtVehicles.draw3DWheel(ctx, 16, 8, 10, 22, true);

    // Heavy-Duty Yellow Coil-Over Suspension Springs
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-16, -22, 4, 8);
    ctx.fillRect(12, -22, 4, 8);
    ctx.fillRect(-16, 16, 4, 8);
    ctx.fillRect(12, 16, 4, 8);

    // Camo Green Body
    const bodyGrad = ctx.createLinearGradient(-15, 0, 15, 0);
    bodyGrad.addColorStop(0, '#365314');
    bodyGrad.addColorStop(0.3, '#4d7c0f');
    bodyGrad.addColorStop(0.5, '#a3e635');
    bodyGrad.addColorStop(0.7, '#4d7c0f');
    bodyGrad.addColorStop(1, '#365314');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -15, -28, 30, 56, 5);
    ctx.fill();

    // Camo Blotches
    ctx.fillStyle = '#713f12';
    drawSafeRoundRect(ctx, -10, -22, 8, 10, 2);
    ctx.fill();
    drawSafeRoundRect(ctx, 2, -6, 9, 12, 2);
    ctx.fill();

    // Tinted Cabin Glass
    ctx.fillStyle = '#0f172a';
    drawSafeRoundRect(ctx, -11, -16, 22, 12, 3);
    ctx.fill();
  }

  /**
   * 9. 3D Retro GP F1 Racer (Cigar body, open wheels, wishbone suspension)
   */
  private static drawOldF13D(ctx: CanvasRenderingContext2D) {
    // 4 Exposed Open Wheels
    PixelArtVehicles.draw3DWheel(ctx, -23, -24, 6, 14);
    PixelArtVehicles.draw3DWheel(ctx, 17, -24, 6, 14);
    PixelArtVehicles.draw3DWheel(ctx, -23, 10, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 16, 10, 7, 16);

    // Chrome Wishbone Suspension Rods
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-17, -17);
    ctx.lineTo(-7, -17);
    ctx.moveTo(17, -17);
    ctx.lineTo(7, -17);
    ctx.moveTo(-17, 18);
    ctx.lineTo(-7, 18);
    ctx.moveTo(17, 18);
    ctx.lineTo(7, 18);
    ctx.stroke();

    // Slim Aerodynamic Cigar Fuselage
    const bodyGrad = ctx.createLinearGradient(-9, 0, 9, 0);
    bodyGrad.addColorStop(0, '#0369a1');
    bodyGrad.addColorStop(0.3, '#0ea5e9');
    bodyGrad.addColorStop(0.5, '#bae6fd');
    bodyGrad.addColorStop(0.7, '#0ea5e9');
    bodyGrad.addColorStop(1, '#0369a1');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -9, -32, 18, 64, 6);
    ctx.fill();

    // Yellow Nosecone
    ctx.fillStyle = '#facc15';
    drawSafeRoundRect(ctx, -8, -34, 16, 7, 3);
    ctx.fill();

    // Open Cockpit & Driver Helmet
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // White Driver Helmet with Visor
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-2, -2, 4, 1.5);

    // Downforce Rear Wing
    ctx.fillStyle = '#0284c7';
    drawSafeRoundRect(ctx, -15, 26, 30, 5, 2);
    ctx.fill();
  }

  /**
   * 10. 3D Dark-M Stealth Hypercar (Matte black composite, crimson aero)
   */
  private static drawDarkM3D(ctx: CanvasRenderingContext2D) {
    PixelArtVehicles.draw3DWheel(ctx, -22, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, 15, -26, 7, 16);
    PixelArtVehicles.draw3DWheel(ctx, -22, 10, 7, 17);
    PixelArtVehicles.draw3DWheel(ctx, 15, 10, 7, 17);

    // Matte Stealth Black Body
    const bodyGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    bodyGrad.addColorStop(0, '#090d16');
    bodyGrad.addColorStop(0.3, '#1e1b2e');
    bodyGrad.addColorStop(0.5, '#3730a3');
    bodyGrad.addColorStop(0.7, '#1e1b2e');
    bodyGrad.addColorStop(1, '#090d16');

    ctx.fillStyle = bodyGrad;
    drawSafeRoundRect(ctx, -16, -32, 32, 64, 8);
    ctx.fill();

    // Crimson Carbon Aero Blades
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-15, -24, 2, 48);
    ctx.fillRect(13, -24, 2, 48);

    // Angular Stealth Cockpit
    ctx.fillStyle = '#020617';
    drawSafeRoundRect(ctx, -12, -14, 24, 22, 4);
    ctx.fill();

    // Glowing Neon Crimson Taillight Bar
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 10;
    ctx.fillRect(-14, 30, 28, 2.5);
    ctx.shadowBlur = 0;
  }

  /**
   * 11. 3D Quantum Plasma Jet Rocket Car (Delta winglets, plasma thrusters)
   */
  private static drawRocket3D(ctx: CanvasRenderingContext2D) {
    // Supersonic Aerospace Fuselage
    const bodyGrad = ctx.createLinearGradient(-14, 0, 14, 0);
    bodyGrad.addColorStop(0, '#4c1d95');
    bodyGrad.addColorStop(0.3, '#8354fe');
    bodyGrad.addColorStop(0.5, '#c084fc');
    bodyGrad.addColorStop(0.7, '#8354fe');
    bodyGrad.addColorStop(1, '#4c1d95');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.lineTo(15, -10);
    ctx.lineTo(15, 20);
    ctx.lineTo(20, 30);
    ctx.lineTo(-20, 30);
    ctx.lineTo(-15, 20);
    ctx.lineTo(-15, -10);
    ctx.closePath();
    ctx.fill();

    // Glowing Cyan Plasma Cockpit
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(0, -4, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dual Rocket Thruster Nozzles
    ctx.fillStyle = '#1e1b4b';
    drawSafeRoundRect(ctx, -13, 28, 8, 6, 2);
    drawSafeRoundRect(ctx, 5, 28, 8, 6, 2);
    ctx.fill();

    // Animated Glowing Plasma Exhaust Flames
    const flameFlicker = Math.sin(Date.now() * 0.05) * 4;
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(-12, 34);
    ctx.lineTo(-9, 44 + flameFlicker);
    ctx.lineTo(-6, 34);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(6, 34);
    ctx.lineTo(9, 44 + flameFlicker);
    ctx.lineTo(12, 34);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
