/**
 * Collision Detection System
 *
 * This example demonstrates various collision detection algorithms and physics
 * commonly used in web games, including AABB, circle, and polygon collision detection.
 *
 * Key Concepts:
 * - AABB (Axis-Aligned Bounding Box) collision
 * - Circle collision detection
 * - Spatial partitioning with quadtrees
 * - Collision response and physics
 * - Broad phase and narrow phase collision
 */

// ============== Types ==============

interface Vector2 {
  x: number;
  y: number;
}

interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Circle {
  x: number;
  y: number;
  radius: number;
}

interface CollisionInfo {
  colliding: boolean;
  penetration?: number;
  normal?: Vector2;
}

// ============== Collision Detection Algorithms ==============

class CollisionDetector {
  /**
   * AABB (Axis-Aligned Bounding Box) collision detection
   * Fast and simple, but only works for rectangles aligned to axes
   */
  static checkAABB(a: AABB, b: AABB): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Circle collision detection
   * Perfect for round objects like balls, coins, etc.
   */
  static checkCircle(a: Circle, b: Circle): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < a.radius + b.radius;
  }

  /**
   * Circle collision with detailed information
   * Returns collision info including penetration depth and normal
   */
  static checkCircleDetailed(a: Circle, b: Circle): CollisionInfo {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = a.radius + b.radius;

    if (distance < minDistance) {
      const penetration = minDistance - distance;
      const normal = {
        x: dx / distance,
        y: dy / distance,
      };

      return {
        colliding: true,
        penetration,
        normal,
      };
    }

    return { colliding: false };
  }

  /**
   * Circle vs AABB collision detection
   * Useful for checking circular objects against rectangular boundaries
   */
  static checkCircleAABB(circle: Circle, box: AABB): boolean {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

    // Calculate distance between circle's center and closest point
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distanceSquared = dx * dx + dy * dy;

    return distanceSquared < circle.radius * circle.radius;
  }

  /**
   * Point vs AABB collision
   * Useful for mouse clicks, projectiles, etc.
   */
  static checkPointAABB(point: Vector2, box: AABB): boolean {
    return (
      point.x >= box.x &&
      point.x <= box.x + box.width &&
      point.y >= box.y &&
      point.y <= box.y + box.height
    );
  }

  /**
   * Point vs Circle collision
   */
  static checkPointCircle(point: Vector2, circle: Circle): boolean {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    const distanceSquared = dx * dx + dy * dy;
    return distanceSquared < circle.radius * circle.radius;
  }

  /**
   * Line vs Circle collision (for raycasting, lasers, etc.)
   */
  static checkLineCircle(
    lineStart: Vector2,
    lineEnd: Vector2,
    circle: Circle
  ): boolean {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const fx = lineStart.x - circle.x;
    const fy = lineStart.y - circle.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - circle.radius * circle.radius;

    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return false;
    }

    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }
}

// ============== Quadtree for Spatial Partitioning ==============

/**
 * Quadtree for efficient broad-phase collision detection
 * Reduces collision checks from O(n²) to O(n log n)
 */
class QuadTree {
  private boundary: AABB;
  private capacity: number;
  private objects: any[] = [];
  private divided: boolean = false;
  private northeast?: QuadTree;
  private northwest?: QuadTree;
  private southeast?: QuadTree;
  private southwest?: QuadTree;

  constructor(boundary: AABB, capacity: number = 4) {
    this.boundary = boundary;
    this.capacity = capacity;
  }

  /**
   * Insert an object into the quadtree
   */
  insert(object: any): boolean {
    // Check if object is in this quad's boundary
    if (!this.contains(object)) {
      return false;
    }

    // If there's room, add the object
    if (this.objects.length < this.capacity) {
      this.objects.push(object);
      return true;
    }

    // Otherwise, subdivide and add to children
    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northeast!.insert(object) ||
      this.northwest!.insert(object) ||
      this.southeast!.insert(object) ||
      this.southwest!.insert(object)
    );
  }

  /**
   * Query objects in a given range
   */
  query(range: AABB, found: any[] = []): any[] {
    // If the range doesn't intersect this quad, return
    if (!CollisionDetector.checkAABB(this.boundary, range)) {
      return found;
    }

    // Check objects in this quad
    for (const obj of this.objects) {
      if (this.contains(obj) && CollisionDetector.checkAABB(range, this.getAABB(obj))) {
        found.push(obj);
      }
    }

    // If subdivided, query children
    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }

    return found;
  }

  /**
   * Subdivide this quad into four children
   */
  private subdivide(): void {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.width / 2;
    const h = this.boundary.height / 2;

    this.northeast = new QuadTree({ x: x + w, y, width: w, height: h }, this.capacity);
    this.northwest = new QuadTree({ x, y, width: w, height: h }, this.capacity);
    this.southeast = new QuadTree({ x: x + w, y: y + h, width: w, height: h }, this.capacity);
    this.southwest = new QuadTree({ x, y: y + h, width: w, height: h }, this.capacity);

    this.divided = true;
  }

  /**
   * Check if an object is in this quad's boundary
   */
  private contains(object: any): boolean {
    const aabb = this.getAABB(object);
    return CollisionDetector.checkAABB(this.boundary, aabb);
  }

  /**
   * Get AABB from object
   */
  private getAABB(object: any): AABB {
    if ('radius' in object) {
      return {
        x: object.x - object.radius,
        y: object.y - object.radius,
        width: object.radius * 2,
        height: object.radius * 2,
      };
    }
    return { x: object.x, y: object.y, width: object.width, height: object.height };
  }

  /**
   * Clear the quadtree
   */
  clear(): void {
    this.objects = [];
    this.divided = false;
    this.northeast = undefined;
    this.northwest = undefined;
    this.southeast = undefined;
    this.southwest = undefined;
  }
}

// ============== Physics Engine ==============

interface PhysicsObject extends Circle {
  velocityX: number;
  velocityY: number;
  mass: number;
  restitution: number; // bounciness (0-1)
  color: string;
}

class PhysicsEngine {
  private objects: PhysicsObject[] = [];
  private gravity: Vector2 = { x: 0, y: 0 };
  private bounds: AABB;
  private quadTree: QuadTree;

  constructor(bounds: AABB) {
    this.bounds = bounds;
    this.quadTree = new QuadTree(bounds, 4);
  }

  /**
   * Add a physics object
   */
  addObject(obj: PhysicsObject): void {
    this.objects.push(obj);
  }

  /**
   * Set gravity
   */
  setGravity(x: number, y: number): void {
    this.gravity = { x, y };
  }

  /**
   * Update physics simulation
   */
  update(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds

    // Clear and rebuild quadtree
    this.quadTree.clear();
    this.objects.forEach((obj) => this.quadTree.insert(obj));

    // Update positions and apply gravity
    for (const obj of this.objects) {
      // Apply gravity
      obj.velocityX += this.gravity.x * dt;
      obj.velocityY += this.gravity.y * dt;

      // Update position
      obj.x += obj.velocityX * dt;
      obj.y += obj.velocityY * dt;

      // Check bounds collision
      this.checkBoundsCollision(obj);
    }

    // Check collisions between objects
    this.checkCollisions();
  }

  /**
   * Check collision with bounds
   */
  private checkBoundsCollision(obj: PhysicsObject): void {
    // Left/Right bounds
    if (obj.x - obj.radius < this.bounds.x) {
      obj.x = this.bounds.x + obj.radius;
      obj.velocityX *= -obj.restitution;
    } else if (obj.x + obj.radius > this.bounds.x + this.bounds.width) {
      obj.x = this.bounds.x + this.bounds.width - obj.radius;
      obj.velocityX *= -obj.restitution;
    }

    // Top/Bottom bounds
    if (obj.y - obj.radius < this.bounds.y) {
      obj.y = this.bounds.y + obj.radius;
      obj.velocityY *= -obj.restitution;
    } else if (obj.y + obj.radius > this.bounds.y + this.bounds.height) {
      obj.y = this.bounds.y + this.bounds.height - obj.radius;
      obj.velocityY *= -obj.restitution;
    }
  }

  /**
   * Check collisions between objects using quadtree
   */
  private checkCollisions(): void {
    for (let i = 0; i < this.objects.length; i++) {
      const objA = this.objects[i];

      // Query nearby objects using quadtree
      const searchArea: AABB = {
        x: objA.x - objA.radius * 2,
        y: objA.y - objA.radius * 2,
        width: objA.radius * 4,
        height: objA.radius * 4,
      };

      const nearbyObjects = this.quadTree.query(searchArea);

      for (const objB of nearbyObjects) {
        if (objA === objB) continue;

        const collision = CollisionDetector.checkCircleDetailed(objA, objB);

        if (collision.colliding) {
          this.resolveCollision(objA, objB, collision);
        }
      }
    }
  }

  /**
   * Resolve collision between two objects
   */
  private resolveCollision(
    a: PhysicsObject,
    b: PhysicsObject,
    collision: CollisionInfo
  ): void {
    if (!collision.normal || !collision.penetration) return;

    // Separate objects
    const totalMass = a.mass + b.mass;
    const aRatio = b.mass / totalMass;
    const bRatio = a.mass / totalMass;

    a.x += collision.normal.x * collision.penetration * aRatio;
    a.y += collision.normal.y * collision.penetration * aRatio;
    b.x -= collision.normal.x * collision.penetration * bRatio;
    b.y -= collision.normal.y * collision.penetration * bRatio;

    // Calculate relative velocity
    const relativeVelX = a.velocityX - b.velocityX;
    const relativeVelY = a.velocityY - b.velocityY;

    // Calculate velocity along collision normal
    const velAlongNormal =
      relativeVelX * collision.normal.x + relativeVelY * collision.normal.y;

    // Don't resolve if velocities are separating
    if (velAlongNormal > 0) return;

    // Calculate restitution (bounciness)
    const restitution = Math.min(a.restitution, b.restitution);

    // Calculate impulse scalar
    const impulseScalar = (-(1 + restitution) * velAlongNormal) / (1 / a.mass + 1 / b.mass);

    // Apply impulse
    const impulseX = impulseScalar * collision.normal.x;
    const impulseY = impulseScalar * collision.normal.y;

    a.velocityX += impulseX / a.mass;
    a.velocityY += impulseY / a.mass;
    b.velocityX -= impulseX / b.mass;
    b.velocityY -= impulseY / b.mass;
  }

  /**
   * Render all objects
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const obj of this.objects) {
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw velocity vector
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(obj.x, obj.y);
      ctx.lineTo(obj.x + obj.velocityX * 0.1, obj.y + obj.velocityY * 0.1);
      ctx.stroke();
    }
  }

  getObjects(): PhysicsObject[] {
    return this.objects;
  }
}

// ============== Demo Setup ==============

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (!canvas || !ctx) {
  throw new Error('Canvas not found');
}

canvas.width = 800;
canvas.height = 600;

// Create physics engine
const physics = new PhysicsEngine({ x: 0, y: 0, width: canvas.width, height: canvas.height });
physics.setGravity(0, 500); // Gravity pulling down

// Create objects
const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];

for (let i = 0; i < 30; i++) {
  physics.addObject({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.5,
    radius: 10 + Math.random() * 20,
    velocityX: (Math.random() - 0.5) * 200,
    velocityY: (Math.random() - 0.5) * 200,
    mass: 1,
    restitution: 0.8,
    color: colors[Math.floor(Math.random() * colors.length)],
  });
}

// ============== Game Loop ==============

let lastTime = performance.now();

function gameLoop(): void {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  // Update physics
  physics.update(deltaTime);

  // Render
  ctx.fillStyle = '#0a0e27';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  physics.render(ctx);

  // Display info
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText(`Objects: ${physics.getObjects().length}`, 10, 20);
  ctx.fillText('Click to add objects', 10, 40);

  requestAnimationFrame(gameLoop);
}

// Add objects on click
canvas.addEventListener('click', (e: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  physics.addObject({
    x,
    y,
    radius: 15,
    velocityX: (Math.random() - 0.5) * 300,
    velocityY: -200,
    mass: 1,
    restitution: 0.9,
    color: colors[Math.floor(Math.random() * colors.length)],
  });
});

gameLoop();

// ============== Export ==============

export { CollisionDetector, QuadTree, PhysicsEngine, PhysicsObject, CollisionInfo };
