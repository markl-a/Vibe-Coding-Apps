/**
 * VR Locomotion Example
 *
 * This example demonstrates various VR movement patterns including:
 * - Teleportation
 * - Smooth locomotion
 * - Snap turning
 * - Comfort vignette for motion sickness prevention
 */

import * as THREE from 'three';

export type LocomotionMode = 'teleport' | 'smooth' | 'hybrid';

export interface LocomotionOptions {
  mode: LocomotionMode;
  moveSpeed: number;
  turnSpeed: number;
  snapTurnAngle: number;
  enableVignette: boolean;
  teleportMaxDistance: number;
}

export class VRLocomotion {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private options: LocomotionOptions;
  private dolly: THREE.Group;
  private teleportMarker: THREE.Mesh;
  private teleportCurve: THREE.Line;
  private validTeleport: boolean = false;
  private teleportPoint: THREE.Vector3 = new THREE.Vector3();
  private vignette: HTMLElement | null = null;
  private lastSnapTurnTime: number = 0;
  private snapTurnCooldown: number = 300; // ms
  private floorMeshes: THREE.Mesh[] = [];

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    options: Partial<LocomotionOptions> = {}
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    // Default options
    this.options = {
      mode: 'hybrid',
      moveSpeed: 1.5,
      turnSpeed: 90,
      snapTurnAngle: 30,
      enableVignette: true,
      teleportMaxDistance: 10,
      ...options,
    };

    this.setupDolly();
    this.setupTeleportVisuals();
    if (this.options.enableVignette) {
      this.setupVignette();
    }
  }

  /**
   * Setup camera dolly for movement
   */
  private setupDolly(): void {
    this.dolly = new THREE.Group();
    this.dolly.position.copy(this.camera.position);
    this.dolly.add(this.camera);
    this.scene.add(this.dolly);
  }

  /**
   * Setup teleport visualization
   */
  private setupTeleportVisuals(): void {
    // Teleport marker (circle on ground)
    const markerGeometry = new THREE.RingGeometry(0.3, 0.35, 32);
    markerGeometry.rotateX(-Math.PI / 2);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    this.teleportMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    this.teleportMarker.visible = false;
    this.scene.add(this.teleportMarker);

    // Teleport curve (arc trajectory)
    const curvePoints = [];
    for (let i = 0; i <= 50; i++) {
      curvePoints.push(new THREE.Vector3(0, 0, 0));
    }
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.6,
    });
    this.teleportCurve = new THREE.Line(curveGeometry, curveMaterial);
    this.teleportCurve.visible = false;
    this.scene.add(this.teleportCurve);
  }

  /**
   * Setup comfort vignette for motion sickness prevention
   */
  private setupVignette(): void {
    this.vignette = document.createElement('div');
    this.vignette.style.position = 'fixed';
    this.vignette.style.top = '0';
    this.vignette.style.left = '0';
    this.vignette.style.width = '100%';
    this.vignette.style.height = '100%';
    this.vignette.style.pointerEvents = 'none';
    this.vignette.style.background = 'radial-gradient(circle, transparent 30%, black 100%)';
    this.vignette.style.opacity = '0';
    this.vignette.style.transition = 'opacity 0.2s';
    document.body.appendChild(this.vignette);
  }

  /**
   * Update vignette intensity based on movement speed
   */
  private updateVignette(intensity: number): void {
    if (this.vignette) {
      this.vignette.style.opacity = Math.min(intensity, 0.7).toString();
    }
  }

  /**
   * Calculate teleport trajectory using parabolic arc
   */
  private calculateTeleportTrajectory(
    controller: THREE.XRTargetRaySpace
  ): { valid: boolean; point: THREE.Vector3; curve: THREE.Vector3[] } {
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3(0, 0, -1);
    const matrix = new THREE.Matrix4();

    origin.setFromMatrixPosition(controller.matrixWorld);
    matrix.extractRotation(controller.matrixWorld);
    direction.applyMatrix4(matrix);

    const velocity = 5;
    const gravity = 9.8;
    const timeStep = 0.02;
    const maxTime = 2;

    const points: THREE.Vector3[] = [];
    const raycaster = new THREE.Raycaster();
    let validPoint: THREE.Vector3 | null = null;

    for (let t = 0; t <= maxTime; t += timeStep) {
      const point = new THREE.Vector3(
        origin.x + direction.x * velocity * t,
        origin.y + direction.y * velocity * t - 0.5 * gravity * t * t,
        origin.z + direction.z * velocity * t
      );

      points.push(point.clone());

      // Check for floor intersection
      if (points.length > 1) {
        const prevPoint = points[points.length - 2];
        raycaster.set(prevPoint, point.clone().sub(prevPoint).normalize());
        const intersects = raycaster.intersectObjects(this.floorMeshes, false);

        if (intersects.length > 0) {
          validPoint = intersects[0].point;
          break;
        }
      }

      // Stop if too far below origin
      if (point.y < origin.y - 5) break;
    }

    if (validPoint) {
      const distance = origin.distanceTo(validPoint);
      if (distance <= this.options.teleportMaxDistance) {
        return { valid: true, point: validPoint, curve: points };
      }
    }

    return { valid: false, point: new THREE.Vector3(), curve: points };
  }

  /**
   * Show teleport preview
   */
  public showTeleportPreview(controller: THREE.XRTargetRaySpace): void {
    if (this.options.mode === 'smooth') return;

    const result = this.calculateTeleportTrajectory(controller);

    if (result.valid) {
      // Update marker
      this.teleportMarker.position.copy(result.point);
      this.teleportMarker.visible = true;
      const material = this.teleportMarker.material as THREE.MeshBasicMaterial;
      material.color.setHex(0x00ff00);

      this.validTeleport = true;
      this.teleportPoint.copy(result.point);
    } else {
      this.teleportMarker.visible = false;
      this.validTeleport = false;
    }

    // Update curve
    const positions = this.teleportCurve.geometry.attributes.position;
    for (let i = 0; i < result.curve.length && i < positions.count; i++) {
      const point = result.curve[i];
      positions.setXYZ(i, point.x, point.y, point.z);
    }
    positions.needsUpdate = true;
    this.teleportCurve.visible = true;

    const curveMaterial = this.teleportCurve.material as THREE.LineBasicMaterial;
    curveMaterial.color.setHex(result.valid ? 0x00ff00 : 0xff0000);
  }

  /**
   * Hide teleport preview
   */
  public hideTeleportPreview(): void {
    this.teleportMarker.visible = false;
    this.teleportCurve.visible = false;
    this.validTeleport = false;
  }

  /**
   * Execute teleport
   */
  public teleport(): boolean {
    if (this.validTeleport) {
      this.dolly.position.copy(this.teleportPoint);
      this.dolly.position.y += 1.6; // Adjust for camera height
      this.hideTeleportPreview();
      return true;
    }
    return false;
  }

  /**
   * Smooth locomotion using thumbstick/trackpad
   */
  public smoothMove(axisX: number, axisY: number, deltaTime: number): void {
    if (this.options.mode === 'teleport') return;

    const moveSpeed = this.options.moveSpeed * deltaTime;

    // Calculate movement vector based on camera direction
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();

    // Apply movement
    const movement = new THREE.Vector3();
    movement.addScaledVector(direction, -axisY * moveSpeed);
    movement.addScaledVector(right, axisX * moveSpeed);

    this.dolly.position.add(movement);

    // Update vignette based on movement intensity
    if (this.options.enableVignette) {
      const intensity = Math.sqrt(axisX * axisX + axisY * axisY) * 0.5;
      this.updateVignette(intensity);
    }
  }

  /**
   * Snap turn (discrete rotation)
   */
  public snapTurn(direction: number): void {
    const now = Date.now();
    if (now - this.lastSnapTurnTime < this.snapTurnCooldown) return;

    const angle = (direction * this.options.snapTurnAngle * Math.PI) / 180;
    this.dolly.rotateY(angle);
    this.lastSnapTurnTime = now;

    // Brief vignette flash
    if (this.options.enableVignette) {
      this.updateVignette(0.5);
      setTimeout(() => this.updateVignette(0), 100);
    }
  }

  /**
   * Smooth turn (continuous rotation)
   */
  public smoothTurn(axis: number, deltaTime: number): void {
    const turnSpeed = (this.options.turnSpeed * Math.PI) / 180 * deltaTime;
    this.dolly.rotateY(-axis * turnSpeed);
  }

  /**
   * Update locomotion (call in animation loop)
   */
  public update(deltaTime: number): void {
    const session = this.renderer.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
      if (source.gamepad && source.handedness === 'left') {
        // Left controller - movement
        if (source.gamepad.axes.length >= 2) {
          const x = source.gamepad.axes[0];
          const y = source.gamepad.axes[1];

          if (Math.abs(x) > 0.1 || Math.abs(y) > 0.1) {
            this.smoothMove(x, y, deltaTime);
          } else {
            // Reset vignette when not moving
            if (this.options.enableVignette) {
              this.updateVignette(0);
            }
          }
        }
      }

      if (source.gamepad && source.handedness === 'right') {
        // Right controller - turning
        if (source.gamepad.axes.length >= 4) {
          const x = source.gamepad.axes[2];

          if (Math.abs(x) > 0.1) {
            this.smoothTurn(x, deltaTime);
          }

          // Snap turn with threshold
          if (x > 0.8) {
            this.snapTurn(1);
          } else if (x < -0.8) {
            this.snapTurn(-1);
          }
        }
      }
    }
  }

  /**
   * Add floor mesh for teleportation
   */
  public addFloor(mesh: THREE.Mesh): void {
    this.floorMeshes.push(mesh);
  }

  /**
   * Remove floor mesh
   */
  public removeFloor(mesh: THREE.Mesh): void {
    const index = this.floorMeshes.indexOf(mesh);
    if (index > -1) {
      this.floorMeshes.splice(index, 1);
    }
  }

  /**
   * Set locomotion mode
   */
  public setMode(mode: LocomotionMode): void {
    this.options.mode = mode;
    this.hideTeleportPreview();
  }

  /**
   * Get current locomotion mode
   */
  public getMode(): LocomotionMode {
    return this.options.mode;
  }

  /**
   * Get camera dolly
   */
  public getDolly(): THREE.Group {
    return this.dolly;
  }

  /**
   * Set dolly position
   */
  public setPosition(position: THREE.Vector3): void {
    this.dolly.position.copy(position);
  }

  /**
   * Get dolly position
   */
  public getPosition(): THREE.Vector3 {
    return this.dolly.position.clone();
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.scene.remove(this.teleportMarker);
    this.scene.remove(this.teleportCurve);
    this.scene.remove(this.dolly);

    this.teleportMarker.geometry.dispose();
    (this.teleportMarker.material as THREE.Material).dispose();
    this.teleportCurve.geometry.dispose();
    (this.teleportCurve.material as THREE.Material).dispose();

    if (this.vignette) {
      document.body.removeChild(this.vignette);
    }
  }
}

// Usage example
export function initVRLocomotion(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  options?: Partial<LocomotionOptions>
): VRLocomotion {
  const locomotion = new VRLocomotion(scene, camera, renderer, options);

  // Add floor for teleportation
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  locomotion.addFloor(floor);

  return locomotion;
}
