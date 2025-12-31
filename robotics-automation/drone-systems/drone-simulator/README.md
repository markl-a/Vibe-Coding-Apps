# Drone Flight Simulator

A physics-based drone flight controller simulator with waypoint navigation, PID control, and safety features.

## Features

- **Physics Engine**: Realistic flight dynamics with gravity, thrust, drag, and wind
- **PID Control**: Smooth position and altitude control
- **Waypoint Navigation**: Autonomous flight path execution
- **Safety Systems**: Battery monitoring, geofencing, return-to-home
- **Event System**: Real-time flight event notifications

## Quick Start

```bash
pnpm install
pnpm example
```

## Usage

### Basic Flight

```typescript
import { DroneController } from '@vibe/drone-simulator';

const drone = new DroneController({
  mass: 1.5,
  maxSpeed: 15,
  maxAltitude: 120,
});

// Register event handlers
drone.onEvent((event) => {
  console.log('Event:', event.type);
});

// Arm and takeoff
drone.arm();
drone.takeoff(20); // 20 meters altitude

// Simulation loop
setInterval(() => {
  const telemetry = drone.update(0.016); // 60 FPS
  console.log('Position:', telemetry.state.position);
}, 16);
```

### Waypoint Mission

```typescript
import { DroneController, type FlightPlan } from '@vibe/drone-simulator';

const drone = new DroneController();

const mission: FlightPlan = {
  name: 'Survey Mission',
  waypoints: [
    { position: { x: 0, y: 0, z: 20 }, speed: 5, holdTime: 2 },
    { position: { x: 100, y: 0, z: 20 }, speed: 5, holdTime: 2, action: 'photo' },
    { position: { x: 100, y: 100, z: 20 }, speed: 5, holdTime: 2, action: 'photo' },
    { position: { x: 0, y: 0, z: 20 }, speed: 5, holdTime: 0 },
  ],
  returnToHome: true,
  maxAltitude: 50,
  geofenceRadius: 200,
};

drone.arm();
drone.takeoff(20);

// After takeoff completes
drone.executePlan(mission);
```

### Wind Simulation

```typescript
// Add wind effect
drone.setWind({ x: 5, y: 2, z: 0 }); // 5 m/s wind from west
```

## API Reference

### DroneController

| Method | Description |
|--------|-------------|
| `arm()` | Arm the drone for flight |
| `disarm()` | Disarm the drone |
| `takeoff(altitude)` | Take off to specified altitude |
| `land()` | Land at current position |
| `returnToHome()` | Return to home position |
| `executePlan(plan)` | Execute a flight plan |
| `emergency()` | Emergency stop |
| `update(deltaTime)` | Update simulation, returns telemetry |
| `onEvent(handler)` | Register event handler |
| `setWind(velocity)` | Set wind velocity |

### Flight Modes

| Mode | Description |
|------|-------------|
| `idle` | Drone is disarmed |
| `takeoff` | Ascending to target altitude |
| `hover` | Maintaining position |
| `waypoint` | Following flight plan |
| `return_home` | Returning to home position |
| `landing` | Descending to ground |
| `emergency` | Emergency stop |

### Events

| Event | Data |
|-------|------|
| `armed` | - |
| `disarmed` | - |
| `takeoff_complete` | `{ altitude: number }` |
| `landing_complete` | - |
| `waypoint_reached` | `{ index: number, waypoint: Waypoint }` |
| `mission_complete` | - |
| `low_battery` | `{ level: number }` |
| `geofence_breach` | `{ position: Vector3 }` |
| `emergency` | `{ reason: string }` |

### Configuration

```typescript
interface DroneConfig {
  mass: number;              // kg (default: 1.5)
  maxThrust: number;         // N (default: 30)
  maxSpeed: number;          // m/s (default: 15)
  maxAcceleration: number;   // m/s² (default: 5)
  maxAltitude: number;       // m (default: 120)
  batteryCapacity: number;   // mAh (default: 5000)
  hoverPowerConsumption: number;    // mA (default: 500)
  movementPowerConsumption: number; // mA per m/s (default: 100)
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DroneController                          │
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │ Flight Mode  │  │  PID Control  │  │   Safety     │    │
│  │  Manager     │──│   System      │──│   Monitor    │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
│         │                 │                   │            │
│         ▼                 ▼                   ▼            │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │   Waypoint   │  │   Control     │  │   Battery    │    │
│  │  Navigator   │  │   Inputs      │  │   Monitor    │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
│                           │                                │
│                           ▼                                │
│                   ┌───────────────┐                       │
│                   │ Physics Engine│                       │
│                   │ - Gravity     │                       │
│                   │ - Thrust      │                       │
│                   │ - Drag        │                       │
│                   │ - Wind        │                       │
│                   └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Physics Model

The simulator uses a simplified quadcopter physics model:

- **Gravity**: Constant 9.81 m/s² downward
- **Thrust**: Proportional to throttle, directed by orientation
- **Drag**: Proportional to velocity squared
- **Wind**: External force applied to the drone

## Safety Features

1. **Low Battery Warning**: Alert at 20% battery
2. **Critical Battery RTH**: Auto return-to-home at 10%
3. **Geofence**: Prevents flying beyond specified radius
4. **Max Altitude**: Limits maximum flight height

## Resources

- [PID Control](https://en.wikipedia.org/wiki/PID_controller)
- [Quadcopter Dynamics](https://www.kth.se/polopoly_fs/1.588039.1550155544!/Thesis%20KTH%20-%20Francesco%20Sabatino.pdf)
- [MAVLink Protocol](https://mavlink.io/)
- [ArduPilot](https://ardupilot.org/)

## License

MIT
