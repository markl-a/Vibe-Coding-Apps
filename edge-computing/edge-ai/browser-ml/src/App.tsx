import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useImageClassifier,
  useObjectDetector,
  useWebcam,
  type Detection,
} from './hooks';

type Mode = 'classification' | 'detection';

export default function App() {
  const [mode, setMode] = useState<Mode>('classification');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fps, setFps] = useState(0);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const classifier = useImageClassifier();
  const detector = useObjectDetector();
  const webcam = useWebcam();

  // Load models on mount
  useEffect(() => {
    if (mode === 'classification') {
      classifier.loadModel();
    } else {
      detector.loadModel();
    }
  }, [mode, classifier.loadModel, detector.loadModel]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  // Process uploaded image
  const processImage = async () => {
    if (!imageRef.current) return;

    setIsProcessing(true);
    try {
      if (mode === 'classification') {
        await classifier.classify(imageRef.current);
      } else {
        await detector.detect(imageRef.current);
        drawDetections(detector.detections);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Draw detection boxes
  const drawDetections = useCallback((detections: Detection[]) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((det) => {
      const [x, y, width, height] = det.bbox;

      // Draw box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      const label = `${det.class} ${(det.score * 100).toFixed(0)}%`;
      ctx.font = 'bold 16px sans-serif';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x, y - 24, textWidth + 8, 24);

      // Draw label text
      ctx.fillStyle = '#000';
      ctx.fillText(label, x + 4, y - 6);
    });
  }, []);

  // Real-time detection loop
  const startRealtimeDetection = useCallback(async () => {
    if (!webcam.videoRef.current || !detector.isModelReady) return;

    let lastTime = performance.now();
    let frameCount = 0;

    const detectFrame = async () => {
      if (!webcam.isActive || !webcam.videoRef.current) return;

      await detector.detect(webcam.videoRef.current);

      // Calculate FPS
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      animationRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();
  }, [webcam, detector]);

  // Stop detection loop
  const stopRealtimeDetection = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setFps(0);
  }, []);

  // Handle webcam toggle
  const toggleWebcam = async () => {
    if (webcam.isActive) {
      stopRealtimeDetection();
      webcam.stop();
    } else {
      await webcam.start();
      if (mode === 'detection') {
        startRealtimeDetection();
      }
    }
  };

  const isModelReady = mode === 'classification' ? classifier.isModelReady : detector.isModelReady;
  const isLoading = mode === 'classification' ? classifier.isLoading : detector.isLoading;
  const error = mode === 'classification' ? classifier.error : detector.error;
  const inferenceTime = mode === 'classification' ? classifier.inferenceTime : detector.inferenceTime;

  return (
    <div className="app">
      <header className="header">
        <h1>Browser ML</h1>
        <p>Edge AI with TensorFlow.js - Run ML models locally in your browser</p>
      </header>

      {/* Mode tabs */}
      <div className="tabs">
        <button
          className={`tab ${mode === 'classification' ? 'active' : ''}`}
          onClick={() => setMode('classification')}
        >
          Image Classification
        </button>
        <button
          className={`tab ${mode === 'detection' ? 'active' : ''}`}
          onClick={() => setMode('detection')}
        >
          Object Detection
        </button>
      </div>

      {/* Status card */}
      <div className="card">
        <h2>Model Status</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="status-badge">
            <div className={`status-dot ${isModelReady ? 'ready' : 'loading'}`} />
            {isLoading ? 'Loading model...' : isModelReady ? 'Ready' : 'Not loaded'}
          </div>
          {isModelReady && (
            <div className="status-badge">
              Model: {mode === 'classification' ? 'MobileNet v2' : 'COCO-SSD'}
            </div>
          )}
        </div>
        {error && (
          <div style={{ color: '#ff5252', marginTop: '0.5rem' }}>{error}</div>
        )}
      </div>

      {/* Main content */}
      <div className="card">
        <h2>{mode === 'classification' ? 'Image Classification' : 'Object Detection'}</h2>

        {/* Upload zone */}
        {!webcam.isActive && !imageUrl && (
          <label
            className="upload-zone"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="upload-icon">📷</div>
            <p>Drop an image here or click to upload</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        )}

        {/* Image preview */}
        {imageUrl && !webcam.isActive && (
          <div className="preview-container">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Preview"
              className="preview-image"
              onLoad={processImage}
              crossOrigin="anonymous"
            />
            {mode === 'detection' && (
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  maxWidth: '100%',
                  maxHeight: '400px',
                }}
              />
            )}
          </div>
        )}

        {/* Webcam view */}
        {webcam.isActive && (
          <div className="webcam-container">
            <video
              ref={webcam.videoRef}
              className="webcam-video"
              playsInline
              muted
            />
            {mode === 'detection' && detector.detections.length > 0 && (
              <div className="detection-overlay">
                {detector.detections.map((det, i) => {
                  const video = webcam.videoRef.current;
                  if (!video) return null;

                  const scaleX = video.clientWidth / video.videoWidth;
                  const scaleY = video.clientHeight / video.videoHeight;

                  return (
                    <div
                      key={i}
                      className="detection-box"
                      style={{
                        left: det.bbox[0] * scaleX,
                        top: det.bbox[1] * scaleY,
                        width: det.bbox[2] * scaleX,
                        height: det.bbox[3] * scaleY,
                      }}
                    >
                      <span className="detection-label">
                        {det.class} {(det.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="controls">
          <button
            className="btn btn-primary"
            onClick={toggleWebcam}
            disabled={!isModelReady}
          >
            {webcam.isActive ? '⏹ Stop Camera' : '📹 Use Camera'}
          </button>
          {imageUrl && !webcam.isActive && (
            <button
              className="btn btn-secondary"
              onClick={() => setImageUrl(null)}
            >
              Clear
            </button>
          )}
        </div>

        {webcam.error && (
          <div style={{ color: '#ff5252', marginTop: '1rem', textAlign: 'center' }}>
            {webcam.error}
          </div>
        )}
      </div>

      {/* Results */}
      {(classifier.classifications.length > 0 || detector.detections.length > 0) && (
        <div className="card">
          <h2>Results</h2>

          {mode === 'classification' && (
            <div className="results">
              <h3>Top Predictions</h3>
              {classifier.classifications.map((c, i) => (
                <div key={i} className="result-item">
                  <span className="result-label">{c.className}</span>
                  <div className="result-bar">
                    <div
                      className="result-bar-fill"
                      style={{ width: `${c.probability * 100}%` }}
                    />
                  </div>
                  <span className="result-score">
                    {(c.probability * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {mode === 'detection' && (
            <div className="results">
              <h3>Detected Objects ({detector.detections.length})</h3>
              {detector.detections.map((d, i) => (
                <div key={i} className="result-item">
                  <span className="result-label">{d.class}</span>
                  <div className="result-bar">
                    <div
                      className="result-bar-fill"
                      style={{ width: `${d.score * 100}%` }}
                    />
                  </div>
                  <span className="result-score">
                    {(d.score * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="stats">
            <div className="stat-card">
              <div className="stat-value">{inferenceTime}ms</div>
              <div className="stat-label">Inference Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {mode === 'classification'
                  ? classifier.classifications.length
                  : detector.detections.length}
              </div>
              <div className="stat-label">
                {mode === 'classification' ? 'Predictions' : 'Objects'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{webcam.isActive ? `${fps} FPS` : 'N/A'}</div>
              <div className="stat-label">Frame Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card">
        <h2>About Edge AI</h2>
        <p style={{ color: '#888', lineHeight: 1.6 }}>
          This demo runs machine learning models entirely in your browser using TensorFlow.js.
          No data is sent to any server - all processing happens locally on your device.
          This is an example of &quot;Edge AI&quot; where inference runs at the edge (your browser)
          rather than in the cloud.
        </p>
        <ul style={{ color: '#888', marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li>MobileNet: Image classification with 1000+ categories</li>
          <li>COCO-SSD: Object detection with 80 object types</li>
          <li>WebGL acceleration for faster inference</li>
          <li>Works offline after initial model download</li>
        </ul>
      </div>
    </div>
  );
}
