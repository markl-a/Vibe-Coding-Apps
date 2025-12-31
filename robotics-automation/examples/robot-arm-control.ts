/**
 * Robot Arm Control Examples
 *
 * Demonstrates:
 * - Joint space control
 * - Task space control
 * - Trajectory generation
 * - Gripper control
 * - Pick and place operations
 * - Collision avoidance
 * - Force control
 */

// Types
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface JointState {
  positions: number[]; // Joint angles in radians
  velocities: number[]; // Joint velocities in rad/s
  torques: number[]; // Joint torques in Nm
}

interface EndEffectorPose {
  position: Vector3;
  orientation: Vector3; // Euler angles (roll, pitch, yaw)
}

interface GripperState {
  position: number; // 0 (closed) to 1 (open)
  force: number; // Gripping force in N
}

interface Trajectory {
  waypoints: EndEffectorPose[];
  duration: number;
}

interface RobotArmConfig {
  numJoints: number;
  linkLengths: number[];
  jointLimits: Array<{ min: number; max: number }>;
  maxVelocities: number[];
  maxTorques: number[];
}

// Utility functions
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function interpolate(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function vec3Distance(a: Vector3, b: Vector3): number {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}

/**
 * Joint Space Controller
 */
class JointSpaceController {
  private targetPositions: number[];
  private gains: { kP: number; kD: number }[];

  constructor(numJoints: number) {
    this.targetPositions = Array(numJoints).fill(0);
    this.gains = Array(numJoints).fill(0).map(() => ({ kP: 10, kD: 2 }));
  }

  /**
   * Set target joint positions
   */
  setTarget(positions: number[]): void {
    this.targetPositions = [...positions];
  }

  /**
   * Compute joint torques using PD control
   */
  computeTorques(currentState: JointState): number[] {
    const torques: number[] = [];

    for (let i = 0; i < this.targetPositions.length; i++) {
      const error = this.targetPositions[i] - currentState.positions[i];
      const dError = -currentState.velocities[i];

      const torque = this.gains[i].kP * error + this.gains[i].kD * dError;
      torques.push(torque);
    }

    return torques;
  }

  /**
   * Set PD gains for a specific joint
   */
  setGains(jointIndex: number, kP: number, kD: number): void {
    if (jointIndex >= 0 && jointIndex < this.gains.length) {
      this.gains[jointIndex] = { kP, kD };
    }
  }
}

/**
 * Task Space Controller
 */
class TaskSpaceController {
  private targetPose: EndEffectorPose;
  private positionGains: { kP: number; kD: number };
  private orientationGains: { kP: number; kD: number };

  constructor() {
    this.targetPose = {
      position: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0 }
    };
    this.positionGains = { kP: 50, kD: 10 };
    this.orientationGains = { kP: 20, kD: 5 };
  }

  /**
   * Set target end-effector pose
   */
  setTarget(pose: EndEffectorPose): void {
    this.targetPose = { ...pose };
  }

  /**
   * Compute desired wrench (force/torque) in task space
   */
  computeWrench(currentPose: EndEffectorPose, currentVelocity: Vector3): number[] {
    // Position error
    const posError = {
      x: this.targetPose.position.x - currentPose.position.x,
      y: this.targetPose.position.y - currentPose.position.y,
      z: this.targetPose.position.z - currentPose.position.z
    };

    // Force control
    const force = {
      x: this.positionGains.kP * posError.x - this.positionGains.kD * currentVelocity.x,
      y: this.positionGains.kP * posError.y - this.positionGains.kD * currentVelocity.y,
      z: this.positionGains.kP * posError.z - this.positionGains.kD * currentVelocity.z
    };

    // Orientation error (simplified)
    const oriError = {
      x: this.targetPose.orientation.x - currentPose.orientation.x,
      y: this.targetPose.orientation.y - currentPose.orientation.y,
      z: this.targetPose.orientation.z - currentPose.orientation.z
    };

    // Torque control
    const torque = {
      x: this.orientationGains.kP * oriError.x,
      y: this.orientationGains.kP * oriError.y,
      z: this.orientationGains.kP * oriError.z
    };

    return [force.x, force.y, force.z, torque.x, torque.y, torque.z];
  }
}

/**
 * Trajectory Generator
 */
class TrajectoryGenerator {
  /**
   * Generate linear trajectory between two poses
   */
  static linear(start: EndEffectorPose, end: EndEffectorPose, duration: number, steps: number): Trajectory {
    const waypoints: EndEffectorPose[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      waypoints.push({
        position: {
          x: interpolate(start.position.x, end.position.x, t),
          y: interpolate(start.position.y, end.position.y, t),
          z: interpolate(start.position.z, end.position.z, t)
        },
        orientation: {
          x: interpolate(start.orientation.x, end.orientation.x, t),
          y: interpolate(start.orientation.y, end.orientation.y, t),
          z: interpolate(start.orientation.z, end.orientation.z, t)
        }
      });
    }

    return { waypoints, duration };
  }

  /**
   * Generate circular trajectory
   */
  static circular(center: Vector3, radius: number, startAngle: number, endAngle: number, steps: number): Trajectory {
    const waypoints: EndEffectorPose[] = [];
    const duration = 5.0;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = interpolate(startAngle, endAngle, t);

      waypoints.push({
        position: {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
          z: center.z
        },
        orientation: { x: 0, y: 0, z: angle }
      });
    }

    return { waypoints, duration };
  }

  /**
   * Generate quintic polynomial trajectory (smooth velocity and acceleration)
   */
  static quintic(start: number, end: number, duration: number, steps: number): number[] {
    const trajectory: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * duration;
      const tau = t / duration;

      // Quintic polynomial: 10τ³ - 15τ⁴ + 6τ⁵
      const s = 10 * tau ** 3 - 15 * tau ** 4 + 6 * tau ** 5;
      trajectory.push(start + (end - start) * s);
    }

    return trajectory;
  }
}

/**
 * Gripper Controller
 */
class GripperController {
  private state: GripperState;
  private targetPosition: number;
  private targetForce: number;
  private maxForce: number;

  constructor(maxForce: number = 50) {
    this.state = { position: 1, force: 0 };
    this.targetPosition = 1;
    this.targetForce = 0;
    this.maxForce = maxForce;
  }

  /**
   * Open gripper
   */
  open(): void {
    this.targetPosition = 1;
    this.targetForce = 0;
  }

  /**
   * Close gripper with specified force
   */
  close(force: number = 30): void {
    this.targetPosition = 0;
    this.targetForce = clamp(force, 0, this.maxForce);
  }

  /**
   * Update gripper state
   */
  update(dt: number, objectDetected: boolean = false): GripperState {
    // Move towards target position
    const speed = 2.0; // positions/second
    const delta = this.targetPosition - this.state.position;

    if (Math.abs(delta) > 0.01) {
      const step = Math.sign(delta) * speed * dt;
      this.state.position = clamp(
        this.state.position + step,
        0,
        1
      );
    }

    // Apply force if object detected and gripper is closing
    if (objectDetected && this.targetPosition === 0) {
      this.state.force = this.targetForce;
    } else {
      this.state.force = 0;
    }

    return { ...this.state };
  }

  getState(): GripperState {
    return { ...this.state };
  }

  isGrasping(): boolean {
    return this.state.position < 0.5 && this.state.force > 5;
  }
}

/**
 * Pick and Place Controller
 */
class PickAndPlaceController {
  private armController: TaskSpaceController;
  private gripperController: GripperController;
  private currentState: 'idle' | 'approaching' | 'grasping' | 'lifting' | 'moving' | 'placing' | 'releasing';
  private currentPose: EndEffectorPose;

  constructor() {
    this.armController = new TaskSpaceController();
    this.gripperController = new GripperController();
    this.currentState = 'idle';
    this.currentPose = {
      position: { x: 0, y: 0, z: 0.5 },
      orientation: { x: 0, y: 0, z: 0 }
    };
  }

  /**
   * Execute pick and place operation
   */
  pickAndPlace(pickPose: EndEffectorPose, placePose: EndEffectorPose): void {
    this.currentState = 'approaching';
    console.log('Starting pick and place operation');

    // State machine will be updated in update() method
  }

  /**
   * Update controller state
   */
  update(dt: number, currentPose: EndEffectorPose, objectDetected: boolean): {
    wrench: number[];
    gripperState: GripperState;
    completed: boolean;
  } {
    this.currentPose = currentPose;
    let completed = false;

    switch (this.currentState) {
      case 'approaching':
        // Approach logic would be implemented here
        this.currentState = 'grasping';
        break;

      case 'grasping':
        this.gripperController.close(30);
        if (this.gripperController.isGrasping()) {
          this.currentState = 'lifting';
        }
        break;

      case 'lifting':
        // Lift object up
        this.currentState = 'moving';
        break;

      case 'moving':
        // Move to place position
        this.currentState = 'placing';
        break;

      case 'placing':
        // Lower object
        this.currentState = 'releasing';
        break;

      case 'releasing':
        this.gripperController.open();
        if (this.gripperController.getState().position > 0.9) {
          this.currentState = 'idle';
          completed = true;
        }
        break;
    }

    const wrench = this.armController.computeWrench(
      currentPose,
      { x: 0, y: 0, z: 0 }
    );

    const gripperState = this.gripperController.update(dt, objectDetected);

    return { wrench, gripperState, completed };
  }

  getCurrentState(): string {
    return this.currentState;
  }
}

/**
 * Collision Avoidance System
 */
class CollisionAvoidance {
  private obstacles: Array<{ position: Vector3; radius: number }>;
  private safetyMargin: number;

  constructor(safetyMargin: number = 0.1) {
    this.obstacles = [];
    this.safetyMargin = safetyMargin;
  }

  /**
   * Add obstacle
   */
  addObstacle(position: Vector3, radius: number): void {
    this.obstacles.push({ position, radius });
  }

  /**
   * Check if position is safe
   */
  isSafe(position: Vector3): boolean {
    for (const obstacle of this.obstacles) {
      const distance = vec3Distance(position, obstacle.position);
      if (distance < obstacle.radius + this.safetyMargin) {
        return false;
      }
    }
    return true;
  }

  /**
   * Compute repulsive force from obstacles
   */
  computeRepulsiveForce(position: Vector3): Vector3 {
    let forceX = 0;
    let forceY = 0;
    let forceZ = 0;

    for (const obstacle of this.obstacles) {
      const dx = position.x - obstacle.position.x;
      const dy = position.y - obstacle.position.y;
      const dz = position.z - obstacle.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const influenceDistance = obstacle.radius + 0.5;

      if (distance < influenceDistance && distance > 0) {
        const magnitude = 10 * (1 / distance - 1 / influenceDistance) / (distance * distance);
        forceX += magnitude * dx / distance;
        forceY += magnitude * dy / distance;
        forceZ += magnitude * dz / distance;
      }
    }

    return { x: forceX, y: forceY, z: forceZ };
  }
}

/**
 * Robot Arm Simulator
 */
class RobotArmSimulator {
  private config: RobotArmConfig;
  private jointState: JointState;
  private endEffectorPose: EndEffectorPose;

  constructor(config: RobotArmConfig) {
    this.config = config;
    this.jointState = {
      positions: Array(config.numJoints).fill(0),
      velocities: Array(config.numJoints).fill(0),
      torques: Array(config.numJoints).fill(0)
    };
    this.endEffectorPose = this.computeForwardKinematics();
  }

  /**
   * Update simulation
   */
  update(commandTorques: number[], dt: number): void {
    // Simple integration
    for (let i = 0; i < this.config.numJoints; i++) {
      this.jointState.torques[i] = clamp(
        commandTorques[i],
        -this.config.maxTorques[i],
        this.config.maxTorques[i]
      );

      // Simple dynamics: torque = inertia * acceleration + damping * velocity
      const acceleration = this.jointState.torques[i] - 0.1 * this.jointState.velocities[i];

      this.jointState.velocities[i] += acceleration * dt;
      this.jointState.velocities[i] = clamp(
        this.jointState.velocities[i],
        -this.config.maxVelocities[i],
        this.config.maxVelocities[i]
      );

      this.jointState.positions[i] += this.jointState.velocities[i] * dt;
      this.jointState.positions[i] = clamp(
        this.jointState.positions[i],
        this.config.jointLimits[i].min,
        this.config.jointLimits[i].max
      );
    }

    this.endEffectorPose = this.computeForwardKinematics();
  }

  /**
   * Compute forward kinematics (simplified planar arm)
   */
  private computeForwardKinematics(): EndEffectorPose {
    let x = 0;
    let y = 0;
    let z = 0;
    let angleSum = 0;

    for (let i = 0; i < this.config.numJoints; i++) {
      angleSum += this.jointState.positions[i];
      x += this.config.linkLengths[i] * Math.cos(angleSum);
      y += this.config.linkLengths[i] * Math.sin(angleSum);
    }

    return {
      position: { x, y, z },
      orientation: { x: 0, y: 0, z: angleSum }
    };
  }

  getJointState(): JointState {
    return { ...this.jointState };
  }

  getEndEffectorPose(): EndEffectorPose {
    return { ...this.endEffectorPose };
  }
}

/**
 * Example Usage
 */
function main() {
  console.log('=== Robot Arm Control Examples ===\n');

  // Create robot configuration
  const config: RobotArmConfig = {
    numJoints: 3,
    linkLengths: [1.0, 0.8, 0.5],
    jointLimits: [
      { min: -Math.PI, max: Math.PI },
      { min: -Math.PI / 2, max: Math.PI / 2 },
      { min: -Math.PI / 2, max: Math.PI / 2 }
    ],
    maxVelocities: [2.0, 2.0, 2.0],
    maxTorques: [10, 8, 5]
  };

  // Example 1: Joint Space Control
  console.log('--- Joint Space Control ---');
  const jointController = new JointSpaceController(3);
  const simulator = new RobotArmSimulator(config);

  const targetJoints = [Math.PI / 4, Math.PI / 6, -Math.PI / 6];
  jointController.setTarget(targetJoints);

  console.log('Target joints:', targetJoints.map(a => (a * 180 / Math.PI).toFixed(1) + '°').join(', '));
  console.log('\nTime | Joint Positions (deg)           | End Effector (x, y)');
  console.log('-----|--------------------------------|--------------------');

  const dt = 0.01;
  for (let t = 0; t <= 2.0; t += 0.4) {
    for (let i = 0; i < 40; i++) {
      const torques = jointController.computeTorques(simulator.getJointState());
      simulator.update(torques, dt);
    }

    const joints = simulator.getJointState().positions;
    const ee = simulator.getEndEffectorPose();

    console.log(
      `${t.toFixed(2)} | [${joints.map(j => (j * 180 / Math.PI).toFixed(1)).join(', ')}]`.padEnd(37) +
      `| (${ee.position.x.toFixed(3)}, ${ee.position.y.toFixed(3)})`
    );
  }

  // Example 2: Trajectory Generation
  console.log('\n--- Trajectory Generation ---');
  const startPose: EndEffectorPose = {
    position: { x: 1.0, y: 0.5, z: 0.2 },
    orientation: { x: 0, y: 0, z: 0 }
  };
  const endPose: EndEffectorPose = {
    position: { x: 0.5, y: 1.0, z: 0.5 },
    orientation: { x: 0, y: 0, z: Math.PI / 4 }
  };

  const linearTraj = TrajectoryGenerator.linear(startPose, endPose, 2.0, 5);
  console.log('Linear trajectory:');
  console.log('Step | Position (x, y, z)      | Orientation (yaw)');
  console.log('-----|------------------------|------------------');
  linearTraj.waypoints.forEach((wp, i) => {
    console.log(
      `${i.toString().padEnd(4)} | (${wp.position.x.toFixed(2)}, ${wp.position.y.toFixed(2)}, ${wp.position.z.toFixed(2)})`.padEnd(28) +
      `| ${(wp.orientation.z * 180 / Math.PI).toFixed(1)}°`
    );
  });

  // Example 3: Gripper Control
  console.log('\n--- Gripper Control ---');
  const gripper = new GripperController(50);

  console.log('Closing gripper...');
  console.log('Time | Position | Force | Status');
  console.log('-----|----------|-------|--------');

  gripper.close(30);
  for (let t = 0; t <= 1.0; t += 0.2) {
    const state = gripper.update(0.2, t > 0.4);
    const status = gripper.isGrasping() ? 'Grasping' : 'Moving';

    console.log(
      `${t.toFixed(2)} | ${state.position.toFixed(3).padEnd(8)} | ${state.force.toFixed(1).padEnd(5)} | ${status}`
    );
  }

  // Example 4: Collision Avoidance
  console.log('\n--- Collision Avoidance ---');
  const collisionAvoidance = new CollisionAvoidance(0.15);

  // Add obstacles
  collisionAvoidance.addObstacle({ x: 1.0, y: 0.5, z: 0.3 }, 0.2);
  collisionAvoidance.addObstacle({ x: 0.5, y: 1.0, z: 0.3 }, 0.15);

  console.log('Testing positions:');
  console.log('Position          | Safe? | Repulsive Force');
  console.log('------------------|-------|------------------');

  const testPositions: Vector3[] = [
    { x: 0.5, y: 0.5, z: 0.3 },
    { x: 1.0, y: 0.5, z: 0.3 },
    { x: 1.2, y: 0.6, z: 0.3 },
    { x: 0.0, y: 0.0, z: 0.3 }
  ];

  for (const pos of testPositions) {
    const safe = collisionAvoidance.isSafe(pos);
    const force = collisionAvoidance.computeRepulsiveForce(pos);

    console.log(
      `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`.padEnd(18) +
      `| ${safe ? 'Yes  ' : 'No   '} | (${force.x.toFixed(2)}, ${force.y.toFixed(2)}, ${force.z.toFixed(2)})`
    );
  }

  // Example 5: Pick and Place
  console.log('\n--- Pick and Place Operation ---');
  const pickPlace = new PickAndPlaceController();

  const pickPose: EndEffectorPose = {
    position: { x: 0.5, y: 0.3, z: 0.1 },
    orientation: { x: 0, y: 0, z: 0 }
  };

  const placePose: EndEffectorPose = {
    position: { x: 0.8, y: 0.8, z: 0.1 },
    orientation: { x: 0, y: 0, z: 0 }
  };

  console.log('Pick position:', pickPose.position);
  console.log('Place position:', placePose.position);
  console.log('\nState       | Gripper Pos | Gripper Force');
  console.log('------------|-------------|---------------');

  const states = ['approaching', 'grasping', 'lifting', 'moving', 'placing', 'releasing'];
  for (const state of states) {
    const result = pickPlace.update(0.1, pickPose, state === 'grasping');
    console.log(
      `${state.padEnd(11)} | ${result.gripperState.position.toFixed(3).padEnd(11)} | ${result.gripperState.force.toFixed(1)}`
    );
  }

  console.log('\n=== Examples Complete ===');
}

// Run examples
if (require.main === module) {
  main();
}

export {
  JointSpaceController,
  TaskSpaceController,
  TrajectoryGenerator,
  GripperController,
  PickAndPlaceController,
  CollisionAvoidance,
  RobotArmSimulator,
  type JointState,
  type EndEffectorPose,
  type GripperState
};
