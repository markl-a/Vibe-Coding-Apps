/**
 * 3D Interactions Example
 *
 * This example demonstrates various user interaction techniques with 3D objects.
 * Includes mouse/touch interactions, raycasting, drag & drop, and object manipulation.
 */

import * as THREE from 'three';

export type InteractionMode = 'select' | 'drag' | 'rotate' | 'scale';

export interface InteractiveObject {
  object: THREE.Object3D;
  onHover?: (object: THREE.Object3D) => void;
  onHoverEnd?: (object: THREE.Object3D) => void;
  onClick?: (object: THREE.Object3D, point: THREE.Vector3) => void;
  onDragStart?: (object: THREE.Object3D) => void;
  onDrag?: (object: THREE.Object3D, point: THREE.Vector3) => void;
  onDragEnd?: (object: THREE.Object3D) => void;
  draggable?: boolean;
  selectable?: boolean;
}

export class Interactions3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private interactiveObjects: Map<THREE.Object3D, InteractiveObject> = new Map();
  private hoveredObject: THREE.Object3D | null = null;
  private selectedObject: THREE.Object3D | null = null;
  private draggedObject: THREE.Object3D | null = null;
  private dragPlane: THREE.Plane;
  private dragOffset: THREE.Vector3;
  private mode: InteractionMode = 'select';
  private originalMaterials: Map<THREE.Object3D, THREE.Material | THREE.Material[]> = new Map();

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.dragOffset = new THREE.Vector3();

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for user input
   */
  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    // Mouse events
    canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    canvas.addEventListener('pointerup', this.onPointerUp.bind(this));

    // Touch events
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    // Keyboard events
    window.addEventListener('keydown', this.onKeyDown.bind(this));

    // Prevent context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Add an interactive object
   */
  public addInteractive(config: InteractiveObject): void {
    this.interactiveObjects.set(config.object, config);

    // Store original material for hover effects
    if (config.object instanceof THREE.Mesh) {
      this.originalMaterials.set(config.object, config.object.material);
    }
  }

  /**
   * Remove an interactive object
   */
  public removeInteractive(object: THREE.Object3D): void {
    this.interactiveObjects.delete(object);
    this.originalMaterials.delete(object);

    if (this.hoveredObject === object) {
      this.hoveredObject = null;
    }
    if (this.selectedObject === object) {
      this.selectedObject = null;
    }
    if (this.draggedObject === object) {
      this.draggedObject = null;
    }
  }

  /**
   * Handle pointer move
   */
  private onPointerMove(event: PointerEvent): void {
    this.updatePointerPosition(event.clientX, event.clientY);

    if (this.draggedObject) {
      this.handleDrag();
    } else {
      this.handleHover();
    }
  }

  /**
   * Handle pointer down
   */
  private onPointerDown(event: PointerEvent): void {
    this.updatePointerPosition(event.clientX, event.clientY);

    const intersected = this.getIntersectedObject();
    if (intersected) {
      const config = this.interactiveObjects.get(intersected.object);
      if (!config) return;

      // Handle click
      if (config.onClick) {
        config.onClick(intersected.object, intersected.point);
      }

      // Handle selection
      if (config.selectable !== false) {
        this.selectObject(intersected.object);
      }

      // Handle drag start
      if (config.draggable && this.mode === 'drag') {
        this.startDrag(intersected.object, intersected.point);
        if (config.onDragStart) {
          config.onDragStart(intersected.object);
        }
      }
    } else {
      // Clicked on empty space - deselect
      this.deselectObject();
    }
  }

  /**
   * Handle pointer up
   */
  private onPointerUp(_event: PointerEvent): void {
    if (this.draggedObject) {
      const config = this.interactiveObjects.get(this.draggedObject);
      if (config?.onDragEnd) {
        config.onDragEnd(this.draggedObject);
      }
      this.draggedObject = null;
    }
  }

  /**
   * Handle touch start
   */
  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
      this.onPointerDown(touch as any);
    }
  }

  /**
   * Handle touch move
   */
  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
      this.onPointerMove(touch as any);
    }
  }

  /**
   * Handle touch end
   */
  private onTouchEnd(event: TouchEvent): void {
    this.onPointerUp(event as any);
  }

  /**
   * Handle keyboard input
   */
  private onKeyDown(event: KeyboardEvent): void {
    if (!this.selectedObject) return;

    const moveSpeed = event.shiftKey ? 0.5 : 0.1;
    const rotateSpeed = event.shiftKey ? Math.PI / 4 : Math.PI / 16;
    const scaleSpeed = event.shiftKey ? 0.2 : 0.05;

    switch (event.key) {
      // Movement
      case 'ArrowUp':
        this.selectedObject.position.z -= moveSpeed;
        break;
      case 'ArrowDown':
        this.selectedObject.position.z += moveSpeed;
        break;
      case 'ArrowLeft':
        this.selectedObject.position.x -= moveSpeed;
        break;
      case 'ArrowRight':
        this.selectedObject.position.x += moveSpeed;
        break;
      case 'PageUp':
        this.selectedObject.position.y += moveSpeed;
        break;
      case 'PageDown':
        this.selectedObject.position.y -= moveSpeed;
        break;

      // Rotation
      case 'q':
      case 'Q':
        this.selectedObject.rotateY(rotateSpeed);
        break;
      case 'e':
      case 'E':
        this.selectedObject.rotateY(-rotateSpeed);
        break;

      // Scale
      case '+':
      case '=':
        this.selectedObject.scale.multiplyScalar(1 + scaleSpeed);
        break;
      case '-':
      case '_':
        this.selectedObject.scale.multiplyScalar(1 - scaleSpeed);
        break;

      // Delete
      case 'Delete':
      case 'Backspace':
        this.deleteSelectedObject();
        break;

      // Deselect
      case 'Escape':
        this.deselectObject();
        break;
    }

    event.preventDefault();
  }

  /**
   * Update pointer position in normalized device coordinates
   */
  private updatePointerPosition(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Get intersected object under pointer
   */
  private getIntersectedObject(): THREE.Intersection | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const interactableObjects = Array.from(this.interactiveObjects.keys());
    const intersects = this.raycaster.intersectObjects(interactableObjects, true);

    if (intersects.length > 0) {
      // Find the top-level interactive object
      let object = intersects[0].object;
      while (object.parent && !this.interactiveObjects.has(object)) {
        object = object.parent;
      }

      if (this.interactiveObjects.has(object)) {
        return { ...intersects[0], object };
      }
    }

    return null;
  }

  /**
   * Handle hover state
   */
  private handleHover(): void {
    const intersected = this.getIntersectedObject();

    if (intersected) {
      const object = intersected.object;

      if (this.hoveredObject !== object) {
        // End previous hover
        if (this.hoveredObject) {
          this.endHover(this.hoveredObject);
        }

        // Start new hover
        this.hoveredObject = object;
        this.startHover(object);

        const config = this.interactiveObjects.get(object);
        if (config?.onHover) {
          config.onHover(object);
        }
      }
    } else {
      // No object hovered
      if (this.hoveredObject) {
        this.endHover(this.hoveredObject);
        this.hoveredObject = null;
      }
    }
  }

  /**
   * Start hover effect
   */
  private startHover(object: THREE.Object3D): void {
    if (object instanceof THREE.Mesh && object !== this.selectedObject) {
      const material = object.material as THREE.MeshStandardMaterial;
      if (material.emissive) {
        material.emissive.setHex(0x444444);
      }
    }
    this.renderer.domElement.style.cursor = 'pointer';
  }

  /**
   * End hover effect
   */
  private endHover(object: THREE.Object3D): void {
    const config = this.interactiveObjects.get(object);
    if (config?.onHoverEnd) {
      config.onHoverEnd(object);
    }

    if (object instanceof THREE.Mesh && object !== this.selectedObject) {
      const material = object.material as THREE.MeshStandardMaterial;
      if (material.emissive) {
        material.emissive.setHex(0x000000);
      }
    }
    this.renderer.domElement.style.cursor = 'default';
  }

  /**
   * Select an object
   */
  private selectObject(object: THREE.Object3D): void {
    if (this.selectedObject === object) return;

    // Deselect previous
    this.deselectObject();

    this.selectedObject = object;

    // Highlight selected object
    if (object instanceof THREE.Mesh) {
      const material = object.material as THREE.MeshStandardMaterial;
      if (material.emissive) {
        material.emissive.setHex(0xffff00);
        material.emissiveIntensity = 0.3;
      }
    }

    console.log('Selected object:', object.name || object.uuid);
  }

  /**
   * Deselect current object
   */
  private deselectObject(): void {
    if (!this.selectedObject) return;

    if (this.selectedObject instanceof THREE.Mesh) {
      const material = this.selectedObject.material as THREE.MeshStandardMaterial;
      if (material.emissive) {
        material.emissive.setHex(0x000000);
        material.emissiveIntensity = 0;
      }
    }

    this.selectedObject = null;
  }

  /**
   * Start dragging an object
   */
  private startDrag(object: THREE.Object3D, point: THREE.Vector3): void {
    this.draggedObject = object;

    // Calculate drag offset
    this.dragOffset.copy(point).sub(object.position);

    // Update drag plane
    const normal = new THREE.Vector3(0, 1, 0);
    this.dragPlane.setFromNormalAndCoplanarPoint(normal, point);
  }

  /**
   * Handle dragging
   */
  private handleDrag(): void {
    if (!this.draggedObject) return;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint);

    if (intersectPoint) {
      const newPosition = intersectPoint.sub(this.dragOffset);
      this.draggedObject.position.copy(newPosition);

      const config = this.interactiveObjects.get(this.draggedObject);
      if (config?.onDrag) {
        config.onDrag(this.draggedObject, newPosition);
      }
    }
  }

  /**
   * Delete selected object
   */
  private deleteSelectedObject(): void {
    if (!this.selectedObject) return;

    this.scene.remove(this.selectedObject);
    this.removeInteractive(this.selectedObject);

    console.log('Deleted object:', this.selectedObject.name || this.selectedObject.uuid);
  }

  /**
   * Set interaction mode
   */
  public setMode(mode: InteractionMode): void {
    this.mode = mode;
    console.log(`Interaction mode: ${mode}`);
  }

  /**
   * Get current mode
   */
  public getMode(): InteractionMode {
    return this.mode;
  }

  /**
   * Get selected object
   */
  public getSelectedObject(): THREE.Object3D | null {
    return this.selectedObject;
  }

  /**
   * Raycast from camera to point
   */
  public raycastFromCamera(point: THREE.Vector2): THREE.Intersection[] {
    this.raycaster.setFromCamera(point, this.camera);
    const objects = Array.from(this.interactiveObjects.keys());
    return this.raycaster.intersectObjects(objects, true);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.onPointerMove.bind(this));
    canvas.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    canvas.removeEventListener('pointerup', this.onPointerUp.bind(this));
    canvas.removeEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.removeEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.removeEventListener('touchend', this.onTouchEnd.bind(this));
    window.removeEventListener('keydown', this.onKeyDown.bind(this));

    this.interactiveObjects.clear();
    this.originalMaterials.clear();
  }
}

// Usage example
export function initInteractions(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): Interactions3D {
  const interactions = new Interactions3D(scene, camera, renderer);

  // Create some interactive objects
  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];

  for (let i = 0; i < 5; i++) {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: colors[i],
      roughness: 0.7,
      metalness: 0.3,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set((i - 2) * 1.5, 0.5, -3);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.name = `Cube_${i}`;

    scene.add(cube);

    // Make it interactive
    interactions.addInteractive({
      object: cube,
      draggable: true,
      selectable: true,
      onClick: (obj, point) => {
        console.log(`Clicked ${obj.name} at`, point);
      },
      onHover: (obj) => {
        console.log(`Hovering ${obj.name}`);
      },
      onDragStart: (obj) => {
        console.log(`Started dragging ${obj.name}`);
      },
      onDragEnd: (obj) => {
        console.log(`Stopped dragging ${obj.name}`);
      },
    });
  }

  // Set initial mode
  interactions.setMode('drag');

  return interactions;
}
