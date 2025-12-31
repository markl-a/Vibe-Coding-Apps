import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Webcam Hook
 *
 * Provides access to the device camera for real-time video processing.
 */

export interface UseWebcamReturn {
  isActive: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  start: () => Promise<void>;
  stop: () => void;
}

export function useWebcam(): UseWebcamReturn {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (streamRef.current) return;

    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err) {
      let message = 'Failed to access camera';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          message = 'Camera access denied. Please allow camera permissions.';
        } else if (err.name === 'NotFoundError') {
          message = 'No camera found on this device.';
        } else {
          message = err.message;
        }
      }
      setError(message);
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isActive,
    error,
    videoRef,
    start,
    stop,
  };
}
