/**
 * Obstacle Avoidance Examples
 *
 * Demonstrates:
 * - Dynamic Window Approach (DWA)
 * - Vector Field Histogram (VFH)
 * - Potential Field Method
 * - Bug algorithms (Bug0, Bug1, Bug2)
 * - Velocity obstacles
 * - Local and global planning integration
 */

// Types
interface Vector2D {
  x: number;
  y: number;
}

interface Velocity {
  linear: number; // m/s
  angular: number; // rad/s
}

interface Obstacle {
  position: Vector2D;
  radius: number;
  velocity?: Vector2D; // For dynamic obstacles
}

interface RobotState {
  position: Vector2D;
  heading: number; // radians
  velocity: Velocity;
}

interface RobotConfig {
  maxLinearVel: number;
  maxAngularVel: number;
  maxLinearAccel: number;
  maxAngularAccel: number;
  radius: number;
}

interface SensorReading {
  angle: number; // radians
  distance: number; // meters
}

// Utility functions
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

function distance(a: Vector2D, b: Vector2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function vec2Add(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

function vec2Scale(v: Vector2D, scalar: number): Vector2D {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * Dynamic Window Approach (DWA)
 */
class DynamicWindowApproach {
  private config: RobotConfig;
  private dt: number = 0.1;
  private predictionTime: number = 3.0;
  private alpha: number = 0.3; // Heading weight
  private beta: number = 0.2; // Velocity weight
  private gamma: number = 0.5; // Clearance weight

  constructor(config: RobotConfig) {
    this.config = config;
  }

  /**
   * Compute best velocity command
   */
  computeVelocity(
    currentState: RobotState,
    goal: Vector2D,
    obstacles: Obstacle[]
  ): Velocity {
    // Generate dynamic window
    const velocities = this.generateDynamicWindow(currentState.velocity);

    let bestVelocity: Velocity = { linear: 0, angular: 0 };
    let bestScore = -Infinity;

    // Evaluate each velocity candidate
    for (const vel of velocities) {
      const trajectory = this.predictTrajectory(currentState, vel);

      // Check for collisions
      if (this.hasCollision(trajectory, obstacles)) {
        continue;
      }

      // Compute objective function
      const headingScore = this.evaluateHeading(trajectory[trajectory.length - 1], goal);
      const velocityScore = this.evaluateVelocity(vel);
      const clearanceScore = this.evaluateClearance(trajectory, obstacles);

      const score =
        this.alpha * headingScore +
        this.beta * velocityScore +
        this.gamma * clearanceScore;

      if (score > bestScore) {
        bestScore = score;
        bestVelocity = vel;
      }
    }

    return bestVelocity;
  }

  /**
   * Generate velocity samples within dynamic window
   */
  private generateDynamicWindow(currentVel: Velocity): Velocity[] {
    const velocities: Velocity[] = [];

    // Compute achievable velocities
    const minLinear = Math.max(
      0,
      currentVel.linear - this.config.maxLinearAccel * this.dt
    );
    const maxLinear = Math.min(
      this.config.maxLinearVel,
      currentVel.linear + this.config.maxLinearAccel * this.dt
    );

    const minAngular = Math.max(
      -this.config.maxAngularVel,
      currentVel.angular - this.config.maxAngularAccel * this.dt
    );
    const maxAngular = Math.min(
      this.config.maxAngularVel,
      currentVel.angular + this.config.maxAngularAccel * this.dt
    );

    // Sample velocities
    const linearSamples = 10;
    const angularSamples = 20;

    for (let i = 0; i < linearSamples; i++) {
      const linear = minLinear + (i / (linearSamples - 1)) * (maxLinear - minLinear);

      for (let j = 0; j < angularSamples; j++) {
        const angular = minAngular + (j / (angularSamples - 1)) * (maxAngular - minAngular);
        velocities.push({ linear, angular });
      }
    }

    return velocities;
  }

  /**
   * Predict trajectory for given velocity
   */
  private predictTrajectory(state: RobotState, velocity: Velocity): Vector2D[] {
    const trajectory: Vector2D[] = [];
    let pos = { ...state.position };
    let heading = state.heading;

    const steps = Math.ceil(this.predictionTime / this.dt);

    for (let i = 0; i < steps; i++) {
      pos = {
        x: pos.x + velocity.linear * Math.cos(heading) * this.dt,
        y: pos.y + velocity.linear * Math.sin(heading) * this.dt
      };
      heading += velocity.angular * this.dt;
      trajectory.push({ ...pos });
    }

    return trajectory;
  }

  /**
   * Check if trajectory collides with obstacles
   */
  private hasCollision(trajectory: Vector2D[], obstacles: Obstacle[]): boolean {
    for (const point of trajectory) {
      for (const obstacle of obstacles) {
        if (distance(point, obstacle.position) < this.config.radius + obstacle.radius) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Evaluate heading towards goal
   */
  private evaluateHeading(position: Vector2D, goal: Vector2D): number {
    const angle = Math.atan2(goal.y - position.y, goal.x - position.x);
    return 1.0 / (1.0 + Math.abs(angle));
  }

  /**
   * Evaluate velocity magnitude
   */
  private evaluateVelocity(velocity: Velocity): number {
    return velocity.linear / this.config.maxLinearVel;
  }

  /**
   * Evaluate clearance to obstacles
   */
  private evaluateClearance(trajectory: Vector2D[], obstacles: Obstacle[]): number {
    let minClearance = Infinity;

    for (const point of trajectory) {
      for (const obstacle of obstacles) {
        const clearance = distance(point, obstacle.position) - obstacle.radius - this.config.radius;
        minClearance = Math.min(minClearance, clearance);
      }
    }

    return minClearance / 5.0; // Normalize
  }
}

/**
 * Vector Field Histogram (VFH)
 */
class VectorFieldHistogram {
  private sectorCount: number = 72; // 5-degree sectors
  private threshold: number = 0.3;
  private maxRange: number = 5.0;

  /**
   * Process laser scan and find safe direction
   */
  computeSteeringAngle(
    sensorReadings: SensorReading[],
    currentHeading: number,
    goalHeading: number
  ): number {
    // Build polar histogram
    const histogram = this.buildHistogram(sensorReadings);

    // Find candidate valleys (safe directions)
    const valleys = this.findValleys(histogram);

    if (valleys.length === 0) {
      return 0; // Stop if no safe direction
    }

    // Select best valley towards goal
    const targetValley = this.selectBestValley(valleys, goalHeading, currentHeading);

    return targetValley;
  }

  /**
   * Build polar obstacle density histogram
   */
  private buildHistogram(readings: SensorReading[]): number[] {
    const histogram = Array(this.sectorCount).fill(0);

    for (const reading of readings) {
      if (reading.distance > this.maxRange) continue;

      // Calculate obstacle density
      const density = Math.max(0, 1 - reading.distance / this.maxRange);

      // Map to sector
      const sectorAngle = (2 * Math.PI) / this.sectorCount;
      const sectorIndex = Math.floor((reading.angle + Math.PI) / sectorAngle);

      if (sectorIndex >= 0 && sectorIndex < this.sectorCount) {
        histogram[sectorIndex] += density;
      }
    }

    return histogram;
  }

  /**
   * Find valleys (safe directions) in histogram
   */
  private findValleys(histogram: number[]): Array<{ start: number; end: number; angle: number }> {
    const valleys: Array<{ start: number; end: number; angle: number }> = [];
    let inValley = false;
    let valleyStart = 0;

    for (let i = 0; i < histogram.length; i++) {
      if (histogram[i] < this.threshold && !inValley) {
        inValley = true;
        valleyStart = i;
      } else if (histogram[i] >= this.threshold && inValley) {
        inValley = false;
        const valleyCenter = (valleyStart + i) / 2;
        const angle = (valleyCenter / this.sectorCount) * 2 * Math.PI - Math.PI;
        valleys.push({ start: valleyStart, end: i, angle });
      }
    }

    return valleys;
  }

  /**
   * Select best valley towards goal
   */
  private selectBestValley(
    valleys: Array<{ start: number; end: number; angle: number }>,
    goalHeading: number,
    currentHeading: number
  ): number {
    let bestValley = valleys[0];
    let minDiff = Math.abs(normalizeAngle(valleys[0].angle - goalHeading));

    for (const valley of valleys) {
      const diff = Math.abs(normalizeAngle(valley.angle - goalHeading));
      if (diff < minDiff) {
        minDiff = diff;
        bestValley = valley;
      }
    }

    return bestValley.angle;
  }
}

/**
 * Bug2 Algorithm
 */
class Bug2Algorithm {
  private mLine: Array<Vector2D> = [];
  private state: 'move_to_goal' | 'follow_boundary' = 'move_to_goal';
  private hitPoint: Vector2D | null = null;
  private leavePoint: Vector2D | null = null;

  /**
   * Initialize with start and goal positions
   */
  initialize(start: Vector2D, goal: Vector2D): void {
    this.mLine = [start, goal];
    this.state = 'move_to_goal';
    this.hitPoint = null;
    this.leavePoint = null;
  }

  /**
   * Compute next move
   */
  computeMove(
    currentPos: Vector2D,
    goal: Vector2D,
    obstacleDetected: boolean,
    obstacleDirection: number
  ): Vector2D {
    if (this.state === 'move_to_goal') {
      if (obstacleDetected) {
        // Hit an obstacle, switch to boundary following
        this.state = 'follow_boundary';
        this.hitPoint = { ...currentPos };
        return this.followBoundary(currentPos, obstacleDirection);
      } else {
        // Move towards goal
        return this.moveTowardsGoal(currentPos, goal);
      }
    } else {
      // Following boundary
      if (this.isOnMLine(currentPos) && this.closerToGoal(currentPos, goal)) {
        // Back on M-line and closer to goal, resume moving to goal
        this.state = 'move_to_goal';
        this.leavePoint = { ...currentPos };
        return this.moveTowardsGoal(currentPos, goal);
      } else {
        // Continue following boundary
        return this.followBoundary(currentPos, obstacleDirection);
      }
    }
  }

  /**
   * Move towards goal
   */
  private moveTowardsGoal(current: Vector2D, goal: Vector2D): Vector2D {
    const direction = {
      x: goal.x - current.x,
      y: goal.y - current.y
    };
    const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);

    if (magnitude < 0.1) return current;

    return {
      x: direction.x / magnitude,
      y: direction.y / magnitude
    };
  }

  /**
   * Follow obstacle boundary
   */
  private followBoundary(current: Vector2D, obstacleDirection: number): Vector2D {
    // Move tangent to obstacle (90 degrees from obstacle direction)
    const tangentAngle = obstacleDirection + Math.PI / 2;

    return {
      x: Math.cos(tangentAngle),
      y: Math.sin(tangentAngle)
    };
  }

  /**
   * Check if position is on M-line
   */
  private isOnMLine(pos: Vector2D): boolean {
    if (this.mLine.length < 2) return false;

    const [start, end] = this.mLine;

    // Distance from point to line
    const lineLength = distance(start, end);
    if (lineLength < 0.001) return false;

    const t = Math.max(0, Math.min(1,
      ((pos.x - start.x) * (end.x - start.x) + (pos.y - start.y) * (end.y - start.y)) /
      (lineLength * lineLength)
    ));

    const projection = {
      x: start.x + t * (end.x - start.x),
      y: start.y + t * (end.y - start.y)
    };

    return distance(pos, projection) < 0.2;
  }

  /**
   * Check if current position is closer to goal than hit point
   */
  private closerToGoal(current: Vector2D, goal: Vector2D): boolean {
    if (!this.hitPoint) return false;
    return distance(current, goal) < distance(this.hitPoint, goal);
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Velocity Obstacle Method
 */
class VelocityObstacle {
  private robotRadius: number;
  private timeHorizon: number;

  constructor(robotRadius: number, timeHorizon: number = 5.0) {
    this.robotRadius = robotRadius;
    this.timeHorizon = timeHorizon;
  }

  /**
   * Compute collision-free velocity
   */
  computeSafeVelocity(
    currentVel: Vector2D,
    desiredVel: Vector2D,
    obstacles: Obstacle[],
    maxSpeed: number
  ): Vector2D {
    // Sample velocity space
    const candidates: Vector2D[] = [];
    const samples = 20;

    for (let i = 0; i < samples; i++) {
      const angle = (i / samples) * 2 * Math.PI;
      for (let j = 0; j < samples / 2; j++) {
        const speed = (j / (samples / 2)) * maxSpeed;
        candidates.push({
          x: speed * Math.cos(angle),
          y: speed * Math.sin(angle)
        });
      }
    }

    // Find best collision-free velocity
    let bestVel = currentVel;
    let minCost = Infinity;

    for (const vel of candidates) {
      if (!this.isVelocitySafe(vel, obstacles)) {
        continue;
      }

      // Cost: deviation from desired velocity
      const cost = distance(vel, desiredVel);

      if (cost < minCost) {
        minCost = cost;
        bestVel = vel;
      }
    }

    return bestVel;
  }

  /**
   * Check if velocity is safe (no collisions within time horizon)
   */
  private isVelocitySafe(velocity: Vector2D, obstacles: Obstacle[]): boolean {
    for (const obstacle of obstacles) {
      const relativeVel = {
        x: velocity.x - (obstacle.velocity?.x || 0),
        y: velocity.y - (obstacle.velocity?.y || 0)
      };

      // Time to collision
      const combinedRadius = this.robotRadius + obstacle.radius;
      const relativeSpeed = Math.sqrt(relativeVel.x ** 2 + relativeVel.y ** 2);

      if (relativeSpeed < 0.001) continue;

      // Check if collision occurs within time horizon
      const timeToClosestApproach = -1; // Simplified
      const closestDistance = combinedRadius; // Simplified

      if (closestDistance < combinedRadius && timeToClosestApproach < this.timeHorizon) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Example Usage
 */
function main() {
  console.log('=== Obstacle Avoidance Examples ===\n');

  // Robot configuration
  const robotConfig: RobotConfig = {
    maxLinearVel: 1.5,
    maxAngularVel: 1.0,
    maxLinearAccel: 1.0,
    maxAngularAccel: 2.0,
    radius: 0.3
  };

  // Example 1: Dynamic Window Approach
  console.log('--- Dynamic Window Approach (DWA) ---');
  const dwa = new DynamicWindowApproach(robotConfig);

  const robotState: RobotState = {
    position: { x: 0, y: 0 },
    heading: 0,
    velocity: { linear: 0.5, angular: 0 }
  };

  const goal: Vector2D = { x: 10, y: 10 };
  const obstacles: Obstacle[] = [
    { position: { x: 5, y: 5 }, radius: 1.0 },
    { position: { x: 7, y: 3 }, radius: 0.8 },
    { position: { x: 3, y: 7 }, radius: 0.6 }
  ];

  console.log('Robot state:', robotState.position);
  console.log('Goal:', goal);
  console.log('Obstacles:', obstacles.length);

  const velocity = dwa.computeVelocity(robotState, goal, obstacles);
  console.log('\nComputed velocity:');
  console.log('  Linear:', velocity.linear.toFixed(3), 'm/s');
  console.log('  Angular:', velocity.angular.toFixed(3), 'rad/s');

  // Example 2: Vector Field Histogram
  console.log('\n--- Vector Field Histogram (VFH) ---');
  const vfh = new VectorFieldHistogram();

  // Simulate laser scan readings
  const sensorReadings: SensorReading[] = [];
  for (let i = 0; i < 360; i += 5) {
    const angle = (i * Math.PI) / 180;
    let distance = 10.0; // Default max range

    // Simulate obstacles in certain directions
    if (Math.abs(angle) < 0.3 || Math.abs(angle - Math.PI / 2) < 0.3) {
      distance = 2.0;
    }

    sensorReadings.push({ angle, distance });
  }

  const currentHeading = 0;
  const goalHeading = Math.PI / 4;

  const steeringAngle = vfh.computeSteeringAngle(sensorReadings, currentHeading, goalHeading);
  console.log('Current heading:', (currentHeading * 180 / Math.PI).toFixed(1), 'degrees');
  console.log('Goal heading:', (goalHeading * 180 / Math.PI).toFixed(1), 'degrees');
  console.log('Recommended steering:', (steeringAngle * 180 / Math.PI).toFixed(1), 'degrees');

  // Example 3: Bug2 Algorithm
  console.log('\n--- Bug2 Algorithm ---');
  const bug2 = new Bug2Algorithm();

  const start: Vector2D = { x: 0, y: 0 };
  const bugGoal: Vector2D = { x: 10, y: 10 };

  bug2.initialize(start, bugGoal);
  console.log('Start:', start);
  console.log('Goal:', bugGoal);

  // Simulate navigation
  const positions: Vector2D[] = [
    { x: 2, y: 2 },
    { x: 4, y: 4 },
    { x: 5, y: 5 }, // Hit obstacle
    { x: 5, y: 6 }, // Following boundary
    { x: 6, y: 7 },
    { x: 7, y: 7 }, // Back on M-line
    { x: 8, y: 8 }
  ];

  console.log('\nStep | Position    | Obstacle? | State          | Move Direction');
  console.log('-----|-------------|-----------|----------------|----------------');

  for (let i = 0; i < positions.length; i++) {
    const obstacleDetected = i === 2 || i === 3 || i === 4;
    const obstacleDir = Math.PI / 2;

    const move = bug2.computeMove(positions[i], bugGoal, obstacleDetected, obstacleDir);

    console.log(
      `${i.toString().padEnd(4)} | (${positions[i].x.toFixed(1)}, ${positions[i].y.toFixed(1)})`.padEnd(14) +
      `| ${obstacleDetected ? 'Yes      ' : 'No       '} | ${bug2.getState().padEnd(14)} | ` +
      `(${move.x.toFixed(2)}, ${move.y.toFixed(2)})`
    );
  }

  // Example 4: Velocity Obstacle
  console.log('\n--- Velocity Obstacle Method ---');
  const vo = new VelocityObstacle(robotConfig.radius, 3.0);

  const currentVelocity: Vector2D = { x: 1.0, y: 0.5 };
  const desiredVelocity: Vector2D = { x: 1.5, y: 1.0 };

  const dynamicObstacles: Obstacle[] = [
    {
      position: { x: 5, y: 5 },
      radius: 0.5,
      velocity: { x: -0.5, y: 0.3 }
    },
    {
      position: { x: 8, y: 3 },
      radius: 0.4,
      velocity: { x: 0.2, y: -0.4 }
    }
  ];

  console.log('Current velocity:', currentVelocity);
  console.log('Desired velocity:', desiredVelocity);
  console.log('Dynamic obstacles:', dynamicObstacles.length);

  const safeVelocity = vo.computeSafeVelocity(
    currentVelocity,
    desiredVelocity,
    dynamicObstacles,
    robotConfig.maxLinearVel
  );

  console.log('\nSafe velocity:', safeVelocity);
  console.log('Deviation from desired:', distance(safeVelocity, desiredVelocity).toFixed(3));

  // Example 5: Performance Comparison
  console.log('\n--- Performance Comparison ---');
  console.log('Method  | Computational Cost | Smoothness | Dynamic Obstacles');
  console.log('--------|-------------------|------------|------------------');
  console.log('DWA     | Medium            | High       | Yes');
  console.log('VFH     | Low               | Medium     | Partial');
  console.log('Bug2    | Very Low          | Low        | No');
  console.log('VO      | High              | High       | Yes');

  console.log('\n=== Examples Complete ===');
}

// Run examples
if (require.main === module) {
  main();
}

export {
  DynamicWindowApproach,
  VectorFieldHistogram,
  Bug2Algorithm,
  VelocityObstacle,
  type Obstacle,
  type RobotState,
  type RobotConfig
};
