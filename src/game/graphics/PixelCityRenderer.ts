import { MapDefinition } from '../../types/game';
import { drawSafeRoundRect } from './PixelArtVehicles';

/**
 * PixelCityRenderer
 * High-Density Pixel-Art City District Renderer matching the reference district art:
 * - Worn dark slate asphalt with painted white dashed lane dividers and intersection zebra crosswalks
 * - Curbed light concrete sidewalks bordering every city block (curb collision aligns with MapData)
 * - Central Symmetric Park with manicured green lawns, 6 round trees, 4 benches, and oval stone fountain
 * - Outdoor Cafe Patio with umbrella tables and wooden armchairs
 * - East Parking Lot with diagonal painted stall lines and parked vehicles
 * - Detailed building architectures with varied rooftops: Modern office with AC units & solar panels,
 *   striped awning shopfronts, red-brick apartments, sloped tile roofs, glass highrises, and convenience stores with billboard signs
 * - Street furniture: Dual-headed street lamp posts with cast shadows, trash bins, fire hydrants,
 *   and consistent pavement wear/crack patches.
 */
export class PixelCityRenderer {
  public static renderCityTrack(ctx: CanvasRenderingContext2D, map: MapDefinition) {
    ctx.save();

    // 1. Dark Worn Asphalt Base
    ctx.fillStyle = '#23252d';
    ctx.fillRect(0, 0, map.width, map.height);

    // 2. Weathered Asphalt Texture & Consistent Wear/Crack/Skid Patches across all corridors
    PixelCityRenderer.renderAsphaltWear(ctx, map.width, map.height);

    // 3. Painted Lane Markings & Intersection Zebra Crosswalks
    PixelCityRenderer.renderRoadMarkings(ctx, map);

    // 4. Sidewalks, City Blocks & Courtyards
    PixelCityRenderer.renderCityBlocksAndSidewalks(ctx);

    // 5. Central Fountain Park Block (Exact Reference Recreation)
    PixelCityRenderer.renderCentralPark(ctx, 1180, 720, 440, 560);

    // 6. Outdoor Cafe Patio with Tables & Chairs (Mid-Left Block)
    PixelCityRenderer.renderCafePatio(ctx, 420, 680);

    // 7. East Parking Lot with Stalls & Parked Vehicles (Mid-Right Block)
    PixelCityRenderer.renderParkingLot(ctx, 2050, 800);

    // 8. Custom Pixel-Art Buildings with Rooftop Variations
    PixelCityRenderer.renderReferenceBuildings(ctx);

    // 9. Street Furniture (Lamp Posts, Trash Bins, Benches)
    PixelCityRenderer.renderStreetFurniture(ctx);

    ctx.restore();
  }

  /**
   * 1. Asphalt Wear, Pavement Cracks & Consistent Repair Patches across roads
   */
  private static renderAsphaltWear(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    // Darker Weathered Asphalt Patches & Tar Repairs
    ctx.fillStyle = '#1c1e25';
    const wearSpots = [
      // North Avenue Corridor (Y: 200)
      { x: 300, y: 190, w: 110, h: 50 },
      { x: 750, y: 210, w: 140, h: 45 },
      { x: 1400, y: 180, w: 160, h: 55 },
      { x: 2050, y: 215, w: 130, h: 45 },
      { x: 2500, y: 195, w: 120, h: 50 },
      // South Avenue Corridor (Y: 1820)
      { x: 350, y: 1810, w: 130, h: 50 },
      { x: 850, y: 1830, w: 150, h: 45 },
      { x: 1400, y: 1810, w: 170, h: 55 },
      { x: 1950, y: 1830, w: 140, h: 50 },
      { x: 2450, y: 1815, w: 120, h: 45 },
      // West Avenue Corridor (X: 110)
      { x: 110, y: 550, w: 60, h: 120 },
      { x: 105, y: 1050, w: 70, h: 140 },
      { x: 115, y: 1550, w: 65, h: 110 },
      // East Avenue Corridor (X: 2690)
      { x: 2690, y: 550, w: 65, h: 120 },
      { x: 2695, y: 1050, w: 70, h: 140 },
      { x: 2685, y: 1550, w: 65, h: 110 },
      // Vertical Center Corridors (X: 1080 & X: 1720)
      { x: 1080, y: 510, w: 55, h: 80 },
      { x: 1080, y: 1500, w: 60, h: 90 },
      { x: 1720, y: 510, w: 55, h: 80 },
      { x: 1720, y: 1500, w: 60, h: 90 },
    ];

    for (const spot of wearSpots) {
      ctx.beginPath();
      ctx.ellipse(spot.x, spot.y, spot.w * 0.5, spot.h * 0.5, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Faint Asphalt Crack Lines
    ctx.strokeStyle = '#14151a';
    ctx.lineWidth = 1.5;
    const crackLines = [
      { x1: 720, y1: 180, x2: 760, y2: 230 },
      { x1: 2020, y1: 170, x2: 2070, y2: 220 },
      { x1: 820, y1: 1800, x2: 860, y2: 1850 },
      { x1: 1980, y1: 1790, x2: 2030, y2: 1840 },
      { x1: 100, y1: 980, x2: 130, y2: 1030 },
      { x1: 2670, y1: 980, x2: 2710, y2: 1030 },
    ];
    for (const cl of crackLines) {
      ctx.beginPath();
      ctx.moveTo(cl.x1, cl.y1);
      ctx.lineTo((cl.x1 + cl.x2) * 0.5 + 4, (cl.y1 + cl.y2) * 0.5 - 3);
      ctx.lineTo(cl.x2, cl.y2);
      ctx.stroke();
    }

    // Subtle Road Gravel Texture Grain
    ctx.fillStyle = '#14151a';
    for (let x = 80; x < w; x += 260) {
      for (let y = 80; y < h; y += 260) {
        ctx.fillRect(x + (y % 25), y + (x % 35), 10, 5);
        ctx.fillRect(x + 35, y + 15, 6, 3);
      }
    }

    ctx.restore();
  }

  /**
   * 2. Painted Road Markings: Dashed Center Dividers & Zebra Crosswalks
   */
  private static renderRoadMarkings(ctx: CanvasRenderingContext2D, map: MapDefinition) {
    ctx.save();

    // White Dashed Center Lane Dividers
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.setLineDash([22, 18]);

    // North Main Avenue (Y: 200, X: 110 -> 2690)
    ctx.beginPath();
    ctx.moveTo(110, 200);
    ctx.lineTo(2690, 200);
    ctx.stroke();

    // South Avenue (Y: 1820, X: 110 -> 2690)
    ctx.beginPath();
    ctx.moveTo(110, 1820);
    ctx.lineTo(2690, 1820);
    ctx.stroke();

    // West Avenue (X: 110, Y: 200 -> 1820)
    ctx.beginPath();
    ctx.moveTo(110, 200);
    ctx.lineTo(110, 1820);
    ctx.stroke();

    // East Avenue (X: 2690, Y: 200 -> 1820)
    ctx.beginPath();
    ctx.moveTo(2690, 200);
    ctx.lineTo(2690, 1820);
    ctx.stroke();

    // Center Vertical Thoroughfares (X: 1080 & X: 1720)
    ctx.beginPath();
    ctx.moveTo(1080, 200);
    ctx.lineTo(1080, 1820);
    ctx.moveTo(1720, 200);
    ctx.lineTo(1720, 1820);
    ctx.stroke();

    ctx.setLineDash([]);

    // Intersection Zebra Crosswalks
    const crosswalks = [
      // North Avenue Crosswalks
      { x: 1080, y: 200, vertical: true },
      { x: 1720, y: 200, vertical: true },
      { x: 2690, y: 200, vertical: true },
      { x: 110, y: 200, vertical: true },
      // Mid Thoroughfare Crosswalks
      { x: 1080, y: 650, vertical: false },
      { x: 1720, y: 650, vertical: false },
      { x: 1080, y: 1330, vertical: false },
      { x: 1720, y: 1330, vertical: false },
      // South Avenue Crosswalks
      { x: 1080, y: 1820, vertical: true },
      { x: 1720, y: 1820, vertical: true },
      { x: 2690, y: 1820, vertical: true },
      { x: 110, y: 1820, vertical: true },
    ];

    for (const cw of crosswalks) {
      PixelCityRenderer.renderZebraCrosswalk(ctx, cw.x, cw.y, cw.vertical);
    }

    ctx.restore();
  }

  private static renderZebraCrosswalk(ctx: CanvasRenderingContext2D, x: number, y: number, isVertical: boolean) {
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    if (isVertical) {
      // Crosswalk across vertical road (horizontal stripes)
      for (let i = -40; i <= 40; i += 12) {
        ctx.fillRect(x - 28, y + i, 56, 7);
      }
    } else {
      // Crosswalk across horizontal road (vertical stripes)
      for (let i = -40; i <= 40; i += 12) {
        ctx.fillRect(x + i, y - 28, 7, 56);
      }
    }
    ctx.restore();
  }

  /**
   * 3. Sidewalks & City Block Basements (Curbs align with MapData obstacle collision)
   */
  private static renderCityBlocksAndSidewalks(ctx: CanvasRenderingContext2D) {
    ctx.save();

    const cityBlocks = [
      // Top-Left Block (Modern Office + Awning Shop)
      { x: 220, y: 400, w: 760, h: 220 },
      // Top-Mid Brick Apartment Block
      { x: 1180, y: 400, w: 440, h: 220 },
      // Top-Right Sloped Tile Roof Block
      { x: 1820, y: 400, w: 760, h: 220 },

      // Mid-Left Block (Cafe Patio + Shops)
      { x: 220, y: 700, w: 760, h: 600 },
      // Mid-Right Block (Parking Lot + Supermarket + Highrise)
      { x: 1820, y: 700, w: 760, h: 600 },

      // Bottom-Left Block (Parkette + Modern Office)
      { x: 220, y: 1380, w: 760, h: 240 },
      // Bottom-Mid Block (Pocket Park + Slate Office)
      { x: 1180, y: 1380, w: 440, h: 240 },
      // Bottom-Right Block (Commercial Shops)
      { x: 1820, y: 1380, w: 760, h: 240 },
    ];

    for (const b of cityBlocks) {
      // Concrete Sidewalk Border (Curbed Light Grey - Outer collision edge)
      ctx.fillStyle = '#9ca3af'; // Curb bevel
      drawSafeRoundRect(ctx, b.x - 14, b.y - 14, b.w + 28, b.h + 28, 8);
      ctx.fill();

      ctx.fillStyle = '#cbd5e1'; // Top sidewalk surface
      drawSafeRoundRect(ctx, b.x - 10, b.y - 10, b.w + 20, b.h + 20, 6);
      ctx.fill();

      // Sidewalk Concrete Tile Grid Lines
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      for (let tx = b.x; tx < b.x + b.w; tx += 40) {
        ctx.beginPath();
        ctx.moveTo(tx, b.y - 10);
        ctx.lineTo(tx, b.y + b.h + 10);
        ctx.stroke();
      }
      for (let ty = b.y; ty < b.y + b.h; ty += 40) {
        ctx.beginPath();
        ctx.moveTo(b.x - 10, ty);
        ctx.lineTo(b.x + b.w + 10, ty);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * 4. Central Symmetric Park Block (Exact Reference Recreation)
   */
  private static renderCentralPark(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();

    // Sidewalk Curbed Base (Outer wall matches MapData obstacle)
    ctx.fillStyle = '#9ca3af';
    drawSafeRoundRect(ctx, x - 14, y - 14, w + 28, h + 28, 10);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    drawSafeRoundRect(ctx, x - 10, y - 10, w + 20, h + 20, 8);
    ctx.fill();

    // Park Lawn Surface (Vibrant Green)
    ctx.fillStyle = '#65a30d';
    drawSafeRoundRect(ctx, x, y, w, h, 6);
    ctx.fill();

    // Symmetric Concrete Walking Paths
    ctx.fillStyle = '#e2e8f0';
    // Central Horizontal & Vertical Paths
    ctx.fillRect(x + w * 0.5 - 24, y, 48, h);
    ctx.fillRect(x, y + h * 0.5 - 24, w, 48);

    // Oval Center Plaza
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, 90, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // Central Stone Fountain Basin (Oval Pool with Blue Water & Ripples)
    const fX = x + w * 0.5;
    const fY = y + h * 0.5;

    // Fountain Outer Stone Rim
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.ellipse(fX, fY, 56, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(fX, fY, 52, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fountain Blue Pool Water
    const time = Date.now() * 0.003;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(fX, fY, 46, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Animated Water Ripples
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 1.5;
    for (let r = 8; r <= 32; r += 8) {
      const ripple = (r + (time * 15) % 8);
      ctx.beginPath();
      ctx.ellipse(fX, fY, ripple * 1.3, ripple * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center Spout
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fX, fY, 4, 0, Math.PI * 2);
    ctx.fill();

    // 6 Manicured Park Trees (3 Left, 3 Right)
    const treePositions = [
      { x: x + 65, y: y + 80 },
      { x: x + 65, y: y + h * 0.5 },
      { x: x + 65, y: y + h - 80 },
      { x: x + w - 65, y: y + 80 },
      { x: x + w - 65, y: y + h * 0.5 },
      { x: x + w - 65, y: y + h - 80 },
    ];
    for (const tp of treePositions) {
      PixelCityRenderer.renderPixelTree(ctx, tp.x, tp.y);
    }

    // 4 Wooden Park Benches (Facing Fountain)
    const benchPositions = [
      { x: x + 130, y: y + 120, rot: 0 },
      { x: x + 130, y: y + h - 120, rot: 0 },
      { x: x + w - 130, y: y + 120, rot: Math.PI },
      { x: x + w - 130, y: y + h - 120, rot: Math.PI },
    ];
    for (const bp of benchPositions) {
      PixelCityRenderer.renderParkBench(ctx, bp.x, bp.y, bp.rot);
    }

    ctx.restore();
  }

  /**
   * 5. Outdoor Cafe Patio with Umbrella Tables & Wooden Armchairs (Mid-Left Block)
   */
  private static renderCafePatio(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();

    // Patio Stone Paver Floor (Warm Terracotta Brick Pavers)
    ctx.fillStyle = '#d6d3d1';
    ctx.fillRect(x - 80, y - 80, 160, 160);

    // Patio Overhang Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x - 80, y + 74, 160, 10);

    // 2 Dining Table Sets
    const tables = [
      { x: x - 40, y: y - 20 },
      { x: x - 40, y: y + 40 },
    ];

    for (const t of tables) {
      // Umbrella Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(t.x + 4, t.y + 6, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4 Wooden Armchairs around table
      ctx.fillStyle = '#78350f'; // Dark wood
      ctx.fillRect(t.x - 22, t.y - 7, 10, 14); // Left chair
      ctx.fillRect(t.x + 12, t.y - 7, 10, 14); // Right chair
      ctx.fillRect(t.x - 7, t.y - 22, 14, 10); // Top chair
      ctx.fillRect(t.x - 7, t.y + 12, 14, 10); // Bottom chair

      // Seat Cushions (Burgundy Crimson)
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(t.x - 20, t.y - 5, 6, 10);
      ctx.fillRect(t.x + 14, t.y - 5, 6, 10);
      ctx.fillRect(t.x - 5, t.y - 20, 10, 6);
      ctx.fillRect(t.x - 5, t.y + 14, 10, 6);

      // Round Table
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // White Table Cloth
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Center Umbrella Pole & Tip
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * 6. East Parking Lot with Stalls & Parked Vehicles (Mid-Right Block)
   */
  private static renderParkingLot(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();

    // Asphalt Parking Pad
    ctx.fillStyle = '#334155';
    drawSafeRoundRect(ctx, x - 100, y - 80, 200, 240, 4);
    ctx.fill();

    // Painted White Parking Stall Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    for (let sy = y - 60; sy <= y + 120; sy += 36) {
      ctx.beginPath();
      ctx.moveTo(x - 90, sy);
      ctx.lineTo(x + 20, sy);
      ctx.stroke();
    }

    // Parked Red Coupe (in stall 1)
    PixelCityRenderer.renderStaticParkedCar(ctx, x - 40, y - 42, '#ef4444', 0);

    // Parked Tan Mini Truck (in stall 3)
    PixelCityRenderer.renderStaticParkedCar(ctx, x - 40, y + 30, '#d97706', 0);

    // Parked Silver Hatchback (in stall 5)
    PixelCityRenderer.renderStaticParkedCar(ctx, x - 40, y + 102, '#94a3b8', 0);

    ctx.restore();
  }

  private static renderStaticParkedCar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    rot: number
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-22, -11, 44, 22);

    // Body
    ctx.fillStyle = color;
    drawSafeRoundRect(ctx, -20, -10, 40, 20, 4);
    ctx.fill();

    // Roof & Glass
    ctx.fillStyle = '#0f172a';
    drawSafeRoundRect(ctx, -10, -8, 20, 16, 2);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.fillRect(-8, -6, 16, 12);

    ctx.restore();
  }

  /**
   * 7. Custom Pixel-Art Buildings with Rooftop Variations
   */
  private static renderReferenceBuildings(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Building 1: Modern Grey Concrete Office (Top-Left, Variant A: AC Units)
    PixelCityRenderer.renderModernOfficeBuilding(ctx, 320, 440, 240, 140, 'ac_units');

    // Building 2: Retro Shop with Striped Canvas Awning (Top-Mid-Left)
    PixelCityRenderer.renderStripedAwningShop(ctx, 640, 440, 240, 140);

    // Building 3: Red Brick Multi-Story Apartment (Top-Mid)
    PixelCityRenderer.renderBrickApartment(ctx, 1220, 440, 360, 140);

    // Building 4: Sloped Tile Roof Commercial Building (Top-Right)
    PixelCityRenderer.renderTileRoofBuilding(ctx, 1920, 440, 280, 140);

    // Building 5: Cafe & Bistro Shopfront (Mid-Left)
    PixelCityRenderer.renderCafeBuilding(ctx, 520, 750, 200, 120);

    // Building 6: Glass Commercial Highrise (Mid-Right)
    PixelCityRenderer.renderHighriseBuilding(ctx, 1900, 750, 120, 220);

    // Building 7: Supermarket with Large Rooftop Billboard Sign (Mid-Right Lower)
    PixelCityRenderer.renderBillboardSupermarket(ctx, 1900, 1080, 240, 140);

    // Building 8: Modern Apartment Block (Bottom-Left, Variant B: Solar Panels + Access Hatch)
    PixelCityRenderer.renderModernOfficeBuilding(ctx, 320, 1420, 240, 140, 'solar_panels');

    // Building 9: Slate Commercial Building (Bottom-Mid, Variant C: Heli-pad & Vent Tower)
    PixelCityRenderer.renderModernOfficeBuilding(ctx, 1220, 1420, 240, 140, 'helipad');

    ctx.restore();
  }

  /**
   * Reference Architecture: Modern Office Building with Rooftop Variations
   */
  private static renderModernOfficeBuilding(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    variant: 'ac_units' | 'solar_panels' | 'helipad' = 'ac_units'
  ) {
    ctx.save();
    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 8, y + 8, w, h);

    // Concrete Base Facade
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x, y, w, h);

    // Flat Roof Surface
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Roof Parapet Border
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);

    // Rooftop Variations for Visual Variety across repeated building footprint
    if (variant === 'ac_units') {
      // Dual AC Condenser Units & Vents
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 20, y + 20, 32, 24);
      ctx.fillRect(x + 70, y + 20, 24, 20);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x + 24, y + 24, 24, 4);
      ctx.fillRect(x + 24, y + 32, 24, 4);
    } else if (variant === 'solar_panels') {
      // 4 Photovoltaic Solar Panels
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1;
      for (let px = x + 16; px <= x + 88; px += 26) {
        ctx.fillRect(px, y + 16, 22, 28);
        ctx.strokeRect(px, y + 16, 22, 28);
      }
      // Roof Access Hatch
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + w - 40, y + 18, 20, 20);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + w - 38, y + 20, 16, 16);
    } else if (variant === 'helipad') {
      // Circular Landing Ring
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + 60, y + 30, 22, 0, Math.PI * 2);
      ctx.stroke();

      // "H" Marking
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', x + 60, y + 30);

      // Central Cooling Fan Tower
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 130, y + 16, 36, 28);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + 134, y + 20, 28, 20);
    }

    // Grid Windows (Front Facade)
    ctx.fillStyle = '#1e293b';
    for (let wx = x + 16; wx < x + w - 24; wx += 36) {
      for (let wy = y + 65; wy < y + h - 16; wy += 28) {
        ctx.fillRect(wx, wy, 24, 18);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(wx + 2, wy + 2, 20, 14);
        ctx.fillStyle = '#1e293b';
      }
    }

    ctx.restore();
  }

  /**
   * Reference Architecture: Shop with Striped Canvas Awning, Signboard & Deep Overhang Shadow
   */
  private static renderStripedAwningShop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 8, y + 8, w, h);

    // Tan Stucco Wall
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#fde68a';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Rooftop Skylight Window
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 30, y + 16, 40, 24);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 30, y + 16, 40, 24);

    // Orange & White Striped Canvas Awning along Front
    const awnY = y + h - 32;
    for (let ax = x + 10; ax < x + w - 10; ax += 18) {
      ctx.fillStyle = (Math.floor(ax / 18) % 2 === 0) ? '#ea580c' : '#f8fafc';
      ctx.fillRect(ax, awnY, 18, 26);
    }

    // Deep Ambient Shadow Under Awning for Rich Depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 10, awnY + 24, w - 20, 8);

    // Glass Display Storefront under Awning
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 20, awnY + 6, w - 40, 16);

    ctx.restore();
  }

  /**
   * Reference Architecture: Red Brick Apartment Block
   */
  private static renderBrickApartment(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 8, y + 8, w, h);

    // Terracotta Brick Wall
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x, y, w, h);

    // Sloped Dark Roof with Ridge Cap
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(x + 4, y + 4, w - 8, 36);

    // Chimney Vents & Roof Access Hatch
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(x + 30, y + 8, 14, 16);
    ctx.fillRect(x + w - 44, y + 8, 14, 16);

    // Brick Pattern Lines
    ctx.fillStyle = '#7f1d1d';
    for (let by = y + 44; by < y + h - 6; by += 8) {
      ctx.fillRect(x + 6, by, w - 12, 1.5);
    }

    // Double-Hung Sash Windows
    ctx.fillStyle = '#f8fafc';
    for (let wx = x + 24; wx < x + w - 24; wx += 44) {
      for (let wy = y + 48; wy < y + h - 16; wy += 32) {
        ctx.fillRect(wx, wy, 26, 22);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(wx + 2, wy + 2, 22, 18);
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(wx + 4, wy + 4, 18, 14);
        ctx.fillStyle = '#f8fafc';
      }
    }

    ctx.restore();
  }

  /**
   * Reference Architecture: Sloped Tile Roof Building
   */
  private static renderTileRoofBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 8, y + 8, w, h);

    // Sloped Clay Tile Roof Surface (Warm Tan / Beige)
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Horizontal Tile Grooves with Rich Shading
    ctx.fillStyle = '#b45309';
    for (let ty = y + 10; ty < y + h - 8; ty += 12) {
      ctx.fillRect(x + 4, ty, w - 8, 2);
    }

    // Rooftop Dormer Window
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + w * 0.5 - 18, y + 14, 36, 24);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + w * 0.5 - 14, y + 18, 28, 16);

    ctx.restore();
  }

  /**
   * Reference Architecture: Cafe & Bistro Building
   */
  private static renderCafeBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 8, y + 8, w, h);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Coffee Shop Neon Signboard
    ctx.fillStyle = '#db2777';
    ctx.fillRect(x + 20, y + 16, w - 40, 22);

    // Cast Shadow under Signboard
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x + 20, y + 38, w - 40, 6);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Press Start 2P", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☕ CAFE', x + w * 0.5, y + 31);

    ctx.restore();
  }

  /**
   * Reference Architecture: Glass Commercial Highrise
   */
  private static renderHighriseBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 8, y + 8, w, h);

    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, w, h);

    // Rooftop Antenna Mast with Beacon
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 0.5, y - 18);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y - 18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Reflective Tinted Glass Panels
    ctx.fillStyle = '#0ea5e9';
    for (let gy = y + 12; gy < y + h - 12; gy += 24) {
      ctx.fillRect(x + 8, gy, w - 16, 16);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 10, gy + 2, w - 20, 3);
      ctx.fillStyle = '#0ea5e9';
    }

    ctx.restore();
  }

  /**
   * Reference Architecture: Supermarket with Large Rooftop Billboard Sign & Overhang Depth
   */
  private static renderBillboardSupermarket(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 8, y + 8, w, h);

    ctx.fillStyle = '#0f766e';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#ccfbf1';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Large Rooftop Billboard Signboard with Japanese / Arcade Artwork
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 22, y - 20, w - 40, 36);

    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(x + 20, y - 24, w - 40, 36);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 20, y - 24, w - 40, 36);

    // Billboard Text & Graphic
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 8px "Press Start 2P", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MART 24H ★', x + w * 0.5, y - 6);

    ctx.restore();
  }

  /**
   * 8. Street Furniture: Dual-Head Lamp Posts, Trash Bins, Park Benches
   */
  private static renderStreetFurniture(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Dual-Head Street Lamp Posts at Major Block Corners (Sitting safely on sidewalks)
    const lampPosts = [
      { x: 206, y: 386 },
      { x: 994, y: 386 },
      { x: 1806, y: 386 },
      { x: 2594, y: 386 },
      { x: 206, y: 1634 },
      { x: 994, y: 1634 },
      { x: 1806, y: 1634 },
      { x: 2594, y: 1634 },
      { x: 1166, y: 706 },
      { x: 1634, y: 706 },
      { x: 1166, y: 1294 },
      { x: 1634, y: 1294 },
    ];

    for (const lp of lampPosts) {
      PixelCityRenderer.renderDualLampPost(ctx, lp.x, lp.y);
    }

    ctx.restore();
  }

  private static renderDualLampPost(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 3, y + 3, 14, 4);

    // Steel Pole Center Post
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 2, y - 16, 4, 18);

    // Dual Lamp Arms
    ctx.fillRect(x - 10, y - 18, 20, 3);

    // Glowing Yellow Lamp Lanterns
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 8;
    ctx.fillRect(x - 11, y - 15, 5, 4);
    ctx.fillRect(x + 6, y - 15, 5, 4);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  public static renderPixelTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    // Drop Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 8, 24, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 4, y + 2, 8, 12);

    // Rounded Fluffy Pixel-Art Foliage Canopies
    ctx.fillStyle = '#15803d'; // Dark outline
    ctx.beginPath();
    ctx.arc(x, y - 6, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e'; // Mid green
    ctx.beginPath();
    ctx.arc(x - 2, y - 8, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#86efac'; // Highlight crown
    ctx.beginPath();
    ctx.arc(x - 4, y - 12, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public static renderParkBench(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(-14, -6, 28, 12);

    // Wood Slats
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-12, -5, 24, 4);
    ctx.fillRect(-12, 1, 24, 4);

    // Iron Armrests
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-13, -6, 3, 12);
    ctx.fillRect(10, -6, 3, 12);

    ctx.restore();
  }
}
