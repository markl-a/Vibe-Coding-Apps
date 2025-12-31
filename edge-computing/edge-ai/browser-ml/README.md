# Browser ML - Edge AI Demo

Run machine learning models directly in your browser using TensorFlow.js. No server required - all inference happens locally on your device.

## Features

- **Image Classification**: Identify objects in images using MobileNet
- **Object Detection**: Detect and locate objects using COCO-SSD
- **Real-time Camera**: Live detection from your webcam
- **Privacy-First**: All processing happens locally
- **WebGL Acceleration**: Uses GPU for faster inference

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 in your browser.

## Models

### MobileNet (Image Classification)
- Pre-trained on ImageNet (1000+ categories)
- Fast inference (~50-200ms)
- Good for: General image classification

### COCO-SSD (Object Detection)
- Pre-trained on COCO dataset (80 object types)
- Returns bounding boxes and labels
- Good for: Multi-object detection

## Usage

### Image Classification Hook

```typescript
import { useImageClassifier } from './hooks';

function MyComponent() {
  const { isModelReady, classify, classifications, loadModel } = useImageClassifier();

  useEffect(() => {
    loadModel();
  }, []);

  const handleClassify = async (imageElement: HTMLImageElement) => {
    const results = await classify(imageElement);
    console.log(results);
    // [{ className: 'golden retriever', probability: 0.95 }, ...]
  };
}
```

### Object Detection Hook

```typescript
import { useObjectDetector } from './hooks';

function MyComponent() {
  const { isModelReady, detect, detections, loadModel } = useObjectDetector();

  useEffect(() => {
    loadModel();
  }, []);

  const handleDetect = async (imageElement: HTMLImageElement) => {
    const results = await detect(imageElement);
    console.log(results);
    // [{ bbox: [x, y, width, height], class: 'person', score: 0.92 }, ...]
  };
}
```

### Webcam Hook

```typescript
import { useWebcam } from './hooks';

function MyComponent() {
  const { isActive, videoRef, start, stop } = useWebcam();

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
      <button onClick={isActive ? stop : start}>
        {isActive ? 'Stop' : 'Start'} Camera
      </button>
    </div>
  );
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    React     │  │ TensorFlow.js│  │   WebGL      │      │
│  │    App       │──│    Model     │──│   Backend    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
│         ▼                 ▼                  ▼              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Webcam/    │  │  MobileNet/  │  │     GPU      │      │
│  │   Image      │  │  COCO-SSD    │  │  Acceleration│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│                    No Server Required!                       │
└─────────────────────────────────────────────────────────────┘
```

## Performance Tips

1. **Use WebGL Backend**: TensorFlow.js automatically uses WebGL when available
2. **Reduce Input Size**: Smaller images = faster inference
3. **Batch Processing**: Process multiple images together when possible
4. **Model Caching**: Models are cached in IndexedDB after first download

## Detected Objects (COCO-SSD)

The model can detect 80 object types including:
- **People**: person
- **Vehicles**: bicycle, car, motorcycle, airplane, bus, train, truck, boat
- **Animals**: bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe
- **Objects**: traffic light, fire hydrant, stop sign, bench, backpack, umbrella, handbag
- **Sports**: frisbee, skis, snowboard, sports ball, kite, baseball bat/glove, skateboard
- **Furniture**: chair, couch, bed, dining table
- **Electronics**: tv, laptop, mouse, remote, keyboard, cell phone
- **Kitchen**: bottle, wine glass, cup, fork, knife, spoon, bowl
- **Food**: banana, apple, sandwich, orange, broccoli, carrot, hot dog, pizza, donut, cake

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Limitations

- First load downloads models (~5-20MB)
- Performance depends on device GPU
- Some older devices may be slow

## Resources

- [TensorFlow.js](https://www.tensorflow.org/js)
- [MobileNet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet)
- [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)
- [WebGL Backend](https://www.tensorflow.org/js/guide/platform_environment)

## License

MIT
