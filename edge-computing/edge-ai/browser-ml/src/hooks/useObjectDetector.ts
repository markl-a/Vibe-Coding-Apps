import { useState, useCallback, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

/**
 * Object Detection Hook
 *
 * Uses COCO-SSD for real-time object detection in the browser.
 * Supports continuous detection from video streams.
 */

export interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

export interface UseObjectDetectorReturn {
  isLoading: boolean;
  isModelReady: boolean;
  error: string | null;
  detections: Detection[];
  inferenceTime: number;
  detect: (imageElement: HTMLImageElement | HTMLVideoElement) => Promise<Detection[]>;
  loadModel: () => Promise<void>;
}

export function useObjectDetector(): UseObjectDetectorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [inferenceTime, setInferenceTime] = useState(0);

  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);

  // Load the COCO-SSD model
  const loadModel = useCallback(async () => {
    if (modelRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[COCO-SSD] Loading model...');

      // Ensure TensorFlow.js backend is ready
      await tf.ready();
      console.log(`[TensorFlow.js] Backend: ${tf.getBackend()}`);

      // Load COCO-SSD model
      const model = await cocoSsd.load({
        base: 'mobilenet_v2',
      });

      modelRef.current = model;
      setIsModelReady(true);
      console.log('[COCO-SSD] Model loaded successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load model';
      setError(message);
      console.error('[COCO-SSD] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Detect objects in an image or video frame
  const detect = useCallback(
    async (imageElement: HTMLImageElement | HTMLVideoElement): Promise<Detection[]> => {
      if (!modelRef.current) {
        throw new Error('Model not loaded');
      }

      const startTime = performance.now();

      try {
        // Run detection
        const predictions = await modelRef.current.detect(imageElement, 20, 0.3);

        const endTime = performance.now();
        setInferenceTime(Math.round(endTime - startTime));

        // Format results
        const results: Detection[] = predictions.map((p) => ({
          bbox: p.bbox as [number, number, number, number],
          class: p.class,
          score: p.score,
        }));

        setDetections(results);
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Detection failed';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // TensorFlow.js handles cleanup automatically
    };
  }, []);

  return {
    isLoading,
    isModelReady,
    error,
    detections,
    inferenceTime,
    detect,
    loadModel,
  };
}
