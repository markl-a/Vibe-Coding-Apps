/**
 * Motion Planning Examples
 *
 * Demonstrates:
 * - A* pathfinding algorithm
 * - Rapidly-exploring Random Tree (RRT)
 * - Potential field method
 * - Trajectory generation
 * - Path smoothing
 */

// Types
interface Point2D {
  x: number;
  y: number;
}

interface Node {
  position: Point2D;
  parent: Node | null;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // Total cost (g + h)
}

interface Obstacle {
  position: Point2D;
  radius: number;
}

interface Path {
  points: Point2D[];
  length: number;
  smooth?: boolean;
}

interface GridMap {
  width: number;
  height: number;
  resolution: number;
  obstacles: boolean[][];
}

// Utility functions
function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function manhattanDistance(a: Point2D, b: Point2D): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function pointsEqual(a: Point2D, b: Point2D, epsilon: number = 0.01): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

/**
 * A* Pathfinding Algorithm
 */
class AStarPlanner {
  private map: GridMap;

  constructor(width: number, height: number, resolution: number = 1.0) {
    this.map = {
      width,
      height,
      resolution,
      obstacles: Array(height).fill(0).map(() => Array(width).fill(false))
    };
  }

  /**
   * Add obstacle to grid
   */
  addObstacle(x: number, y: number): void {
    if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
      this.map.obstacles[y][x] = true;
    }
  }

  /**
   * Add circular obstacle
   */
  addCircularObstacle(center: Point2D, radius: number): void {
    const r = Math.ceil(radius / this.map.resolution);
    const cx = Math.round(center.x / this.map.resolution);
    const cy = Math.round(center.y / this.map.resolution);

    for (let y = Math.max(0, cy - r); y < Math.min(this.map.height, cy + r); y++) {
      for (let x = Math.max(0, cx - r); x < Math.min(this.map.width, cx + r); x++) {
        const dist = distance({ x: x * this.map.resolution, y: y * this.map.resolution }, center);
        if (dist <= radius) {
          this.map.obstacles[y][x] = true;
        }
      }
    }
  }

  /**
   * Check if position is valid (not an obstacle)
   */
  private isValid(x: number, y: number): boolean {
    if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) {
      return false;
    }
    return !this.map.obstacles[y][x];
  }

  /**
   * Get neighbors of a node
   */
  private getNeighbors(node: Node): Point2D[] {
    const x = Math.round(node.position.x / this.map.resolution);
    const y = Math.round(node.position.y / this.map.resolution);
    const neighbors: Point2D[] = [];

    // 8-directional movement
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],           [1, 0],
      [-1, 1],  [0, 1],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isValid(nx, ny)) {
        neighbors.push({
          x: nx * this.map.resolution,
          y: ny * this.map.resolution
        });
      }
    }

    return neighbors;
  }

  /**
   * A* pathfinding
   */
  findPath(start: Point2D, goal: Point2D): Path | null {
    const openList: Node[] = [];
    const closedList: Set<string> = new Set();

    const startNode: Node = {
      position: start,
      parent: null,
      g: 0,
      h: distance(start, goal),
      f: distance(start, goal)
    };

    openList.push(startNode);

    while (openList.length > 0) {
      // Get node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openList[currentIndex];

      // Check if reached goal
      if (pointsEqual(current.position, goal, this.map.resolution)) {
        return this.reconstructPath(current);
      }

      // Move current from open to closed
      openList.splice(currentIndex, 1);
      closedList.add(`${current.position.x},${current.position.y}`);

      // Check neighbors
      for (const neighborPos of this.getNeighbors(current)) {
        const key = `${neighborPos.x},${neighborPos.y}`;
        if (closedList.has(key)) continue;

        const g = current.g + distance(current.position, neighborPos);
        const h = distance(neighborPos, goal);
        const f = g + h;

        // Check if neighbor is in open list
        const existingIndex = openList.findIndex(n =>
          pointsEqual(n.position, neighborPos, this.map.resolution)
        );

        if (existingIndex === -1) {
          openList.push({
            position: neighborPos,
            parent: current,
            g, h, f
          });
        } else if (g < openList[existingIndex].g) {
          openList[existingIndex].g = g;
          openList[existingIndex].f = f;
          openList[existingIndex].parent = current;
        }
      }
    }

    return null; // No path found
  }

  /**
   * Reconstruct path from goal node
   */
  private reconstructPath(node: Node): Path {
    const points: Point2D[] = [];
    let current: Node | null = node;
    let length = 0;

    while (current !== null) {
      points.unshift(current.position);
      if (current.parent) {
        length += distance(current.position, current.parent.position);
      }
      current = current.parent;
    }

    return { points, length, smooth: false };
  }
}

/**
 * Rapidly-exploring Random Tree (RRT)
 */
class RRTPlanner {
  private obstacles: Obstacle[];
  private stepSize: number;
  private maxIterations: number;
  private bounds: { minX: number; maxX: number; minY: number; maxY: number };

  constructor(
    obstacles: Obstacle[],
    stepSize: number = 1.0,
    maxIterations: number = 5000,
    bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 }
  ) {
    this.obstacles = obstacles;
    this.stepSize = stepSize;
    this.maxIterations = maxIterations;
    this.bounds = bounds;
  }

  /**
   * Check if point collides with obstacles
   */
  private isCollisionFree(point: Point2D): boolean {
    for (const obstacle of this.obstacles) {
      if (distance(point, obstacle.position) < obstacle.radius) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if line segment collides with obstacles
   */
  private isPathCollisionFree(from: Point2D, to: Point2D): boolean {
    const steps = Math.ceil(distance(from, to) / (this.stepSize / 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point: Point2D = {
        x: from.x + t * (to.x - from.x),
        y: from.y + t * (to.y - from.y)
      };
      if (!this.isCollisionFree(point)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Generate random point in bounds
   */
  private randomPoint(): Point2D {
    return {
      x: this.bounds.minX + Math.random() * (this.bounds.maxX - this.bounds.minX),
      y: this.bounds.minY + Math.random() * (this.bounds.maxY - this.bounds.minY)
    };
  }

  /**
   * Find nearest node to given point
   */
  private findNearest(tree: Node[], point: Point2D): Node {
    let nearest = tree[0];
    let minDist = distance(nearest.position, point);

    for (const node of tree) {
      const dist = distance(node.position, point);
      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    }

    return nearest;
  }

  /**
   * Extend tree towards point
   */
  private extend(nearest: Node, target: Point2D): Point2D {
    const dist = distance(nearest.position, target);
    if (dist <= this.stepSize) {
      return target;
    }

    const ratio = this.stepSize / dist;
    return {
      x: nearest.position.x + ratio * (target.x - nearest.position.x),
      y: nearest.position.y + ratio * (target.y - nearest.position.y)
    };
  }

  /**
   * RRT pathfinding
   */
  findPath(start: Point2D, goal: Point2D, goalBias: number = 0.1): Path | null {
    const tree: Node[] = [{
      position: start,
      parent: null,
      g: 0,
      h: 0,
      f: 0
    }];

    for (let i = 0; i < this.maxIterations; i++) {
      // Sample random point (or goal with bias)
      const randomPoint = Math.random() < goalBias ? goal : this.randomPoint();

      // Find nearest node in tree
      const nearest = this.findNearest(tree, randomPoint);

      // Extend towards random point
      const newPoint = this.extend(nearest, randomPoint);

      // Check if path is collision-free
      if (this.isPathCollisionFree(nearest.position, newPoint)) {
        const newNode: Node = {
          position: newPoint,
          parent: nearest,
          g: nearest.g + distance(nearest.position, newPoint),
          h: 0,
          f: 0
        };

        tree.push(newNode);

        // Check if reached goal
        if (distance(newPoint, goal) < this.stepSize) {
          return this.reconstructPath(newNode);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Reconstruct path from goal node
   */
  private reconstructPath(node: Node): Path {
    const points: Point2D[] = [];
    let current: Node | null = node;
    let length = 0;

    while (current !== null) {
      points.unshift(current.position);
      if (current.parent) {
        length += distance(current.position, current.parent.position);
      }
      current = current.parent;
    }

    return { points, length, smooth: false };
  }
}

/**
 * Potential Field Method
 */
class PotentialFieldPlanner {
  private obstacles: Obstacle[];
  private attractiveGain: number;
  private repulsiveGain: number;
  private repulsiveRange: number;

  constructor(
    obstacles: Obstacle[],
    attractiveGain: number = 1.0,
    repulsiveGain: number = 5.0,
    repulsiveRange: number = 5.0
  ) {
    this.obstacles = obstacles;
    this.attractiveGain = attractiveGain;
    this.repulsiveGain = repulsiveGain;
    this.repulsiveRange = repulsiveRange;
  }

  /**
   * Calculate attractive force towards goal
   */
  private attractiveForce(current: Point2D, goal: Point2D): Point2D {
    const dx = goal.x - current.x;
    const dy = goal.y - current.y;
    return {
      x: this.attractiveGain * dx,
      y: this.attractiveGain * dy
    };
  }

  /**
   * Calculate repulsive force from obstacles
   */
  private repulsiveForce(current: Point2D): Point2D {
    let fx = 0;
    let fy = 0;

    for (const obstacle of this.obstacles) {
      const dx = current.x - obstacle.position.x;
      const dy = current.y - obstacle.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.repulsiveRange && dist > obstacle.radius) {
        const force = this.repulsiveGain * (1 / dist - 1 / this.repulsiveRange) / (dist * dist);
        fx += force * dx / dist;
        fy += force * dy / dist;
      }
    }

    return { x: fx, y: fy };
  }

  /**
   * Generate path using potential field
   */
  findPath(start: Point2D, goal: Point2D, maxSteps: number = 1000): Path | null {
    const points: Point2D[] = [start];
    let current = { ...start };
    const stepSize = 0.5;
    let length = 0;

    for (let i = 0; i < maxSteps; i++) {
      // Check if reached goal
      if (distance(current, goal) < 0.5) {
        points.push(goal);
        return { points, length, smooth: true };
      }

      // Calculate forces
      const attractive = this.attractiveForce(current, goal);
      const repulsive = this.repulsiveForce(current);

      // Total force
      const fx = attractive.x + repulsive.x;
      const fy = attractive.y + repulsive.y;
      const fMag = Math.sqrt(fx * fx + fy * fy);

      if (fMag === 0) {
        console.warn('Stuck in local minimum');
        return null;
      }

      // Move in direction of force
      const next: Point2D = {
        x: current.x + stepSize * fx / fMag,
        y: current.y + stepSize * fy / fMag
      };

      points.push(next);
      length += distance(current, next);
      current = next;
    }

    console.warn('Max steps reached without finding goal');
    return null;
  }
}

/**
 * Path Smoothing
 */
class PathSmoother {
  /**
   * Smooth path by removing unnecessary waypoints
   */
  static simplify(path: Path, obstacles: Obstacle[] = []): Path {
    if (path.points.length <= 2) return path;

    const smoothed: Point2D[] = [path.points[0]];
    let current = 0;

    while (current < path.points.length - 1) {
      let farthest = current + 1;

      // Try to connect to farthest point
      for (let i = path.points.length - 1; i > current + 1; i--) {
        if (this.isLineOfSightClear(path.points[current], path.points[i], obstacles)) {
          farthest = i;
          break;
        }
      }

      smoothed.push(path.points[farthest]);
      current = farthest;
    }

    return {
      points: smoothed,
      length: this.calculatePathLength(smoothed),
      smooth: true
    };
  }

  /**
   * Check if line of sight is clear
   */
  private static isLineOfSightClear(from: Point2D, to: Point2D, obstacles: Obstacle[]): boolean {
    const steps = Math.ceil(distance(from, to) * 2);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point: Point2D = {
        x: from.x + t * (to.x - from.x),
        y: from.y + t * (to.y - from.y)
      };

      for (const obstacle of obstacles) {
        if (distance(point, obstacle.position) < obstacle.radius) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Calculate total path length
   */
  private static calculatePathLength(points: Point2D[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += distance(points[i - 1], points[i]);
    }
    return length;
  }
}

/**
 * Example Usage
 */
function main() {
  console.log('=== Motion Planning Examples ===\n');

  // Create obstacle environment
  const obstacles: Obstacle[] = [
    { position: { x: 25, y: 25 }, radius: 5 },
    { position: { x: 50, y: 50 }, radius: 8 },
    { position: { x: 75, y: 30 }, radius: 6 },
    { position: { x: 40, y: 70 }, radius: 7 }
  ];

  const start: Point2D = { x: 10, y: 10 };
  const goal: Point2D = { x: 90, y: 90 };

  console.log('Start:', start);
  console.log('Goal:', goal);
  console.log('Obstacles:', obstacles.length);

  // Example 1: A* Pathfinding
  console.log('\n--- A* Pathfinding ---');
  const astar = new AStarPlanner(100, 100, 1.0);

  // Add obstacles to grid
  for (const obstacle of obstacles) {
    astar.addCircularObstacle(obstacle.position, obstacle.radius);
  }

  const astarPath = astar.findPath(start, goal);
  if (astarPath) {
    console.log('Path found!');
    console.log('Waypoints:', astarPath.points.length);
    console.log('Path length:', astarPath.length.toFixed(2));
    console.log('First 5 waypoints:', astarPath.points.slice(0, 5));
  } else {
    console.log('No path found');
  }

  // Example 2: RRT
  console.log('\n--- RRT Pathfinding ---');
  const rrt = new RRTPlanner(obstacles, 2.0, 2000);
  const rrtPath = rrt.findPath(start, goal, 0.15);

  if (rrtPath) {
    console.log('Path found!');
    console.log('Waypoints:', rrtPath.points.length);
    console.log('Path length:', rrtPath.length.toFixed(2));

    // Smooth the RRT path
    const smoothedRRT = PathSmoother.simplify(rrtPath, obstacles);
    console.log('After smoothing:');
    console.log('Waypoints:', smoothedRRT.points.length);
    console.log('Path length:', smoothedRRT.length.toFixed(2));
  } else {
    console.log('No path found');
  }

  // Example 3: Potential Field
  console.log('\n--- Potential Field Method ---');
  const potentialField = new PotentialFieldPlanner(obstacles, 1.0, 10.0, 15.0);
  const pfPath = potentialField.findPath(start, goal, 500);

  if (pfPath) {
    console.log('Path found!');
    console.log('Waypoints:', pfPath.points.length);
    console.log('Path length:', pfPath.length.toFixed(2));
  } else {
    console.log('No path found (may be stuck in local minimum)');
  }

  // Example 4: Compare all methods
  console.log('\n--- Comparison ---');
  console.log('Method         | Waypoints | Length  | Smooth');
  console.log('---------------|-----------|---------|-------');
  if (astarPath) {
    console.log(`A*             | ${astarPath.points.length.toString().padEnd(9)} | ${astarPath.length.toFixed(2).padEnd(7)} | No`);
  }
  if (rrtPath) {
    console.log(`RRT            | ${rrtPath.points.length.toString().padEnd(9)} | ${rrtPath.length.toFixed(2).padEnd(7)} | No`);
    const smoothedRRT = PathSmoother.simplify(rrtPath, obstacles);
    console.log(`RRT (smoothed) | ${smoothedRRT.points.length.toString().padEnd(9)} | ${smoothedRRT.length.toFixed(2).padEnd(7)} | Yes`);
  }
  if (pfPath) {
    console.log(`Potential Field| ${pfPath.points.length.toString().padEnd(9)} | ${pfPath.length.toFixed(2).padEnd(7)} | Yes`);
  }

  console.log('\n=== Examples Complete ===');
}

// Run examples
if (require.main === module) {
  main();
}

export { AStarPlanner, RRTPlanner, PotentialFieldPlanner, PathSmoother, type Path, type Obstacle };
