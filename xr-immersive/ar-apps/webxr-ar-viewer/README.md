# WebXR AR Viewer

A WebXR Augmented Reality application using Three.js that allows you to place 3D objects in the real world.

## Features

- **Hit Testing**: Detect flat surfaces in the real world
- **Object Placement**: Tap to place colorful 3D cubes
- **Object Animation**: Placed objects rotate continuously
- **DOM Overlay**: UI elements visible during AR session
- **Responsive**: Works on mobile devices with AR support

## Tech Stack

- **Three.js**: 3D rendering library
- **WebXR Device API**: AR/VR browser standard
- **TypeScript**: Type-safe development
- **Vite**: Fast development server with HTTPS

## Requirements

- Android device with ARCore support, OR
- iOS device with Safari 15.4+ (limited support)
- Chrome for Android (recommended) or Samsung Internet
- Secure context (HTTPS)

## Quick Start

### Installation

```bash
pnpm install
```

### Development

```bash
# Starts HTTPS server (required for WebXR)
pnpm dev
```

Open `https://localhost:5173` on your AR-capable device.

### Production Build

```bash
pnpm build
pnpm preview
```

## How It Works

### WebXR Session

1. User taps "START AR" button
2. Browser requests `immersive-ar` session with `hit-test` feature
3. Camera feed is displayed as scene background
4. App receives pose updates each frame

### Hit Testing

1. Request hit test source from viewer reference space
2. Each frame, perform hit test to find surfaces
3. Display reticle at detected surface position
4. On tap, place object at reticle location

### Architecture

```
┌─────────────────────────────────────┐
│           WebXR Session              │
│  ┌─────────────────────────────┐    │
│  │     Hit Test Source          │    │
│  └─────────────────────────────┘    │
│              │                       │
│              ▼                       │
│  ┌─────────────────────────────┐    │
│  │     Hit Test Results         │    │
│  │   (Surface Positions)        │    │
│  └─────────────────────────────┘    │
│              │                       │
│              ▼                       │
│  ┌─────────────────────────────┐    │
│  │       Three.js Scene         │    │
│  │   • Reticle (placement)      │    │
│  │   • Placed Objects           │    │
│  │   • Lights                   │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## Code Structure

```
src/
├── main.ts        # Main application class
├── ar-button.ts   # WebXR AR session button
└── types/         # TypeScript declarations
```

## Customization

### Change the Placed Object

Edit the `createObject()` method in `main.ts`:

```typescript
private createObject(): THREE.Object3D {
  // Replace with your own 3D model
  const geometry = new THREE.SphereGeometry(0.05, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xff6600 });
  return new THREE.Mesh(geometry, material);
}
```

### Load 3D Models

```typescript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('/models/duck.glb', (gltf) => {
  this.scene.add(gltf.scene);
});
```

## Browser Support

| Browser | Platform | Status |
|---------|----------|--------|
| Chrome | Android | ✅ Full support |
| Samsung Internet | Android | ✅ Full support |
| Firefox Reality | VR/AR headsets | ✅ Full support |
| Safari | iOS | ⚠️ Limited (no hit-test) |
| Chrome | Desktop | ❌ No AR support |

## Resources

- [WebXR Device API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [Three.js WebXR Examples](https://threejs.org/examples/?q=webxr)
- [Immersive Web Developer Home](https://immersiveweb.dev/)
- [Google ARCore WebXR](https://developers.google.com/ar/develop/webxr)

## Troubleshooting

### "AR NOT SUPPORTED"

- Ensure you're using a compatible browser and device
- Check if ARCore/ARKit is installed and updated
- Make sure you're accessing via HTTPS

### Objects not appearing

- Point camera at a well-lit flat surface
- Move device slowly to allow surface detection
- Check console for WebXR errors

### Session ends unexpectedly

- Ensure camera permissions are granted
- Check for browser/OS AR conflicts
- Try clearing browser cache

## License

MIT
