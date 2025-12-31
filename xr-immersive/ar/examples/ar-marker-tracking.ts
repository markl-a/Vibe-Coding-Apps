/**
 * AR Marker Tracking Example
 *
 * This example demonstrates how to track AR markers (image targets) using WebXR.
 * Includes marker detection, tracking, and placing content relative to markers.
 */

import * as THREE from 'three';

export interface MarkerConfig {
  name: string;
  imageUrl: string;
  physicalWidth: number; // Width in meters
}

export interface TrackedMarker {
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  scale: THREE.Vector3;
  lastSeen: number;
  confidence: number;
}

export class ARMarkerTracking {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private markers: Map<string, MarkerConfig> = new Map();
  private trackedMarkers: Map<string, TrackedMarker> = new Map();
  private markerMeshes: Map<string, THREE.Group> = new Map();
  private imageTrackingSpace: XRReferenceSpace | null = null;
  private trackingLostTimeout: number = 2000; // ms

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;
  }

  /**
   * Add a marker to track
   */
  public async addMarker(config: MarkerConfig): Promise<void> {
    this.markers.set(config.name, config);
    console.log(`Added marker: ${config.name}`);

    // Create visualization for this marker
    const markerGroup = this.createMarkerVisualization(config);
    markerGroup.visible = false;
    this.scene.add(markerGroup);
    this.markerMeshes.set(config.name, markerGroup);
  }

  /**
   * Remove a marker
   */
  public removeMarker(name: string): void {
    this.markers.delete(name);
    this.trackedMarkers.delete(name);

    const mesh = this.markerMeshes.get(name);
    if (mesh) {
      this.scene.remove(mesh);
      this.markerMeshes.delete(name);
    }
  }

  /**
   * Create visualization content for a marker
   */
  private createMarkerVisualization(config: MarkerConfig): THREE.Group {
    const group = new THREE.Group();

    // Add coordinate axes for debugging
    const axesHelper = new THREE.AxesHelper(config.physicalWidth / 2);
    group.add(axesHelper);

    // Add a semi-transparent plane showing the marker outline
    const planeGeometry = new THREE.PlaneGeometry(
      config.physicalWidth,
      config.physicalWidth
    );
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    group.add(plane);

    // Add a 3D model or content above the marker
    const cubeGeometry = new THREE.BoxGeometry(
      config.physicalWidth * 0.3,
      config.physicalWidth * 0.3,
      config.physicalWidth * 0.3
    );
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.5,
      metalness: 0.5,
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.y = config.physicalWidth * 0.3;
    cube.castShadow = true;
    group.add(cube);

    // Add a text label
    this.addTextLabel(group, config.name, config.physicalWidth * 0.5);

    return group;
  }

  /**
   * Add a simple text label using canvas texture
   */
  private addTextLabel(group: THREE.Group, text: string, height: number): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 128;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000000';
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const geometry = new THREE.PlaneGeometry(0.4, 0.1);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height;
    group.add(mesh);
  }

  /**
   * Initialize image tracking with WebXR
   */
  public async initializeImageTracking(session: XRSession): Promise<void> {
    // Check if image tracking is supported
    if (!session.enabledFeatures?.includes('image-tracking')) {
      console.warn('Image tracking not available');
      return;
    }

    // Create tracked images array for session
    const trackedImages: XRTrackedImageInit[] = [];

    for (const [name, config] of this.markers) {
      try {
        const image = await this.loadImage(config.imageUrl);
        trackedImages.push({
          image: image,
          widthInMeters: config.physicalWidth,
        });
      } catch (error) {
        console.error(`Failed to load marker image: ${name}`, error);
      }
    }

    console.log(`Initialized tracking for ${trackedImages.length} markers`);
  }

  /**
   * Load an image for tracking
   */
  private async loadImage(url: string): Promise<ImageBitmap> {
    const response = await fetch(url);
    const blob = await response.blob();
    return await createImageBitmap(blob);
  }

  /**
   * Update marker tracking (call in animation loop)
   */
  public update(frame: XRFrame, referenceSpace: XRReferenceSpace): void {
    if (!frame || !referenceSpace) return;

    const results = frame.getImageTrackingResults?.();
    if (!results) return;

    const now = Date.now();

    // Update tracked markers
    results.forEach((result: XRImageTrackingResult, index: number) => {
      const markerName = Array.from(this.markers.keys())[result.index];
      if (!markerName) return;

      if (result.trackingState === 'tracked') {
        const pose = frame.getPose(result.imageSpace, referenceSpace);
        if (pose) {
          // Update tracked marker data
          const position = new THREE.Vector3();
          const rotation = new THREE.Quaternion();
          const scale = new THREE.Vector3();

          const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
          matrix.decompose(position, rotation, scale);

          this.trackedMarkers.set(markerName, {
            name: markerName,
            position,
            rotation,
            scale,
            lastSeen: now,
            confidence: 1.0, // WebXR doesn't provide confidence, assume 1.0 when tracked
          });

          // Update visualization
          const markerMesh = this.markerMeshes.get(markerName);
          if (markerMesh) {
            markerMesh.position.copy(position);
            markerMesh.quaternion.copy(rotation);
            markerMesh.visible = true;

            // Animate the cube
            const cube = markerMesh.children.find(
              (child) => child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry
            ) as THREE.Mesh;
            if (cube) {
              cube.rotation.y += 0.02;
            }
          }

          this.onMarkerFound(markerName, position, rotation);
        }
      } else {
        this.onMarkerLost(markerName);
      }
    });

    // Check for markers that haven't been seen recently
    this.trackedMarkers.forEach((marker, name) => {
      if (now - marker.lastSeen > this.trackingLostTimeout) {
        this.trackedMarkers.delete(name);
        const markerMesh = this.markerMeshes.get(name);
        if (markerMesh) {
          markerMesh.visible = false;
        }
      }
    });
  }

  /**
   * Called when a marker is found
   */
  private onMarkerFound(
    name: string,
    position: THREE.Vector3,
    rotation: THREE.Quaternion
  ): void {
    // Check if this is a new detection
    const existing = this.trackedMarkers.get(name);
    if (!existing || Date.now() - existing.lastSeen > this.trackingLostTimeout) {
      console.log(`Marker found: ${name} at position:`, position);
      this.triggerMarkerFoundEvent(name, position, rotation);
    }
  }

  /**
   * Called when a marker is lost
   */
  private onMarkerLost(name: string): void {
    const marker = this.trackedMarkers.get(name);
    if (marker && Date.now() - marker.lastSeen < this.trackingLostTimeout) {
      console.log(`Marker lost: ${name}`);
      this.triggerMarkerLostEvent(name);
    }
  }

  /**
   * Trigger custom marker found event
   */
  private triggerMarkerFoundEvent(
    name: string,
    position: THREE.Vector3,
    rotation: THREE.Quaternion
  ): void {
    const event = new CustomEvent('markerFound', {
      detail: { name, position, rotation },
    });
    window.dispatchEvent(event);
  }

  /**
   * Trigger custom marker lost event
   */
  private triggerMarkerLostEvent(name: string): void {
    const event = new CustomEvent('markerLost', {
      detail: { name },
    });
    window.dispatchEvent(event);
  }

  /**
   * Get tracked marker by name
   */
  public getTrackedMarker(name: string): TrackedMarker | undefined {
    return this.trackedMarkers.get(name);
  }

  /**
   * Get all tracked markers
   */
  public getAllTrackedMarkers(): TrackedMarker[] {
    return Array.from(this.trackedMarkers.values());
  }

  /**
   * Check if a marker is currently tracked
   */
  public isMarkerTracked(name: string): boolean {
    const marker = this.trackedMarkers.get(name);
    if (!marker) return false;
    return Date.now() - marker.lastSeen < this.trackingLostTimeout;
  }

  /**
   * Add custom content to a marker
   */
  public addContentToMarker(name: string, object: THREE.Object3D): void {
    const markerMesh = this.markerMeshes.get(name);
    if (markerMesh) {
      markerMesh.add(object);
    }
  }

  /**
   * Remove custom content from a marker
   */
  public removeContentFromMarker(name: string, object: THREE.Object3D): void {
    const markerMesh = this.markerMeshes.get(name);
    if (markerMesh) {
      markerMesh.remove(object);
    }
  }

  /**
   * Set tracking lost timeout
   */
  public setTrackingLostTimeout(timeout: number): void {
    this.trackingLostTimeout = timeout;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.markerMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
    });

    this.markers.clear();
    this.trackedMarkers.clear();
    this.markerMeshes.clear();
  }
}

// Usage example
export async function initARMarkerTracking(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
): Promise<ARMarkerTracking> {
  const tracking = new ARMarkerTracking(scene, renderer);

  // Add sample markers
  await tracking.addMarker({
    name: 'marker1',
    imageUrl: '/markers/marker1.png',
    physicalWidth: 0.1, // 10cm
  });

  await tracking.addMarker({
    name: 'marker2',
    imageUrl: '/markers/marker2.png',
    physicalWidth: 0.15, // 15cm
  });

  // Listen for marker events
  window.addEventListener('markerFound', ((event: CustomEvent) => {
    console.log('Marker detected:', event.detail.name);
  }) as EventListener);

  window.addEventListener('markerLost', ((event: CustomEvent) => {
    console.log('Marker lost:', event.detail.name);
  }) as EventListener);

  return tracking;
}
