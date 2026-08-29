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
    name: 'Red Lightning',
    category: 'Sports',
    speed: 95,
    accel: 90,
    armor: 65,
    drift: 85,
    unlocked: true,
    price: 0,
    tokenPrice: 0,
  },
  police: {
    id: 'police',
    name: 'Police Interceptor',
    category: 'Patrol',
    speed: 92,
    accel: 88,
    armor: 85,
    drift: 78,
    unlocked: true,
    price: 300,
    tokenPrice: 20,
  },
  surf: {
    id: 'surf',
    name: 'Surf Woody Wagon',
    category: 'Classic',
    speed: 84,
    accel: 80,
    armor: 80,
    drift: 92,
    unlocked: true,
    price: 450,
    tokenPrice: 30,
  },
  pickup: {
    id: 'pickup',
    name: 'Classic Pickup',
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
    name: 'Green Roadster',
    category: 'Vintage',
    speed: 90,
    accel: 86,
    armor: 70,
    drift: 90,
    unlocked: true,
    price: 500,
    tokenPrice: 35,
  },
  santa: {
    id: 'santa',
    name: 'Santa Sleigh Truck',
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
    name: 'Agro Harvester',
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
    name: 'Camo Bigfoot',
    category: 'Monster',
    speed: 80,
    accel: 75,
    armor: 98,
    drift: 70,
    unlocked: false,
    price: 850,
    tokenPrice: 60,
  },
  old_f1: {
    id: 'old_f1',
    name: 'Retro GP Racer',
    category: 'Formula',
    speed: 100,
    accel: 98,
    armor: 55,
    drift: 95,
    unlocked: false,
    price: 1000,
    tokenPrice: 75,
  },
  dark_m: {
    id: 'dark_m',
    name: 'Dark-M Stealth',
    category: 'Supercar',
    speed: 96,
    accel: 94,
    armor: 75,
    drift: 88,
    unlocked: false,
    price: 1200,
    tokenPrice: 85,
  },
  rocket: {
    id: 'rocket',
    name: 'Quantum Rocket',
    category: 'Monad Prototype',
    speed: 100,
    accel: 100,
    armor: 70,
    drift: 96,
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
  r: number = 4
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
 * Pixel-Art Vehicle Renderer
 * Draws crisp, stylized top-down pixel art vehicles directly to 2D canvas context
 */
export class PixelArtVehicles {
  /**
   * Draw pixel vehicle centered at (0,0)
   * Size approximately 32x56 pixels (scaled by scale factor)
   */
  static drawVehicle(
    ctx: CanvasRenderingContext2D,
    skinId: VehicleSkinId,
    scale: number = 1.0,
    customColor?: string
  ) {
    ctx.save();
    ctx.scale(scale, scale);

    // Disable image smoothing for sharp pixel art look
    ctx.imageSmoothingEnabled = false;

    // 1. Cast Drop Shadow (Offset down-right)
    ctx.fillStyle = 'rgba(15, 12, 28, 0.45)';
    drawSafeRoundRect(ctx, -14, -22, 32, 54, 8);
    ctx.fill();

    if (skinId === 'locked') {
      // Dark silhouette
      ctx.fillStyle = '#181329';
      drawSafeRoundRect(ctx, -16, -26, 32, 52, 6);
      ctx.fill();
      ctx.restore();
      return;
    }

    switch (skinId) {
      case 'red':
        PixelArtVehicles.drawRedLightning(ctx, customColor);
        break;
      case 'police':
        PixelArtVehicles.drawPolice(ctx);
        break;
      case 'surf':
        PixelArtVehicles.drawSurf(ctx);
        break;
      case 'pickup':
        PixelArtVehicles.drawPickup(ctx);
        break;
      case 'roadster':
        PixelArtVehicles.drawRoadster(ctx);
        break;
      case 'santa':
        PixelArtVehicles.drawSanta(ctx);
        break;
      case 'harvester':
        PixelArtVehicles.drawHarvester(ctx);
        break;
      case 'bigfoot':
        PixelArtVehicles.drawBigfoot(ctx);
        break;
      case 'old_f1':
        PixelArtVehicles.drawOldF1(ctx);
        break;
      case 'dark_m':
        PixelArtVehicles.drawDarkM(ctx);
        break;
      case 'rocket':
        PixelArtVehicles.drawRocket(ctx);
        break;
      default:
        PixelArtVehicles.drawRedLightning(ctx, customColor);
        break;
    }

    ctx.restore();
  }

  /**
   * 1. Red Lightning (Sports racer with dual white stripes)
   */
  private static drawRedLightning(ctx: CanvasRenderingContext2D, bodyColor: string = '#f4224b') {
    // 4 Wheels
    ctx.fillStyle = '#1c1924';
    ctx.fillRect(-16, -20, 5, 12);
    ctx.fillRect(11, -20, 5, 12);
    ctx.fillRect(-16, 8, 5, 12);
    ctx.fillRect(11, 8, 5, 12);

    // Chassis Base
    ctx.fillStyle = bodyColor;
    drawSafeRoundRect(ctx, -13, -26, 26, 52, 6);
    ctx.fill();

    // Dual White Racing Stripes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -26, 4, 52);
    ctx.fillRect(2, -26, 4, 52);

    // Windshield (dark purple with bright glare line)
    ctx.fillStyle = '#2f2142';
    drawSafeRoundRect(ctx, -11, -12, 22, 10, 3);
    ctx.fill();

    // Glare
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(-8, -10, 4, 6);

    // Rear Window
    ctx.fillStyle = '#2f2142';
    drawSafeRoundRect(ctx, -10, 10, 20, 7, 2);
    ctx.fill();

    // Headlights
    ctx.fillStyle = '#fff4a3';
    ctx.fillRect(-11, -26, 4, 3);
    ctx.fillRect(7, -26, 4, 3);

    // Taillights
    ctx.fillStyle = '#ff1133';
    ctx.fillRect(-11, 24, 4, 2);
    ctx.fillRect(7, 24, 4, 2);
  }

  /**
   * 2. Police Interceptor (Navy blue / White roof / Red & Blue siren lightbar)
   */
  private static drawPolice(ctx: CanvasRenderingContext2D) {
    // Wheels
    ctx.fillStyle = '#1c1924';
    ctx.fillRect(-16, -20, 5, 12);
    ctx.fillRect(11, -20, 5, 12);
    ctx.fillRect(-16, 8, 5, 12);
    ctx.fillRect(11, 8, 5, 12);

    // Dark Navy Body
    ctx.fillStyle = '#272d42';
    drawSafeRoundRect(ctx, -13, -26, 26, 52, 5);
    ctx.fill();

    // White Roof Section
    ctx.fillStyle = '#e8ecf4';
    drawSafeRoundRect(ctx, -11, -14, 22, 26, 4);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#1e2230';
    ctx.fillRect(-10, -13, 20, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7, -11, 3, 3);

    // Police Siren Lightbar (Animated Red & Blue)
    const isRedActive = Math.floor(Date.now() / 150) % 2 === 0;
    ctx.fillStyle = isRedActive ? '#ff2a4b' : '#7f1d1d';
    ctx.fillRect(-7, -4, 6, 4);

    ctx.fillStyle = !isRedActive ? '#00e5ff' : '#00557f';
    ctx.fillRect(1, -4, 6, 4);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -4, 2, 4);

    // Headlights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-11, -26, 4, 3);
    ctx.fillRect(7, -26, 4, 3);
  }

  /**
   * 3. Surf Woody Wagon (Yellow body, wood trim, surfboards on roof)
   */
  private static drawSurf(ctx: CanvasRenderingContext2D) {
    // Wheels
    ctx.fillStyle = '#1c1924';
    ctx.fillRect(-16, -20, 5, 12);
    ctx.fillRect(11, -20, 5, 12);
    ctx.fillRect(-16, 8, 5, 12);
    ctx.fillRect(11, 8, 5, 12);

    // Yellow / Orange Body
    ctx.fillStyle = '#f59e0b';
    drawSafeRoundRect(ctx, -13, -26, 26, 52, 5);
    ctx.fill();

    // Wood Trim Side Panels
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-13, -16, 2, 36);
    ctx.fillRect(11, -16, 2, 36);

    // Teal Roof
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(-10, -14, 20, 32);

    // Windshield
    ctx.fillStyle = '#164e63';
    ctx.fillRect(-9, -13, 18, 6);

    // Surfboards on Roof (Green and Red stripes)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-4, 2, 3, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-5, 0, 3, 6);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(4, 2, 3, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(3, 0, 3, 6);
  }

  /**
   * 4. Classic Tan Pickup (Tan chassis, open rear bed)
   */
  private static drawPickup(ctx: CanvasRenderingContext2D) {
    // Wheels
    ctx.fillStyle = '#1c1924';
    ctx.fillRect(-16, -20, 5, 12);
    ctx.fillRect(11, -20, 5, 12);
    ctx.fillRect(-16, 8, 5, 12);
    ctx.fillRect(11, 8, 5, 12);

    // Tan Chassis
    ctx.fillStyle = '#d97706';
    drawSafeRoundRect(ctx, -13, -26, 26, 52, 5);
    ctx.fill();

    // Cabin Roof
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-11, -16, 22, 16);

    // Windshield
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-10, -15, 20, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7, -13, 4, 2);

    // Open Truck Bed (Dark gray recessed)
    ctx.fillStyle = '#334155';
    ctx.fillRect(-10, 4, 20, 18);
  }

  /**
   * 5. Green Roadster (British racing green with tan interior)
   */
  private static drawRoadster(ctx: CanvasRenderingContext2D) {
    // Wheels
    ctx.fillStyle = '#1c1924';
    ctx.fillRect(-15, -20, 5, 12);
    ctx.fillRect(10, -20, 5, 12);
    ctx.fillRect(-15, 8, 5, 12);
    ctx.fillRect(10, 8, 5, 12);

    // Racing Green Body
    ctx.fillStyle = '#15803d';
    drawSafeRoundRect(ctx, -12, -26, 24, 52, 8);
    ctx.fill();

    // Hood louvers
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-4, -20, 8, 12);

    // Curved Windshield
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-9, -6, 18, 4);

    // Tan Leather Open Cockpit
    ctx.fillStyle = '#b45309';
    drawSafeRoundRect(ctx, -8, 0, 16, 16, 4);
    ctx.fill();

    // Steering wheel
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 3, 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 6. Santa Truck (Red holiday pickup with Santa decal on bed)
   */
  private static drawSanta(ctx: CanvasRenderingContext2D) {
    // Wheels
    ctx.fillStyle = '#1c1924';
    ctx.fillRect(-16, -20, 5, 12);
    ctx.fillRect(11, -20, 5, 12);
    ctx.fillRect(-16, 8, 5, 12);
    ctx.fillRect(11, 8, 5, 12);

    // Crimson Red Body
    ctx.fillStyle = '#dc2626';
    drawSafeRoundRect(ctx, -13, -26, 26, 52, 5);
    ctx.fill();

    // Cabin
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-11, -16, 22, 16);

    // Windshield
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-10, -15, 20, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -13, 3, 2);

    // Dark Bed
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, 4, 20, 18);

    // Santa Face Badge Decal
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 13, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fecaca';
    ctx.beginPath();
    ctx.arc(0, 11, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3, 7, 6, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 6, 2, 2);
  }

  /**
   * 7. Agro Harvester (Green heavy combine)
   */
  private static drawHarvester(ctx: CanvasRenderingContext2D) {
    // Big Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-18, -14, 6, 14);
    ctx.fillRect(12, -14, 6, 14);
    ctx.fillRect(-16, 10, 5, 12);
    ctx.fillRect(11, 10, 5, 12);

    // Front Cutter Header
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-18, -28, 36, 8);
    ctx.fillStyle = '#14532d';
    for (let i = -16; i <= 14; i += 4) {
      ctx.fillRect(i, -30, 2, 3);
    }

    // Heavy Body
    ctx.fillStyle = '#22c55e';
    drawSafeRoundRect(ctx, -12, -20, 24, 44, 4);
    ctx.fill();

    // Large Glass Cabin
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(-9, -16, 18, 10);
  }

  /**
   * 8. Camo Bigfoot (Monster truck with camouflage and huge tires)
   */
  private static drawBigfoot(ctx: CanvasRenderingContext2D) {
    // 4 Massive Monster Wheels with Treads
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-19, -24, 8, 18);
    ctx.fillRect(11, -24, 8, 18);
    ctx.fillRect(-19, 6, 8, 18);
    ctx.fillRect(11, 6, 8, 18);

    // Body with Camo Stripes
    ctx.fillStyle = '#4d7c0f';
    drawSafeRoundRect(ctx, -12, -22, 24, 44, 4);
    ctx.fill();

    // Camo blotches
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, -18, 6, 8);
    ctx.fillRect(2, -6, 8, 10);
    ctx.fillRect(-10, 6, 7, 8);

    // Tinted Cabin
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-9, -12, 18, 10);
  }

  /**
   * 9. Retro F1 Racer (Open-wheel vintage cigar racer)
   */
  private static drawOldF1(ctx: CanvasRenderingContext2D) {
    // 4 Exposed Wheels with Suspension Arms
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-18, -18, 5, 10);
    ctx.fillRect(13, -18, 5, 10);
    ctx.fillRect(-18, 10, 5, 12);
    ctx.fillRect(13, 10, 5, 12);

    // Suspension Rods
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-13, -13);
    ctx.lineTo(-6, -13);
    ctx.moveTo(13, -13);
    ctx.lineTo(6, -13);
    ctx.stroke();

    // Slim Cigar Body
    ctx.fillStyle = '#0ea5e9';
    drawSafeRoundRect(ctx, -7, -26, 14, 52, 5);
    ctx.fill();

    // Yellow Nosecone
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-6, -26, 12, 6);

    // Open Cockpit
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Driver Helmet (White)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Rear Spoiler Wing
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-12, 22, 24, 4);
  }

  /**
   * 10. Dark-M Supercar (Stealth matte black with red accents)
   */
  private static drawDarkM(ctx: CanvasRenderingContext2D) {
    // Wheels
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-16, -20, 5, 12);
    ctx.fillRect(11, -20, 5, 12);
    ctx.fillRect(-16, 8, 5, 12);
    ctx.fillRect(11, 8, 5, 12);

    // Matte Black Body
    ctx.fillStyle = '#1e1b2e';
    drawSafeRoundRect(ctx, -13, -26, 26, 52, 6);
    ctx.fill();

    // Red Racing Accents
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-11, -20, 2, 40);
    ctx.fillRect(9, -20, 2, 40);

    // Cockpit
    ctx.fillStyle = '#090614';
    drawSafeRoundRect(ctx, -10, -12, 20, 18, 3);
    ctx.fill();

    // Red Glowing Taillight Bar
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff0055';
    ctx.fillRect(-10, 24, 20, 2);
    ctx.shadowBlur = 0;
  }

  /**
   * 11. Quantum Rocket (Monad purple futuristic rocket racer)
   */
  private static drawRocket(ctx: CanvasRenderingContext2D) {
    // Futuristic aerodynamic fuselage
    ctx.fillStyle = '#8354fe';
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(12, -8);
    ctx.lineTo(12, 18);
    ctx.lineTo(16, 26);
    ctx.lineTo(-16, 26);
    ctx.lineTo(-12, 18);
    ctx.lineTo(-12, -8);
    ctx.closePath();
    ctx.fill();

    // Cyan Cockpit
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.ellipse(0, -4, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dual Rocket Thrusters
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(-10, 24, 6, 4);
    ctx.fillRect(4, 24, 6, 4);

    // Thruster Plasma Glow
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f0ff';
    ctx.fillRect(-9, 27, 4, 3);
    ctx.fillRect(5, 27, 4, 3);
    ctx.shadowBlur = 0;
  }
}
