/**
 * VR Controllers Example
 *
 * This example demonstrates how to handle VR controllers using WebXR.
 * Includes controller tracking, button events, haptic feedback, and ray casting.
 */

import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';

export interface ControllerEvent {
  type: 'select' | 'selectstart' | 'selectend' | 'squeeze' | 'squeezestart' | 'squeezeend';
  controller: THREE.XRTargetRaySpace;
  data: XRInputSource;
}

export class VRControllers {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private controller1: THREE.XRTargetRaySpace;
  private controller2: THREE.XRTargetRaySpace;
  private controllerGrip1: THREE.XRGripSpace;
  private controllerGrip2: THREE.XRGripSpace;
  private controllerModelFactory: XRControllerModelFactory;
  private raycaster: THREE.Raycaster;
  private tempMatrix: THREE.Matrix4;
  private interactableObjects: THREE.Object3D[] = [];
  private selectedObject: THREE.Object3D | null = null;
  private markers: THREE.Group[] = [];

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();
    this.controllerModelFactory = new XRControllerModelFactory();

    this.setupControllers();
    this.createSampleInteractables();
  }

  /**
   * Setup VR controllers
   */
  private setupControllers(): void {
    // Controller 1 (right hand typically)
    this.controller1 = this.renderer.xr.getController(0);
    this.controller1.addEventListener('selectstart', this.onSelectStart.bind(this));
    this.controller1.addEventListener('selectend', this.onSelectEnd.bind(this));
    this.controller1.addEventListener('squeezestart', this.onSqueezeStart.bind(this));
    this.controller1.addEventListener('squeezeend', this.onSqueezeEnd.bind(this));
    this.controller1.addEventListener('connected', (event) => this.onControllerConnected(event, 1));
    this.controller1.addEventListener('disconnected', () => this.onControllerDisconnected(1));
    this.scene.add(this.controller1);

    // Controller 2 (left hand typically)
    this.controller2 = this.renderer.xr.getController(1);
    this.controller2.addEventListener('selectstart', this.onSelectStart.bind(this));
    this.controller2.addEventListener('selectend', this.onSelectEnd.bind(this));
    this.controller2.addEventListener('squeezestart', this.onSqueezeStart.bind(this));
    this.controller2.addEventListener('squeezeend', this.onSqueezeEnd.bind(this));
    this.controller2.addEventListener('connected', (event) => this.onControllerConnected(event, 2));
    this.controller2.addEventListener('disconnected', () => this.onControllerDisconnected(2));
    this.scene.add(this.controller2);

    // Controller grips (for 3D models)
    this.controllerGrip1 = this.renderer.xr.getControllerGrip(0);
    this.controllerGrip1.add(this.controllerModelFactory.createControllerModel(this.controllerGrip1));
    this.scene.add(this.controllerGrip1);

    this.controllerGrip2 = this.renderer.xr.getControllerGrip(1);
    this.controllerGrip2.add(this.controllerModelFactory.createControllerModel(this.controllerGrip2));
    this.scene.add(this.controllerGrip2);

    // Add ray visualization
    this.addRayVisualizers();
  }

  /**
   * Add visual rays to controllers
   */
  private addRayVisualizers(): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);

    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 2,
    });

    const line1 = new THREE.Line(geometry, material);
    line1.scale.z = 5;
    this.controller1.add(line1);

    const line2 = new THREE.Line(geometry, material.clone());
    line2.scale.z = 5;
    this.controller2.add(line2);

    // Add targeting markers at the end of rays
    const markerGeometry = new THREE.RingGeometry(0.02, 0.04, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });

    const marker1 = new THREE.Group();
    const markerMesh1 = new THREE.Mesh(markerGeometry, markerMaterial);
    marker1.add(markerMesh1);
    marker1.visible = false;
    this.scene.add(marker1);
    this.markers.push(marker1);

    const marker2 = new THREE.Group();
    const markerMesh2 = new THREE.Mesh(markerGeometry, markerMaterial.clone());
    marker2.add(markerMesh2);
    marker2.visible = false;
    this.scene.add(marker2);
    this.markers.push(marker2);
  }

  /**
   * Handle controller connection
   */
  private onControllerConnected(event: any, controllerIndex: number): void {
    const data = event.data as XRInputSource;
    console.log(`Controller ${controllerIndex} connected:`, {
      handedness: data.handedness,
      targetRayMode: data.targetRayMode,
      profiles: data.profiles,
    });

    // Check controller capabilities
    if (data.gamepad) {
      console.log(`Controller ${controllerIndex} has ${data.gamepad.buttons.length} buttons`);
      console.log(`Controller ${controllerIndex} has ${data.gamepad.axes.length} axes`);
    }
  }

  /**
   * Handle controller disconnection
   */
  private onControllerDisconnected(controllerIndex: number): void {
    console.log(`Controller ${controllerIndex} disconnected`);
  }

  /**
   * Handle select start (trigger press)
   */
  private onSelectStart(event: any): void {
    const controller = event.target as THREE.XRTargetRaySpace;
    const intersections = this.getIntersections(controller);

    if (intersections.length > 0) {
      const intersection = intersections[0];
      const object = intersection.object;

      // Store selected object
      this.selectedObject = object;

      // Highlight the object
      if (object instanceof THREE.Mesh) {
        const material = object.material as THREE.MeshStandardMaterial;
        material.emissive.setHex(0xffff00);
        material.emissiveIntensity = 0.5;
      }

      // Provide haptic feedback
      this.triggerHapticFeedback(event.data, 0.5, 100);

      console.log('Selected object:', object.name || object.uuid);
    }
  }

  /**
   * Handle select end (trigger release)
   */
  private onSelectEnd(event: any): void {
    if (this.selectedObject && this.selectedObject instanceof THREE.Mesh) {
      const material = this.selectedObject.material as THREE.MeshStandardMaterial;
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
    this.selectedObject = null;
  }

  /**
   * Handle squeeze start (grip press)
   */
  private onSqueezeStart(event: any): void {
    const controller = event.target as THREE.XRTargetRaySpace;
    const intersections = this.getIntersections(controller);

    if (intersections.length > 0) {
      const object = intersections[0].object;

      // Remove the object from scene
      this.scene.remove(object);
      this.interactableObjects = this.interactableObjects.filter((obj) => obj !== object);

      // Strong haptic feedback for deletion
      this.triggerHapticFeedback(event.data, 1.0, 200);

      console.log('Deleted object:', object.name || object.uuid);
    }
  }

  /**
   * Handle squeeze end (grip release)
   */
  private onSqueezeEnd(_event: any): void {
    // Handle grip release if needed
  }

  /**
   * Get intersections between controller ray and interactable objects
   */
  private getIntersections(controller: THREE.XRTargetRaySpace): THREE.Intersection[] {
    this.tempMatrix.identity().extractRotation(controller.matrixWorld);
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

    return this.raycaster.intersectObjects(this.interactableObjects, false);
  }

  /**
   * Trigger haptic feedback on controller
   */
  private triggerHapticFeedback(
    inputSource: XRInputSource,
    intensity: number,
    duration: number
  ): void {
    if (inputSource.gamepad && inputSource.gamepad.hapticActuators) {
      const actuator = inputSource.gamepad.hapticActuators[0];
      if (actuator) {
        actuator.pulse(intensity, duration);
      }
    }
  }

  /**
   * Update controller state (call in animation loop)
   */
  public update(): void {
    // Update targeting markers
    this.updateTargetingMarkers(this.controller1, this.markers[0]);
    this.updateTargetingMarkers(this.controller2, this.markers[1]);

    // Monitor controller buttons and axes
    this.monitorControllerInput();
  }

  /**
   * Update targeting marker position based on ray intersection
   */
  private updateTargetingMarkers(
    controller: THREE.XRTargetRaySpace,
    marker: THREE.Group
  ): void {
    const intersections = this.getIntersections(controller);

    if (intersections.length > 0) {
      const intersection = intersections[0];
      marker.position.copy(intersection.point);
      marker.quaternion.setFromRotationMatrix(
        this.tempMatrix.lookAt(
          intersection.point,
          intersection.point.clone().add(intersection.face!.normal),
          new THREE.Vector3(0, 1, 0)
        )
      );
      marker.visible = true;
    } else {
      marker.visible = false;
    }
  }

  /**
   * Monitor controller input (thumbsticks, buttons, etc.)
   */
  private monitorControllerInput(): void {
    const session = this.renderer.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
      if (source.gamepad) {
        // Monitor thumbstick/trackpad axes
        if (source.gamepad.axes.length >= 2) {
          const x = source.gamepad.axes[0];
          const y = source.gamepad.axes[1];

          // Use thumbstick for movement or interaction
          if (Math.abs(x) > 0.1 || Math.abs(y) > 0.1) {
            // Example: Could move selected object
            if (this.selectedObject) {
              this.selectedObject.position.x += x * 0.01;
              this.selectedObject.position.z += y * 0.01;
            }
          }
        }

        // Monitor button states
        source.gamepad.buttons.forEach((button, index) => {
          if (button.pressed) {
            // Handle different button presses
            // Button 0: trigger
            // Button 1: grip
            // Button 2-5: face buttons (A, B, X, Y)
          }
        });
      }
    }
  }

  /**
   * Create sample interactable objects for demonstration
   */
  private createSampleInteractables(): void {
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];

    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshStandardMaterial({
        color: colors[i],
        roughness: 0.7,
        metalness: 0.3,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (i % 3 - 1) * 0.6,
        1.6,
        -2 - Math.floor(i / 3) * 0.6
      );
      cube.castShadow = true;
      cube.receiveShadow = true;
      cube.name = `Cube_${i}`;

      this.scene.add(cube);
      this.interactableObjects.push(cube);
    }
  }

  /**
   * Add custom interactable object
   */
  public addInteractable(object: THREE.Object3D): void {
    this.interactableObjects.push(object);
  }

  /**
   * Remove interactable object
   */
  public removeInteractable(object: THREE.Object3D): void {
    const index = this.interactableObjects.indexOf(object);
    if (index > -1) {
      this.interactableObjects.splice(index, 1);
    }
  }

  /**
   * Get all interactable objects
   */
  public getInteractables(): THREE.Object3D[] {
    return this.interactableObjects;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.markers.forEach((marker) => {
      this.scene.remove(marker);
      marker.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
    });
  }
}

// Usage example
export function initVRControllers(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
): VRControllers {
  return new VRControllers(scene, renderer);
}
