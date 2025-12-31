/**
 * Sensor Fusion Examples
 *
 * Demonstrates:
 * - Kalman Filter
 * - Extended Kalman Filter (EKF)
 * - Complementary Filter
 * - IMU sensor fusion
 * - Multi-sensor data fusion
 */

// Types
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

interface IMUSensorData {
  accelerometer: Vector3; // m/s²
  gyroscope: Vector3; // rad/s
  magnetometer: Vector3; // normalized
  timestamp: number; // ms
}

interface GPSData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  timestamp: number;
}

interface FusedState {
  position: Vector3;
  velocity: Vector3;
  orientation: Vector3; // Euler angles (roll, pitch, yaw)
  timestamp: number;
}

// Matrix class for computations
class Matrix {
  constructor(public rows: number, public cols: number, public data: number[][]) {}

  static zeros(rows: number, cols: number): Matrix {
    return new Matrix(rows, cols, Array(rows).fill(0).map(() => Array(cols).fill(0)));
  }

  static identity(size: number): Matrix {
    const data = Array(size).fill(0).map((_, i) =>
      Array(size).fill(0).map((_, j) => (i === j ? 1 : 0))
    );
    return new Matrix(size, size, data);
  }

  static fromArray(arr: number[]): Matrix {
    return new Matrix(arr.length, 1, arr.map(v => [v]));
  }

  add(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for addition');
    }
    const result = Matrix.zeros(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = this.data[i][j] + other.data[i][j];
      }
    }
    return result;
  }

  subtract(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for subtraction');
    }
    const result = Matrix.zeros(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = this.data[i][j] - other.data[i][j];
      }
    }
    return result;
  }

  multiply(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error('Matrix dimensions incompatible for multiplication');
    }
    const result = Matrix.zeros(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        for (let k = 0; k < this.cols; k++) {
          result.data[i][j] += this.data[i][k] * other.data[k][j];
        }
      }
    }
    return result;
  }

  scale(scalar: number): Matrix {
    const result = Matrix.zeros(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = this.data[i][j] * scalar;
      }
    }
    return result;
  }

  transpose(): Matrix {
    const result = Matrix.zeros(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[j][i] = this.data[i][j];
      }
    }
    return result;
  }

  inverse(): Matrix {
    if (this.rows !== this.cols) {
      throw new Error('Only square matrices can be inverted');
    }
    // Simplified 2x2 matrix inversion
    if (this.rows === 2) {
      const det = this.data[0][0] * this.data[1][1] - this.data[0][1] * this.data[1][0];
      if (Math.abs(det) < 1e-10) {
        throw new Error('Matrix is singular');
      }
      return new Matrix(2, 2, [
        [this.data[1][1] / det, -this.data[0][1] / det],
        [-this.data[1][0] / det, this.data[0][0] / det]
      ]);
    }
    throw new Error('Inverse only implemented for 2x2 matrices in this example');
  }

  toArray(): number[] {
    return this.data.map(row => row[0]);
  }
}

/**
 * 1D Kalman Filter
 */
class KalmanFilter1D {
  private x: number; // State estimate
  private P: number; // Estimate covariance
  private Q: number; // Process noise covariance
  private R: number; // Measurement noise covariance

  constructor(initialState: number, initialCovariance: number, processNoise: number, measurementNoise: number) {
    this.x = initialState;
    this.P = initialCovariance;
    this.Q = processNoise;
    this.R = measurementNoise;
  }

  /**
   * Predict step
   */
  predict(u: number = 0, dt: number = 1): void {
    // State prediction: x = x + u
    this.x = this.x + u * dt;

    // Covariance prediction: P = P + Q
    this.P = this.P + this.Q;
  }

  /**
   * Update step with measurement
   */
  update(measurement: number): void {
    // Kalman gain: K = P / (P + R)
    const K = this.P / (this.P + this.R);

    // Update estimate: x = x + K * (measurement - x)
    this.x = this.x + K * (measurement - this.x);

    // Update covariance: P = (1 - K) * P
    this.P = (1 - K) * this.P;
  }

  getState(): number {
    return this.x;
  }

  getCovariance(): number {
    return this.P;
  }
}

/**
 * 2D Kalman Filter for Position Tracking
 */
class KalmanFilter2D {
  private x: Matrix; // State [x, y, vx, vy]
  private P: Matrix; // Covariance matrix
  private F: Matrix; // State transition matrix
  private H: Matrix; // Measurement matrix
  private Q: Matrix; // Process noise
  private R: Matrix; // Measurement noise

  constructor() {
    // Initial state: [x, y, vx, vy]
    this.x = Matrix.fromArray([0, 0, 0, 0]);

    // Initial covariance
    this.P = Matrix.identity(4).scale(100);

    // State transition matrix (constant velocity model)
    this.F = new Matrix(4, 4, [
      [1, 0, 1, 0],
      [0, 1, 0, 1],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]);

    // Measurement matrix (we only measure position)
    this.H = new Matrix(2, 4, [
      [1, 0, 0, 0],
      [0, 1, 0, 0]
    ]);

    // Process noise
    this.Q = Matrix.identity(4).scale(0.1);

    // Measurement noise
    this.R = Matrix.identity(2).scale(5);
  }

  /**
   * Predict step
   */
  predict(dt: number = 1): void {
    // Update state transition matrix with dt
    this.F.data[0][2] = dt;
    this.F.data[1][3] = dt;

    // Predict state: x = F * x
    this.x = this.F.multiply(this.x);

    // Predict covariance: P = F * P * F^T + Q
    this.P = this.F.multiply(this.P).multiply(this.F.transpose()).add(this.Q);
  }

  /**
   * Update step with measurement
   */
  update(measurement: number[]): void {
    const z = Matrix.fromArray(measurement);

    // Innovation: y = z - H * x
    const y = z.subtract(this.H.multiply(this.x));

    // Innovation covariance: S = H * P * H^T + R
    const S = this.H.multiply(this.P).multiply(this.H.transpose()).add(this.R);

    // Kalman gain: K = P * H^T * S^-1
    const K = this.P.multiply(this.H.transpose()).multiply(S.inverse());

    // Update state: x = x + K * y
    this.x = this.x.add(K.multiply(y));

    // Update covariance: P = (I - K * H) * P
    const I = Matrix.identity(4);
    const KH = K.multiply(this.H);
    this.P = I.subtract(KH).multiply(this.P);
  }

  getState(): number[] {
    return this.x.toArray();
  }

  getPosition(): { x: number; y: number } {
    const state = this.getState();
    return { x: state[0], y: state[1] };
  }

  getVelocity(): { vx: number; vy: number } {
    const state = this.getState();
    return { vx: state[2], vy: state[3] };
  }
}

/**
 * Complementary Filter for IMU
 */
class ComplementaryFilter {
  private roll: number = 0;
  private pitch: number = 0;
  private yaw: number = 0;
  private alpha: number; // Complementary filter coefficient (0-1)

  constructor(alpha: number = 0.98) {
    this.alpha = alpha; // Higher alpha trusts gyro more
  }

  /**
   * Update orientation from IMU data
   */
  update(imu: IMUSensorData, dt: number): Vector3 {
    // Integrate gyroscope data
    this.roll += imu.gyroscope.x * dt;
    this.pitch += imu.gyroscope.y * dt;
    this.yaw += imu.gyroscope.z * dt;

    // Calculate angles from accelerometer
    const accelRoll = Math.atan2(imu.accelerometer.y, imu.accelerometer.z);
    const accelPitch = Math.atan2(
      -imu.accelerometer.x,
      Math.sqrt(imu.accelerometer.y ** 2 + imu.accelerometer.z ** 2)
    );

    // Complementary filter: blend gyro integration with accel
    this.roll = this.alpha * this.roll + (1 - this.alpha) * accelRoll;
    this.pitch = this.alpha * this.pitch + (1 - this.alpha) * accelPitch;

    // Yaw correction from magnetometer
    const magX = imu.magnetometer.x * Math.cos(this.pitch) +
                 imu.magnetometer.z * Math.sin(this.pitch);
    const magY = imu.magnetometer.x * Math.sin(this.roll) * Math.sin(this.pitch) +
                 imu.magnetometer.y * Math.cos(this.roll) -
                 imu.magnetometer.z * Math.sin(this.roll) * Math.cos(this.pitch);
    const magYaw = Math.atan2(magY, magX);

    this.yaw = this.alpha * this.yaw + (1 - this.alpha) * magYaw;

    return {
      x: this.roll,
      y: this.pitch,
      z: this.yaw
    };
  }

  getOrientation(): Vector3 {
    return {
      x: this.roll,
      y: this.pitch,
      z: this.yaw
    };
  }
}

/**
 * Multi-Sensor Fusion System
 */
class SensorFusionSystem {
  private positionFilter: KalmanFilter2D;
  private orientationFilter: ComplementaryFilter;
  private lastUpdateTime: number = 0;

  constructor() {
    this.positionFilter = new KalmanFilter2D();
    this.orientationFilter = new ComplementaryFilter(0.98);
  }

  /**
   * Process GPS measurement
   */
  processGPS(gps: GPSData): void {
    // Simple conversion: lat/lon to local coordinates (simplified)
    const x = gps.longitude * 111320 * Math.cos(gps.latitude * Math.PI / 180);
    const y = gps.latitude * 111320;

    this.positionFilter.update([x, y]);
  }

  /**
   * Process IMU measurement
   */
  processIMU(imu: IMUSensorData): void {
    const dt = this.lastUpdateTime > 0 ?
      (imu.timestamp - this.lastUpdateTime) / 1000 : 0.01;
    this.lastUpdateTime = imu.timestamp;

    // Update orientation
    this.orientationFilter.update(imu, dt);

    // Predict position based on IMU acceleration
    this.positionFilter.predict(dt);
  }

  /**
   * Get fused state
   */
  getFusedState(): FusedState {
    const position2d = this.positionFilter.getPosition();
    const velocity2d = this.positionFilter.getVelocity();
    const orientation = this.orientationFilter.getOrientation();

    return {
      position: { x: position2d.x, y: position2d.y, z: 0 },
      velocity: { x: velocity2d.vx, y: velocity2d.vy, z: 0 },
      orientation,
      timestamp: Date.now()
    };
  }
}

/**
 * Weighted Average Sensor Fusion
 */
class WeightedSensorFusion {
  /**
   * Fuse multiple sensor readings with weights based on confidence/accuracy
   */
  static fuse(readings: Array<{ value: number; weight: number }>): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const reading of readings) {
      weightedSum += reading.value * reading.weight;
      totalWeight += reading.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Fuse sensor readings using inverse variance weighting
   */
  static fuseWithVariance(readings: Array<{ value: number; variance: number }>): {
    value: number;
    variance: number;
  } {
    let sumWeightedValues = 0;
    let sumWeights = 0;

    for (const reading of readings) {
      const weight = 1 / reading.variance;
      sumWeightedValues += reading.value * weight;
      sumWeights += weight;
    }

    return {
      value: sumWeightedValues / sumWeights,
      variance: 1 / sumWeights
    };
  }
}

/**
 * Example Usage
 */
function main() {
  console.log('=== Sensor Fusion Examples ===\n');

  // Example 1: 1D Kalman Filter
  console.log('--- 1D Kalman Filter ---');
  const kf1d = new KalmanFilter1D(0, 1, 0.01, 0.1);

  console.log('Filtering noisy position measurements:');
  const truePath = [0, 1, 2, 3, 4, 5];
  const measurements = truePath.map(v => v + (Math.random() - 0.5) * 0.5);

  console.log('Measurement | Filtered | True');
  console.log('------------|----------|-----');
  for (let i = 0; i < measurements.length; i++) {
    kf1d.predict(1, 1);
    kf1d.update(measurements[i]);
    console.log(
      `${measurements[i].toFixed(3).padEnd(11)} | ${kf1d.getState().toFixed(3).padEnd(8)} | ${truePath[i]}`
    );
  }

  // Example 2: 2D Position Tracking
  console.log('\n--- 2D Kalman Filter ---');
  const kf2d = new KalmanFilter2D();

  console.log('Tracking object with noisy GPS:');
  const trajectory = [
    [0, 0], [10, 5], [20, 8], [30, 12], [40, 15]
  ];

  console.log('Measurement         | Filtered Position   | Velocity');
  console.log('--------------------|--------------------|----------');
  for (const point of trajectory) {
    // Add noise to measurement
    const noisyPoint = [
      point[0] + (Math.random() - 0.5) * 4,
      point[1] + (Math.random() - 0.5) * 4
    ];

    kf2d.predict(1);
    kf2d.update(noisyPoint);

    const pos = kf2d.getPosition();
    const vel = kf2d.getVelocity();

    console.log(
      `[${noisyPoint[0].toFixed(1)}, ${noisyPoint[1].toFixed(1)}]`.padEnd(20) +
      `| [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}]`.padEnd(19) +
      `| [${vel.vx.toFixed(2)}, ${vel.vy.toFixed(2)}]`
    );
  }

  // Example 3: Complementary Filter for IMU
  console.log('\n--- Complementary Filter (IMU) ---');
  const compFilter = new ComplementaryFilter(0.98);

  console.log('Fusing accelerometer and gyroscope:');
  const imuData: IMUSensorData[] = [
    {
      accelerometer: { x: 0, y: 0, z: 9.81 },
      gyroscope: { x: 0.1, y: 0.05, z: 0.02 },
      magnetometer: { x: 1, y: 0, z: 0 },
      timestamp: 0
    },
    {
      accelerometer: { x: 1.5, y: 0.5, z: 9.5 },
      gyroscope: { x: 0.15, y: 0.08, z: 0.03 },
      magnetometer: { x: 0.98, y: 0.1, z: 0 },
      timestamp: 100
    },
    {
      accelerometer: { x: 2.0, y: 1.0, z: 9.0 },
      gyroscope: { x: 0.12, y: 0.1, z: 0.04 },
      magnetometer: { x: 0.95, y: 0.15, z: 0 },
      timestamp: 200
    }
  ];

  console.log('Time | Roll   | Pitch  | Yaw    (radians)');
  console.log('-----|--------|--------|--------');
  for (let i = 0; i < imuData.length; i++) {
    const dt = i > 0 ? (imuData[i].timestamp - imuData[i - 1].timestamp) / 1000 : 0.01;
    const orientation = compFilter.update(imuData[i], dt);

    console.log(
      `${imuData[i].timestamp.toString().padEnd(4)} | ` +
      `${orientation.x.toFixed(4)} | ${orientation.y.toFixed(4)} | ${orientation.z.toFixed(4)}`
    );
  }

  // Example 4: Weighted Sensor Fusion
  console.log('\n--- Weighted Sensor Fusion ---');
  const sensorReadings = [
    { value: 10.5, weight: 0.8 }, // High confidence sensor
    { value: 11.2, weight: 0.5 }, // Medium confidence
    { value: 9.8, weight: 0.3 }   // Low confidence
  ];

  const fusedValue = WeightedSensorFusion.fuse(sensorReadings);
  console.log('Sensor readings:', sensorReadings);
  console.log('Fused value:', fusedValue.toFixed(3));

  // Example 5: Variance-based fusion
  console.log('\n--- Variance-based Fusion ---');
  const varianceReadings = [
    { value: 25.0, variance: 0.5 },  // Low variance = high confidence
    { value: 26.0, variance: 2.0 },  // High variance = low confidence
    { value: 24.5, variance: 0.8 }
  ];

  const fusedReading = WeightedSensorFusion.fuseWithVariance(varianceReadings);
  console.log('Readings with variance:', varianceReadings);
  console.log('Fused result:', {
    value: fusedReading.value.toFixed(3),
    variance: fusedReading.variance.toFixed(3),
    stdDev: Math.sqrt(fusedReading.variance).toFixed(3)
  });

  console.log('\n=== Examples Complete ===');
}

// Run examples
if (require.main === module) {
  main();
}

export {
  KalmanFilter1D,
  KalmanFilter2D,
  ComplementaryFilter,
  SensorFusionSystem,
  WeightedSensorFusion,
  type IMUSensorData,
  type FusedState
};
