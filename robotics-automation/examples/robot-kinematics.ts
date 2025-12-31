/**
 * Robot Kinematics Examples
 *
 * Demonstrates:
 * - Forward kinematics (joint angles -> end-effector position)
 * - Inverse kinematics (end-effector position -> joint angles)
 * - Denavit-Hartenberg parameters
 * - Jacobian matrix computation
 * - Velocity kinematics
 */

// Types
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface JointAngles {
  theta1: number; // Base rotation (degrees)
  theta2: number; // Shoulder angle (degrees)
  theta3: number; // Elbow angle (degrees)
  theta4?: number; // Wrist rotation (optional)
}

interface EndEffectorPose {
  position: Vector3;
  orientation: Vector3; // Euler angles (roll, pitch, yaw)
}

interface DHParameter {
  a: number; // Link length
  alpha: number; // Link twist
  d: number; // Link offset
  theta: number; // Joint angle
}

interface RobotConfiguration {
  links: DHParameter[];
  jointLimits: Array<{ min: number; max: number }>;
}

// Matrix operations
class Matrix {
  constructor(public rows: number, public cols: number, public data: number[][]) {}

  static identity(size: number): Matrix {
    const data = Array(size).fill(0).map((_, i) =>
      Array(size).fill(0).map((_, j) => (i === j ? 1 : 0))
    );
    return new Matrix(size, size, data);
  }

  multiply(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error('Matrix dimensions incompatible for multiplication');
    }

    const result = Array(this.rows).fill(0).map(() => Array(other.cols).fill(0));

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        for (let k = 0; k < this.cols; k++) {
          result[i][j] += this.data[i][k] * other.data[k][j];
        }
      }
    }

    return new Matrix(this.rows, other.cols, result);
  }

  get(row: number, col: number): number {
    return this.data[row][col];
  }

  set(row: number, col: number, value: number): void {
    this.data[row][col] = value;
  }

  transpose(): Matrix {
    const result = Array(this.cols).fill(0).map(() => Array(this.rows).fill(0));
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result[j][i] = this.data[i][j];
      }
    }
    return new Matrix(this.cols, this.rows, result);
  }
}

// Utility functions
function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}

function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

/**
 * Denavit-Hartenberg Transformation Matrix
 */
function dhTransform(dh: DHParameter): Matrix {
  const ct = Math.cos(dh.theta);
  const st = Math.sin(dh.theta);
  const ca = Math.cos(dh.alpha);
  const sa = Math.sin(dh.alpha);

  return new Matrix(4, 4, [
    [ct, -st * ca, st * sa, dh.a * ct],
    [st, ct * ca, -ct * sa, dh.a * st],
    [0, sa, ca, dh.d],
    [0, 0, 0, 1]
  ]);
}

/**
 * Forward Kinematics for a 3-DOF Planar Arm
 */
class PlanarArm3DOF {
  private l1: number; // Length of link 1
  private l2: number; // Length of link 2
  private l3: number; // Length of link 3

  constructor(l1: number = 1.0, l2: number = 1.0, l3: number = 0.5) {
    this.l1 = l1;
    this.l2 = l2;
    this.l3 = l3;
  }

  /**
   * Forward kinematics: Calculate end-effector position from joint angles
   */
  forwardKinematics(angles: JointAngles): Vector3 {
    const theta1 = degToRad(angles.theta1);
    const theta2 = degToRad(angles.theta2);
    const theta3 = degToRad(angles.theta3);

    // Calculate cumulative angles
    const angle1 = theta1;
    const angle2 = theta1 + theta2;
    const angle3 = theta1 + theta2 + theta3;

    // Calculate position
    const x = this.l1 * Math.cos(angle1) +
              this.l2 * Math.cos(angle2) +
              this.l3 * Math.cos(angle3);

    const y = this.l1 * Math.sin(angle1) +
              this.l2 * Math.sin(angle2) +
              this.l3 * Math.sin(angle3);

    return { x, y, z: 0 };
  }

  /**
   * Inverse kinematics: Calculate joint angles from end-effector position
   * Using geometric approach for 2-link portion
   */
  inverseKinematics(target: Vector3, orientation: number = 0): JointAngles | null {
    // Account for wrist offset
    const phi = degToRad(orientation);
    const wx = target.x - this.l3 * Math.cos(phi);
    const wy = target.y - this.l3 * Math.sin(phi);

    // Distance to wrist position
    const r = Math.sqrt(wx * wx + wy * wy);

    // Check if target is reachable
    if (r > this.l1 + this.l2 || r < Math.abs(this.l1 - this.l2)) {
      console.warn('Target is out of reach');
      return null;
    }

    // Elbow angle using law of cosines
    const cosTheta2 = (r * r - this.l1 * this.l1 - this.l2 * this.l2) / (2 * this.l1 * this.l2);
    const theta2 = -Math.acos(Math.max(-1, Math.min(1, cosTheta2))); // Elbow-down solution

    // Shoulder angle
    const alpha = Math.atan2(wy, wx);
    const beta = Math.acos(Math.max(-1, Math.min(1,
      (this.l1 * this.l1 + r * r - this.l2 * this.l2) / (2 * this.l1 * r)
    )));
    const theta1 = alpha - beta;

    // Wrist angle to achieve desired orientation
    const theta3 = phi - theta1 - theta2;

    return {
      theta1: radToDeg(theta1),
      theta2: radToDeg(theta2),
      theta3: radToDeg(theta3)
    };
  }

  /**
   * Calculate Jacobian matrix for velocity kinematics
   */
  jacobian(angles: JointAngles): Matrix {
    const theta1 = degToRad(angles.theta1);
    const theta2 = degToRad(angles.theta2);
    const theta3 = degToRad(angles.theta3);

    const angle1 = theta1;
    const angle2 = theta1 + theta2;
    const angle3 = theta1 + theta2 + theta3;

    // Partial derivatives of x and y with respect to each joint angle
    const dxdq1 = -this.l1 * Math.sin(angle1) - this.l2 * Math.sin(angle2) - this.l3 * Math.sin(angle3);
    const dxdq2 = -this.l2 * Math.sin(angle2) - this.l3 * Math.sin(angle3);
    const dxdq3 = -this.l3 * Math.sin(angle3);

    const dydq1 = this.l1 * Math.cos(angle1) + this.l2 * Math.cos(angle2) + this.l3 * Math.cos(angle3);
    const dydq2 = this.l2 * Math.cos(angle2) + this.l3 * Math.cos(angle3);
    const dydq3 = this.l3 * Math.cos(angle3);

    return new Matrix(2, 3, [
      [dxdq1, dxdq2, dxdq3],
      [dydq1, dydq2, dydq3]
    ]);
  }

  /**
   * Calculate end-effector velocity from joint velocities
   */
  forwardVelocity(angles: JointAngles, jointVelocities: number[]): Vector3 {
    const J = this.jacobian(angles);
    const velocity = [0, 0];

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        velocity[i] += J.get(i, j) * degToRad(jointVelocities[j]);
      }
    }

    return { x: velocity[0], y: velocity[1], z: 0 };
  }
}

/**
 * 6-DOF Robot Arm using DH Parameters
 */
class RobotArm6DOF {
  private dhParams: DHParameter[];

  constructor() {
    // Example: PUMA-like robot arm DH parameters
    this.dhParams = [
      { a: 0, alpha: degToRad(90), d: 0.672, theta: 0 },
      { a: 0.432, alpha: degToRad(0), d: 0, theta: 0 },
      { a: 0.020, alpha: degToRad(-90), d: 0, theta: 0 },
      { a: 0, alpha: degToRad(90), d: 0.434, theta: 0 },
      { a: 0, alpha: degToRad(-90), d: 0, theta: 0 },
      { a: 0, alpha: degToRad(0), d: 0.056, theta: 0 }
    ];
  }

  /**
   * Forward kinematics using DH convention
   */
  forwardKinematics(jointAngles: number[]): EndEffectorPose {
    if (jointAngles.length !== 6) {
      throw new Error('Requires 6 joint angles');
    }

    // Start with identity matrix
    let T = Matrix.identity(4);

    // Multiply transformation matrices for each joint
    for (let i = 0; i < 6; i++) {
      const dh = { ...this.dhParams[i], theta: this.dhParams[i].theta + degToRad(jointAngles[i]) };
      const Ti = dhTransform(dh);
      T = T.multiply(Ti);
    }

    // Extract position
    const position: Vector3 = {
      x: T.get(0, 3),
      y: T.get(1, 3),
      z: T.get(2, 3)
    };

    // Extract orientation (simplified - using rotation matrix elements)
    const orientation: Vector3 = {
      x: Math.atan2(T.get(2, 1), T.get(2, 2)),
      y: Math.atan2(-T.get(2, 0), Math.sqrt(T.get(2, 1) ** 2 + T.get(2, 2) ** 2)),
      z: Math.atan2(T.get(1, 0), T.get(0, 0))
    };

    return { position, orientation };
  }

  /**
   * Numerical inverse kinematics using Jacobian pseudo-inverse
   * (simplified version - full implementation would use more sophisticated algorithms)
   */
  inverseKinematicsNumerical(
    targetPose: EndEffectorPose,
    initialGuess: number[] = [0, 0, 0, 0, 0, 0],
    maxIterations: number = 100,
    tolerance: number = 0.001
  ): number[] | null {
    let currentAngles = [...initialGuess];

    for (let iter = 0; iter < maxIterations; iter++) {
      const currentPose = this.forwardKinematics(currentAngles);

      // Calculate position error
      const errorX = targetPose.position.x - currentPose.position.x;
      const errorY = targetPose.position.y - currentPose.position.y;
      const errorZ = targetPose.position.z - currentPose.position.z;

      const error = Math.sqrt(errorX ** 2 + errorY ** 2 + errorZ ** 2);

      if (error < tolerance) {
        return currentAngles;
      }

      // Compute numerical Jacobian and update joint angles
      // (simplified - real implementation would compute proper Jacobian)
      const step = 0.01;
      for (let i = 0; i < 6; i++) {
        const angles1 = [...currentAngles];
        angles1[i] += step;
        const pose1 = this.forwardKinematics(angles1);

        const dx = (pose1.position.x - currentPose.position.x) / step;
        const dy = (pose1.position.y - currentPose.position.y) / step;
        const dz = (pose1.position.z - currentPose.position.z) / step;

        // Simple gradient descent update
        const alpha = 0.1;
        currentAngles[i] += alpha * (dx * errorX + dy * errorY + dz * errorZ);
      }
    }

    console.warn('Inverse kinematics did not converge');
    return null;
  }
}

/**
 * Example Usage
 */
function main() {
  console.log('=== Robot Kinematics Examples ===\n');

  // Example 1: 3-DOF Planar Arm
  console.log('--- 3-DOF Planar Arm ---');
  const arm = new PlanarArm3DOF(1.0, 1.0, 0.5);

  // Forward kinematics
  const jointAngles: JointAngles = { theta1: 30, theta2: 45, theta3: -30 };
  console.log('Joint angles:', jointAngles);

  const endEffector = arm.forwardKinematics(jointAngles);
  console.log('End-effector position:', endEffector);

  // Inverse kinematics
  const target: Vector3 = { x: 1.5, y: 1.0, z: 0 };
  console.log('\nTarget position:', target);

  const solution = arm.inverseKinematics(target, 0);
  if (solution) {
    console.log('Joint angles solution:', solution);

    // Verify solution
    const verification = arm.forwardKinematics(solution);
    console.log('Verification (FK of IK solution):', verification);

    const error = Math.sqrt(
      (verification.x - target.x) ** 2 +
      (verification.y - target.y) ** 2
    );
    console.log('Position error:', error.toFixed(6), 'm');
  }

  // Jacobian and velocity kinematics
  console.log('\n--- Velocity Kinematics ---');
  const J = arm.jacobian(jointAngles);
  console.log('Jacobian matrix:');
  console.log('  [', J.data[0].map(v => v.toFixed(4)).join(', '), ']');
  console.log('  [', J.data[1].map(v => v.toFixed(4)).join(', '), ']');

  const jointVelocities = [10, -5, 15]; // deg/s
  console.log('\nJoint velocities:', jointVelocities, 'deg/s');

  const eeVelocity = arm.forwardVelocity(jointAngles, jointVelocities);
  console.log('End-effector velocity:', {
    x: eeVelocity.x.toFixed(4),
    y: eeVelocity.y.toFixed(4)
  }, 'm/s');

  // Example 2: 6-DOF Robot Arm
  console.log('\n--- 6-DOF Robot Arm ---');
  const robot6dof = new RobotArm6DOF();

  const joints6dof = [0, 30, 45, 0, 45, 0];
  console.log('Joint angles:', joints6dof);

  const pose6dof = robot6dof.forwardKinematics(joints6dof);
  console.log('End-effector pose:');
  console.log('  Position:', {
    x: pose6dof.position.x.toFixed(4),
    y: pose6dof.position.y.toFixed(4),
    z: pose6dof.position.z.toFixed(4)
  });
  console.log('  Orientation (rad):', {
    roll: pose6dof.orientation.x.toFixed(4),
    pitch: pose6dof.orientation.y.toFixed(4),
    yaw: pose6dof.orientation.z.toFixed(4)
  });

  // Numerical inverse kinematics
  console.log('\n--- Numerical Inverse Kinematics ---');
  const targetPose: EndEffectorPose = {
    position: { x: 0.4, y: 0.2, z: 0.8 },
    orientation: { x: 0, y: 0, z: 0 }
  };
  console.log('Target pose:', targetPose.position);

  const ikSolution = robot6dof.inverseKinematicsNumerical(targetPose, [0, 30, 45, 0, 45, 0]);
  if (ikSolution) {
    console.log('IK solution:', ikSolution.map(a => a.toFixed(2)));

    const verifyPose = robot6dof.forwardKinematics(ikSolution);
    console.log('Verification:', {
      x: verifyPose.position.x.toFixed(4),
      y: verifyPose.position.y.toFixed(4),
      z: verifyPose.position.z.toFixed(4)
    });
  }

  console.log('\n=== Examples Complete ===');
}

// Run examples
if (require.main === module) {
  main();
}

export { PlanarArm3DOF, RobotArm6DOF, Matrix, dhTransform, type JointAngles, type EndEffectorPose };
