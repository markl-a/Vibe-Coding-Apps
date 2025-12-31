/**
 * Drone Simulator Example
 *
 * Demonstrates:
 * - Arming and takeoff
 * - Waypoint navigation
 * - Battery monitoring
 * - Return to home
 */

import { DroneController, type FlightPlan } from './index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Drone Simulator Example');
  console.log('='.repeat(60));

  // Create drone controller
  const drone = new DroneController({
    mass: 1.5,
    maxSpeed: 10,
    maxAltitude: 100,
  });

  // Register event handlers
  drone.onEvent((event) => {
    switch (event.type) {
      case 'armed':
        console.log('🔓 Drone armed');
        break;
      case 'disarmed':
        console.log('🔒 Drone disarmed');
        break;
      case 'takeoff_complete':
        console.log(`🛫 Takeoff complete at ${event.altitude.toFixed(1)}m`);
        break;
      case 'landing_complete':
        console.log('🛬 Landing complete');
        break;
      case 'waypoint_reached':
        console.log(`📍 Waypoint ${event.index + 1} reached`);
        break;
      case 'mission_complete':
        console.log('✅ Mission complete!');
        break;
      case 'low_battery':
        console.log(`🔋 Low battery warning: ${event.level.toFixed(1)}%`);
        break;
      case 'emergency':
        console.log(`🚨 EMERGENCY: ${event.reason}`);
        break;
    }
  });

  // Define a flight plan
  const missionPlan: FlightPlan = {
    name: 'Survey Mission',
    waypoints: [
      { position: { x: 0, y: 0, z: 20 }, speed: 5, holdTime: 2 },
      { position: { x: 50, y: 0, z: 20 }, speed: 5, holdTime: 2, action: 'photo' },
      { position: { x: 50, y: 50, z: 20 }, speed: 5, holdTime: 2, action: 'photo' },
      { position: { x: 0, y: 50, z: 20 }, speed: 5, holdTime: 2, action: 'photo' },
      { position: { x: 0, y: 0, z: 20 }, speed: 5, holdTime: 1 },
    ],
    returnToHome: true,
    maxAltitude: 50,
    geofenceRadius: 100,
  };

  console.log('\n📋 Mission Plan:', missionPlan.name);
  console.log(`   Waypoints: ${missionPlan.waypoints.length}`);

  // Arm drone
  console.log('\n⚡ Arming drone...');
  drone.arm();

  // Takeoff
  console.log('🚀 Taking off...');
  drone.takeoff(20);

  // Simulation loop
  const deltaTime = 0.016; // 60 FPS
  let simTime = 0;
  let lastPrintTime = 0;
  let missionStarted = false;

  while (simTime < 300) { // Max 5 minutes simulation
    const telemetry = drone.update(deltaTime);
    simTime += deltaTime;

    // Start mission after takeoff
    if (!missionStarted && telemetry.state.flightMode === 'hover') {
      console.log('\n🎯 Starting mission...');
      drone.executePlan(missionPlan);
      missionStarted = true;
    }

    // Print status every 5 seconds
    if (simTime - lastPrintTime >= 5) {
      lastPrintTime = simTime;
      const pos = telemetry.state.position;
      const speed = Math.sqrt(
        telemetry.state.velocity.x ** 2 +
        telemetry.state.velocity.y ** 2 +
        telemetry.state.velocity.z ** 2
      );

      console.log(
        `[${simTime.toFixed(0)}s] ` +
        `Pos: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}) ` +
        `Speed: ${speed.toFixed(1)} m/s ` +
        `Battery: ${telemetry.state.batteryLevel.toFixed(1)}% ` +
        `Mode: ${telemetry.state.flightMode}`
      );
    }

    // Check if mission ended
    if (
      missionStarted &&
      telemetry.state.flightMode === 'hover' &&
      telemetry.currentWaypointIndex >= missionPlan.waypoints.length
    ) {
      console.log('\n🏠 Returning home...');
      drone.returnToHome();
      missionStarted = false; // Prevent re-triggering
    }

    // Check if landed
    if (!telemetry.state.isArmed && simTime > 10) {
      break;
    }
  }

  // Final stats
  const finalTelemetry = drone.getTelemetry();
  console.log('\n' + '='.repeat(60));
  console.log('📊 Flight Statistics');
  console.log('='.repeat(60));
  console.log(`Flight time: ${finalTelemetry.flightTime.toFixed(1)} seconds`);
  console.log(`Distance traveled: ${finalTelemetry.distanceTraveled.toFixed(1)} meters`);
  console.log(`Battery remaining: ${finalTelemetry.state.batteryLevel.toFixed(1)}%`);
  console.log('='.repeat(60));
}

main().catch(console.error);
