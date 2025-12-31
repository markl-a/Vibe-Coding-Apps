import { useState, useCallback, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

/**
 * Image Classification Hook
 *
 * Uses MobileNet for image classification in the browser.
 * Runs entirely on the client - no server required.
 */

export interface Classification {
  className: string;
  probability: number;
}

export interface UseImageClassifierReturn {
  isLoading: boolean;
  isModelReady: boolean;
  error: string | null;
  classifications: Classification[];
  inferenceTime: number;
  classify: (imageElement: HTMLImageElement | HTMLVideoElement) => Promise<Classification[]>;
  loadModel: () => Promise<void>;
}

export function useImageClassifier(): UseImageClassifierReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [inferenceTime, setInferenceTime] = useState(0);

  const modelRef = useRef<mobilenet.MobileNet | null>(null);

  // Load the MobileNet model
  const loadModel = useCallback(async () => {
    if (modelRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[MobileNet] Loading model...');

      // Ensure TensorFlow.js backend is ready
      await tf.ready();
      console.log(`[TensorFlow.js] Backend: ${tf.getBackend()}`);

      // Load MobileNet model
      const model = await mobilenet.load({
        version: 2,
        alpha: 1.0,
      });

      modelRef.current = model;
      setIsModelReady(true);
      console.log('[MobileNet] Model loaded successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load model';
      setError(message);
      console.error('[MobileNet] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Classify an image
  const classify = useCallback(
    async (imageElement: HTMLImageElement | HTMLVideoElement): Promise<Classification[]> => {
      if (!modelRef.current) {
        throw new Error('Model not loaded');
      }

      const startTime = performance.now();

      try {
        // Run inference
        const predictions = await modelRef.current.classify(imageElement, 5);

        const endTime = performance.now();
        setInferenceTime(Math.round(endTime - startTime));

        // Format results
        const results: Classification[] = predictions.map((p) => ({
          className: p.className,
          probability: p.probability,
        }));

        setClassifications(results);
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Classification failed';
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
    classifications,
    inferenceTime,
    classify,
    loadModel,
  };
}
