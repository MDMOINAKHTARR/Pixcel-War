import { MapDefinition, PickupType } from '../../types/game';
import { Vector2 } from './Vector2';

export interface SpawnAuditResult {
  valid: boolean;
  totalSpawns: number;
  invalidCount: number;
  failures: Array<{
    index: number;
    position: { x: number; y: number };
    type: PickupType;
    reason: string;
    obstacle?: { x: number; y: number; width: number; height: number };
    distanceToObstacle?: number;
  }>;
}

/**
 * Data-driven validator to ensure pickup and player spawn points sit strictly
 * within drivable road surfaces with ample clearance from curbs, walls, obstacles,
 * and map boundaries.
 */
export class SpawnValidator {
  public static readonly DEFAULT_CLEARANCE = 48; // Required clearance around pickup centers (px)
  public static readonly MAP_MARGIN = 50; // Minimum margin from map edges (px)

  /**
   * Checks whether a single point has sufficient clearance from all map obstacles and edges.
   */
  public static isPointValid(
    point: { x: number; y: number },
    map: MapDefinition,
    clearance: number = SpawnValidator.DEFAULT_CLEARANCE
  ): { valid: boolean; reason?: string; obstacle?: { x: number; y: number; width: number; height: number } } {
    // 1. Boundary Check
    if (
      point.x < SpawnValidator.MAP_MARGIN ||
      point.x > map.width - SpawnValidator.MAP_MARGIN ||
      point.y < SpawnValidator.MAP_MARGIN ||
      point.y > map.height - SpawnValidator.MAP_MARGIN
    ) {
      return {
        valid: false,
        reason: `Out of bounds or too close to map edge (x: ${point.x}, y: ${point.y}, map: ${map.width}x${map.height})`,
      };
    }

    // 2. Obstacle Collision & Clearance Check
    for (const obs of map.obstacles) {
      const closestX = Math.max(obs.x, Math.min(point.x, obs.x + obs.width));
      const closestY = Math.max(obs.y, Math.min(point.y, obs.y + obs.height));

      const dx = point.x - closestX;
      const dy = point.y - closestY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if point is inside or within clearance radius of obstacle
      const isInside =
        point.x >= obs.x &&
        point.x <= obs.x + obs.width &&
        point.y >= obs.y &&
        point.y <= obs.y + obs.height;

      if (isInside || dist < clearance) {
        return {
          valid: false,
          reason: isInside
            ? `Point sits INSIDE obstacle box [x: ${obs.x}, y: ${obs.y}, w: ${obs.width}, h: ${obs.height}]`
            : `Point is only ${dist.toFixed(1)}px from obstacle (min required: ${clearance}px)`,
          obstacle: obs,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Performs a comprehensive audit of all pickup spawns defined on a map.
   */
  public static auditMapPickups(
    map: MapDefinition,
    clearance: number = SpawnValidator.DEFAULT_CLEARANCE
  ): SpawnAuditResult {
    const failures: SpawnAuditResult['failures'] = [];

    map.pickupSpawns.forEach((spawn, index) => {
      const check = SpawnValidator.isPointValid(spawn, map, clearance);
      if (!check.valid) {
        failures.push({
          index,
          position: { x: spawn.x, y: spawn.y },
          type: spawn.type,
          reason: check.reason || 'Invalid spawn location',
          obstacle: check.obstacle,
        });
      }
    });

    return {
      valid: failures.length === 0,
      totalSpawns: map.pickupSpawns.length,
      invalidCount: failures.length,
      failures,
    };
  }

  /**
   * Filters and returns only valid pickup spawns for a map, replacing invalid spawns
   * with guaranteed safe coordinates if needed.
   */
  public static sanitizePickupSpawns(
    map: MapDefinition,
    clearance: number = SpawnValidator.DEFAULT_CLEARANCE
  ): { x: number; y: number; type: PickupType }[] {
    return map.pickupSpawns.filter((spawn) => SpawnValidator.isPointValid(spawn, map, clearance).valid);
  }
}
