import { Vector2 } from './Vector2';

export interface BoundingCircle {
  x: number;
  y: number;
  radius: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionResult {
  collided: boolean;
  normal: Vector2;
  depth: number;
  contactPoint: Vector2;
}

export class Collision {
  /**
   * Circle vs Circle Collision
   */
  static checkCircleCircle(c1: BoundingCircle, c2: BoundingCircle): CollisionResult {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const distSq = dx * dx + dy * dy;
    const radSum = c1.radius + c2.radius;

    if (distSq >= radSum * radSum || distSq === 0) {
      return {
        collided: false,
        normal: new Vector2(0, 0),
        depth: 0,
        contactPoint: new Vector2(0, 0),
      };
    }

    const dist = Math.sqrt(distSq);
    const depth = radSum - dist;
    const normal = new Vector2(dx / dist, dy / dist);
    const contactPoint = new Vector2(
      c1.x + normal.x * (c1.radius - depth * 0.5),
      c1.y + normal.y * (c1.radius - depth * 0.5)
    );

    return {
      collided: true,
      normal,
      depth,
      contactPoint,
    };
  }

  /**
   * Circle vs AABB (Axis-Aligned Bounding Box) Collision
   */
  static checkCircleAABB(circle: BoundingCircle, box: BoundingBox): CollisionResult {
    // Find closest point on box to circle center
    const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq > circle.radius * circle.radius) {
      return {
        collided: false,
        normal: new Vector2(0, 0),
        depth: 0,
        contactPoint: new Vector2(0, 0),
      };
    }

    let dist = Math.sqrt(distSq);
    let normal: Vector2;
    let depth: number;

    if (dist === 0) {
      // Circle center is inside the box: resolve towards nearest edge
      const leftDist = Math.abs(circle.x - box.x);
      const rightDist = Math.abs(box.x + box.width - circle.x);
      const topDist = Math.abs(circle.y - box.y);
      const bottomDist = Math.abs(box.y + box.height - circle.y);

      const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
      if (minDist === leftDist) {
        normal = new Vector2(-1, 0);
        depth = circle.radius + leftDist;
      } else if (minDist === rightDist) {
        normal = new Vector2(1, 0);
        depth = circle.radius + rightDist;
      } else if (minDist === topDist) {
        normal = new Vector2(0, -1);
        depth = circle.radius + topDist;
      } else {
        normal = new Vector2(0, 1);
        depth = circle.radius + bottomDist;
      }
    } else {
      normal = new Vector2(dx / dist, dy / dist);
      depth = circle.radius - dist;
    }

    return {
      collided: true,
      normal,
      depth,
      contactPoint: new Vector2(closestX, closestY),
    };
  }

  /**
   * Raycast vs AABB for AI sensing and line-of-sight
   */
  static raycastBox(
    rayOrigin: Vector2,
    rayDir: Vector2,
    maxDist: number,
    box: BoundingBox
  ): { hit: boolean; distance: number; point: Vector2 } {
    let tmin = 0;
    let tmax = maxDist;

    // X slab
    if (Math.abs(rayDir.x) < 0.00001) {
      if (rayOrigin.x < box.x || rayOrigin.x > box.x + box.width) {
        return { hit: false, distance: maxDist, point: new Vector2(0, 0) };
      }
    } else {
      const invD = 1.0 / rayDir.x;
      let t0 = (box.x - rayOrigin.x) * invD;
      let t1 = (box.x + box.width - rayOrigin.x) * invD;
      if (invD < 0) {
        const tmp = t0;
        t0 = t1;
        t1 = tmp;
      }
      tmin = Math.max(tmin, t0);
      tmax = Math.min(tmax, t1);
      if (tmax <= tmin) return { hit: false, distance: maxDist, point: new Vector2(0, 0) };
    }

    // Y slab
    if (Math.abs(rayDir.y) < 0.00001) {
      if (rayOrigin.y < box.y || rayOrigin.y > box.y + box.height) {
        return { hit: false, distance: maxDist, point: new Vector2(0, 0) };
      }
    } else {
      const invD = 1.0 / rayDir.y;
      let t0 = (box.y - rayOrigin.y) * invD;
      let t1 = (box.y + box.height - rayOrigin.y) * invD;
      if (invD < 0) {
        const tmp = t0;
        t0 = t1;
        t1 = tmp;
      }
      tmin = Math.max(tmin, t0);
      tmax = Math.min(tmax, t1);
      if (tmax <= tmin) return { hit: false, distance: maxDist, point: new Vector2(0, 0) };
    }

    const hitDist = tmin;
    if (hitDist > maxDist) return { hit: false, distance: maxDist, point: new Vector2(0, 0) };

    return {
      hit: true,
      distance: hitDist,
      point: new Vector2(rayOrigin.x + rayDir.x * hitDist, rayOrigin.y + rayDir.y * hitDist),
    };
  }

  static circleCircle(p1: Vector2, r1: number, p2: Vector2, r2: number): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const radSum = r1 + r2;
    return dx * dx + dy * dy < radSum * radSum;
  }

  static resolveElasticCollision(
    p1: Vector2,
    v1: Vector2,
    m1: number,
    p2: Vector2,
    v2: Vector2,
    m2: number
  ) {
    const normal = p2.clone().subtract(p1);
    const dist = normal.length();
    if (dist === 0) return;
    normal.normalize();

    // Separate positions
    const overlap = 40 - dist;
    if (overlap > 0) {
      p1.subtract(normal.clone().multiplyScalar(overlap * 0.5));
      p2.add(normal.clone().multiplyScalar(overlap * 0.5));
    }

    // Relative velocity
    const relVel = v1.clone().subtract(v2);
    const velAlongNormal = relVel.dot(normal);
    if (velAlongNormal > 0) return; // Moving away

    const restitution = 0.65;
    const impulseMag = (-(1 + restitution) * velAlongNormal) / (1 / m1 + 1 / m2);
    const impulse = normal.clone().multiplyScalar(impulseMag);

    v1.add(impulse.clone().multiplyScalar(1 / m1));
    v2.subtract(impulse.clone().multiplyScalar(1 / m2));
  }

  static resolveCircleBox(
    pos: Vector2,
    radius: number,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ): { collided: boolean; penetration: Vector2 } {
    const closestX = Math.max(bx, Math.min(pos.x, bx + bw));
    const closestY = Math.max(by, Math.min(pos.y, by + bh));
    const dx = pos.x - closestX;
    const dy = pos.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < radius * radius && distSq > 0) {
      const dist = Math.sqrt(distSq);
      const overlap = radius - dist;
      const normal = new Vector2(dx / dist, dy / dist);
      return {
        collided: true,
        penetration: normal.multiplyScalar(overlap),
      };
    }
    return {
      collided: false,
      penetration: new Vector2(0, 0),
    };
  }
}
