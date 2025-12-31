/**
 * AR Object Placement Example
 *
 * This example demonstrates how to place and manipulate 3D objects in AR using WebXR.
 * Includes hit testing, object placement, transformation, and persistence.
 */

import * as THREE from 'three';

export interface PlacedObject {
  id: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  scale: THREE.Vector3;
  timestamp: number;
  type: string;
}

export interface PlacementOptions {
  enableGrid: boolean;
  gridSize: number;
  enableShadows: boolean;
  maxObjects: number;
}

export class ARObjectPlacement {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private options: PlacementOptions;
  private reticle: THREE.Mesh;
  private placedObjects: Map<string, PlacedObject> = new Map();
  private selectedObject: PlacedObject | null = null;
  private hitTestSource: XRHitTestSource | null = null;
  private hitTestSourceRequested: boolean = false;
  private objectLibrary: Map<string, () => THREE.Object3D> = new Map();
  private transformControls: TransformMode = 'none';

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    options: Partial<PlacementOptions> = {}
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.options = {
      enableGrid: true,
      gridSize: 0.05,
      enableShadows: true,
      maxObjects: 50,
      ...options,
    };

    this.setupReticle();
    this.setupObjectLibrary();
  }

  /**
   * Setup placement reticle (targeting indicator)
   */
  private setupReticle(): void {
    const geometry = new THREE.RingGeometry(0.08, 0.1, 32);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7,
    });

    this.reticle = new THREE.Mesh(geometry, material);
    this.reticle.visible = false;
    this.reticle.matrixAutoUpdate = false;
    this.scene.add(this.reticle);

    // Add directional indicator
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      0.15,
      0x00ff00
    );
    this.reticle.add(arrow);
  }

  /**
   * Setup library of placeable objects
   */
  private setupObjectLibrary(): void {
    // Cube
    this.objectLibrary.set('cube', () => {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.7,
        metalness: 0.3,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = this.options.enableShadows;
      mesh.receiveShadow = this.options.enableShadows;
      return mesh;
    });

    // Sphere
    this.objectLibrary.set('sphere', () => {
      const geometry = new THREE.SphereGeometry(0.05, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.5,
        metalness: 0.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = this.options.enableShadows;
      mesh.receiveShadow = this.options.enableShadows;
      return mesh;
    });

    // Cylinder
    this.objectLibrary.set('cylinder', () => {
      const geometry = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 32);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.6,
        metalness: 0.4,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = this.options.enableShadows;
      mesh.receiveShadow = this.options.enableShadows;
      return mesh;
    });

    // Torus
    this.objectLibrary.set('torus', () => {
      const geometry = new THREE.TorusGeometry(0.06, 0.02, 16, 100);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.4,
        metalness: 0.6,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = this.options.enableShadows;
      mesh.receiveShadow = this.options.enableShadows;
      return mesh;
    });
  }

  /**
   * Initialize hit testing
   */
  public async initializeHitTesting(session: XRSession): Promise<void> {
    if (!session) return;

    session.addEventListener('end', () => {
      this.hitTestSourceRequested = false;
      this.hitTestSource = null;
    });
  }

  /**
   * Update hit testing and reticle position (call in animation loop)
   */
  public update(frame: XRFrame, referenceSpace: XRReferenceSpace): void {
    if (!frame || !referenceSpace) return;

    const session = this.renderer.xr.getSession();
    if (!session) return;

    // Request hit test source
    if (!this.hitTestSourceRequested) {
      session.requestReferenceSpace('viewer').then((viewerSpace) => {
        session.requestHitTestSource?.({ space: viewerSpace })?.then((source) => {
          this.hitTestSource = source;
        });
      });
      this.hitTestSourceRequested = true;
    }

    // Perform hit test
    if (this.hitTestSource) {
      const hitTestResults = frame.getHitTestResults(this.hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);

        if (pose) {
          this.reticle.visible = true;
          this.reticle.matrix.fromArray(pose.transform.matrix);

          // Snap to grid if enabled
          if (this.options.enableGrid) {
            this.snapReticleToGrid();
          }
        }
      } else {
        this.reticle.visible = false;
      }
    }
  }

  /**
   * Snap reticle position to grid
   */
  private snapReticleToGrid(): void {
    const position = new THREE.Vector3();
    position.setFromMatrixPosition(this.reticle.matrix);

    position.x = Math.round(position.x / this.options.gridSize) * this.options.gridSize;
    position.z = Math.round(position.z / this.options.gridSize) * this.options.gridSize;

    const matrix = this.reticle.matrix.clone();
    matrix.setPosition(position);
    this.reticle.matrix.copy(matrix);
  }

  /**
   * Place an object at the reticle position
   */
  public placeObject(type: string = 'cube'): PlacedObject | null {
    if (!this.reticle.visible) {
      console.warn('Cannot place object: no valid surface detected');
      return null;
    }

    if (this.placedObjects.size >= this.options.maxObjects) {
      console.warn(`Maximum number of objects (${this.options.maxObjects}) reached`);
      return null;
    }

    const factory = this.objectLibrary.get(type);
    if (!factory) {
      console.error(`Unknown object type: ${type}`);
      return null;
    }

    const mesh = factory();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    this.reticle.matrix.decompose(position, quaternion, scale);

    mesh.position.copy(position);
    mesh.quaternion.copy(quaternion);

    this.scene.add(mesh);

    const placedObject: PlacedObject = {
      id: this.generateObjectId(),
      mesh,
      position: position.clone(),
      rotation: quaternion.clone(),
      scale: scale.clone(),
      timestamp: Date.now(),
      type,
    };

    this.placedObjects.set(placedObject.id, placedObject);

    console.log(`Placed ${type} object at`, position);

    // Trigger event
    const event = new CustomEvent('objectPlaced', {
      detail: placedObject,
    });
    window.dispatchEvent(event);

    return placedObject;
  }

  /**
   * Select an object for manipulation
   */
  public selectObject(object: THREE.Object3D): boolean {
    for (const [id, placedObj] of this.placedObjects) {
      if (placedObj.mesh === object) {
        this.selectedObject = placedObj;
        this.highlightObject(placedObj, true);
        console.log(`Selected object: ${id}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Deselect currently selected object
   */
  public deselectObject(): void {
    if (this.selectedObject) {
      this.highlightObject(this.selectedObject, false);
      this.selectedObject = null;
    }
  }

  /**
   * Highlight or unhighlight an object
   */
  private highlightObject(placedObj: PlacedObject, highlight: boolean): void {
    if (placedObj.mesh instanceof THREE.Mesh) {
      const material = placedObj.mesh.material as THREE.MeshStandardMaterial;
      if (highlight) {
        material.emissive.setHex(0xffff00);
        material.emissiveIntensity = 0.3;
      } else {
        material.emissive.setHex(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  }

  /**
   * Delete selected object
   */
  public deleteSelectedObject(): boolean {
    if (!this.selectedObject) return false;

    this.scene.remove(this.selectedObject.mesh);
    this.placedObjects.delete(this.selectedObject.id);

    console.log(`Deleted object: ${this.selectedObject.id}`);

    this.selectedObject = null;
    return true;
  }

  /**
   * Delete specific object by ID
   */
  public deleteObject(id: string): boolean {
    const placedObj = this.placedObjects.get(id);
    if (!placedObj) return false;

    this.scene.remove(placedObj.mesh);
    this.placedObjects.delete(id);

    if (this.selectedObject?.id === id) {
      this.selectedObject = null;
    }

    return true;
  }

  /**
   * Clear all placed objects
   */
  public clearAllObjects(): void {
    this.placedObjects.forEach((placedObj) => {
      this.scene.remove(placedObj.mesh);
    });
    this.placedObjects.clear();
    this.selectedObject = null;

    console.log('Cleared all placed objects');
  }

  /**
   * Scale selected object
   */
  public scaleSelectedObject(scaleFactor: number): void {
    if (!this.selectedObject) return;

    this.selectedObject.mesh.scale.multiplyScalar(scaleFactor);
    this.selectedObject.scale.copy(this.selectedObject.mesh.scale);
  }

  /**
   * Rotate selected object
   */
  public rotateSelectedObject(axis: 'x' | 'y' | 'z', angle: number): void {
    if (!this.selectedObject) return;

    switch (axis) {
      case 'x':
        this.selectedObject.mesh.rotateX(angle);
        break;
      case 'y':
        this.selectedObject.mesh.rotateY(angle);
        break;
      case 'z':
        this.selectedObject.mesh.rotateZ(angle);
        break;
    }

    this.selectedObject.rotation.copy(this.selectedObject.mesh.quaternion);
  }

  /**
   * Move selected object to reticle position
   */
  public moveSelectedObjectToReticle(): void {
    if (!this.selectedObject || !this.reticle.visible) return;

    const position = new THREE.Vector3();
    position.setFromMatrixPosition(this.reticle.matrix);

    this.selectedObject.mesh.position.copy(position);
    this.selectedObject.position.copy(position);
  }

  /**
   * Get all placed objects
   */
  public getPlacedObjects(): PlacedObject[] {
    return Array.from(this.placedObjects.values());
  }

  /**
   * Get object by ID
   */
  public getObject(id: string): PlacedObject | undefined {
    return this.placedObjects.get(id);
  }

  /**
   * Export placed objects data
   */
  public exportObjects(): string {
    const data = this.getPlacedObjects().map((obj) => ({
      id: obj.id,
      type: obj.type,
      position: obj.position.toArray(),
      rotation: obj.rotation.toArray(),
      scale: obj.scale.toArray(),
      timestamp: obj.timestamp,
    }));

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import placed objects from data
   */
  public importObjects(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      this.clearAllObjects();

      data.forEach((objData: any) => {
        const factory = this.objectLibrary.get(objData.type);
        if (!factory) return;

        const mesh = factory();
        mesh.position.fromArray(objData.position);
        mesh.quaternion.fromArray(objData.rotation);
        mesh.scale.fromArray(objData.scale);

        this.scene.add(mesh);

        const placedObject: PlacedObject = {
          id: objData.id,
          mesh,
          position: new THREE.Vector3().fromArray(objData.position),
          rotation: new THREE.Quaternion().fromArray(objData.rotation),
          scale: new THREE.Vector3().fromArray(objData.scale),
          timestamp: objData.timestamp,
          type: objData.type,
        };

        this.placedObjects.set(placedObject.id, placedObject);
      });

      console.log(`Imported ${data.length} objects`);
    } catch (error) {
      console.error('Failed to import objects:', error);
    }
  }

  /**
   * Add custom object type to library
   */
  public addObjectType(name: string, factory: () => THREE.Object3D): void {
    this.objectLibrary.set(name, factory);
  }

  /**
   * Generate unique object ID
   */
  private generateObjectId(): string {
    return `object_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get reticle for external use
   */
  public getReticle(): THREE.Mesh {
    return this.reticle;
  }

  /**
   * Set grid size
   */
  public setGridSize(size: number): void {
    this.options.gridSize = size;
  }

  /**
   * Toggle grid snapping
   */
  public setGridEnabled(enabled: boolean): void {
    this.options.enableGrid = enabled;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.clearAllObjects();
    this.scene.remove(this.reticle);
    this.reticle.geometry.dispose();
    (this.reticle.material as THREE.Material).dispose();

    if (this.hitTestSource) {
      this.hitTestSource.cancel();
      this.hitTestSource = null;
    }
  }
}

type TransformMode = 'none' | 'translate' | 'rotate' | 'scale';

// Usage example
export function initARObjectPlacement(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): ARObjectPlacement {
  const placement = new ARObjectPlacement(scene, camera, renderer, {
    enableGrid: true,
    gridSize: 0.05,
    enableShadows: true,
    maxObjects: 50,
  });

  // Listen for object placement events
  window.addEventListener('objectPlaced', ((event: CustomEvent) => {
    const obj = event.detail as PlacedObject;
    console.log(`Object placed: ${obj.type} at`, obj.position);
  }) as EventListener);

  return placement;
}
