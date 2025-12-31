/**
 * AR Surface Detection Example
 *
 * This example demonstrates how to detect real-world surfaces (planes) using WebXR.
 * Includes horizontal and vertical plane detection, visualization, and interaction.
 */

import * as THREE from 'three';

export type PlaneOrientation = 'horizontal' | 'vertical';

export interface DetectedPlane {
  id: string;
  orientation: PlaneOrientation;
  polygon: THREE.Vector3[];
  center: THREE.Vector3;
  normal: THREE.Vector3;
  mesh: THREE.Mesh;
  lastUpdated: number;
}

export class ARSurfaceDetection {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private detectedPlanes: Map<XRPlane, DetectedPlane> = new Map();
  private planeMeshes: THREE.Group;
  private showPlaneVisualization: boolean = true;
  private horizontalPlaneMaterial: THREE.MeshBasicMaterial;
  private verticalPlaneMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.planeMeshes = new THREE.Group();
    this.scene.add(this.planeMeshes);

    // Create materials for plane visualization
    this.horizontalPlaneMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      wireframe: false,
    });

    this.verticalPlaneMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      wireframe: false,
    });
  }

  /**
   * Update plane detection (call in animation loop)
   */
  public update(frame: XRFrame, referenceSpace: XRReferenceSpace): void {
    if (!frame || !referenceSpace) return;

    const detectedPlanes = frame.detectedPlanes;
    if (!detectedPlanes) return;

    const now = Date.now();
    const currentPlanes = new Set<XRPlane>();

    // Update or create planes
    detectedPlanes.forEach((plane: XRPlane) => {
      currentPlanes.add(plane);

      const existingPlane = this.detectedPlanes.get(plane);
      if (existingPlane) {
        // Update existing plane
        this.updatePlane(plane, existingPlane, frame, referenceSpace);
        existingPlane.lastUpdated = now;
      } else {
        // Create new plane
        const newPlane = this.createPlane(plane, frame, referenceSpace);
        if (newPlane) {
          this.detectedPlanes.set(plane, newPlane);
          this.onPlaneDetected(newPlane);
        }
      }
    });

    // Remove planes that are no longer detected
    this.detectedPlanes.forEach((detectedPlane, xrPlane) => {
      if (!currentPlanes.has(xrPlane)) {
        this.removePlane(xrPlane, detectedPlane);
      }
    });
  }

  /**
   * Create a new detected plane
   */
  private createPlane(
    xrPlane: XRPlane,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace
  ): DetectedPlane | null {
    const pose = frame.getPose(xrPlane.planeSpace, referenceSpace);
    if (!pose) return null;

    const polygon = this.getPlanePolygon(xrPlane, pose);
    const center = this.calculateCenter(polygon);
    const normal = this.getPlaneNormal(pose);
    const orientation = this.determinePlaneOrientation(normal);

    // Create mesh for visualization
    const mesh = this.createPlaneMesh(polygon, orientation);
    this.planeMeshes.add(mesh);

    return {
      id: this.generatePlaneId(),
      orientation,
      polygon,
      center,
      normal,
      mesh,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Update an existing plane
   */
  private updatePlane(
    xrPlane: XRPlane,
    detectedPlane: DetectedPlane,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace
  ): void {
    const pose = frame.getPose(xrPlane.planeSpace, referenceSpace);
    if (!pose) return;

    const polygon = this.getPlanePolygon(xrPlane, pose);
    detectedPlane.polygon = polygon;
    detectedPlane.center = this.calculateCenter(polygon);
    detectedPlane.normal = this.getPlaneNormal(pose);

    // Update mesh
    this.updatePlaneMesh(detectedPlane.mesh, polygon);
  }

  /**
   * Remove a plane
   */
  private removePlane(xrPlane: XRPlane, detectedPlane: DetectedPlane): void {
    this.planeMeshes.remove(detectedPlane.mesh);
    detectedPlane.mesh.geometry.dispose();
    this.detectedPlanes.delete(xrPlane);
    this.onPlaneRemoved(detectedPlane);
  }

  /**
   * Get plane polygon points in world space
   */
  private getPlanePolygon(xrPlane: XRPlane, pose: XRPose): THREE.Vector3[] {
    const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
    const polygon: THREE.Vector3[] = [];

    xrPlane.polygon.forEach((point: DOMPointReadOnly) => {
      const worldPoint = new THREE.Vector3(point.x, point.y, point.z);
      worldPoint.applyMatrix4(matrix);
      polygon.push(worldPoint);
    });

    return polygon;
  }

  /**
   * Calculate center of polygon
   */
  private calculateCenter(polygon: THREE.Vector3[]): THREE.Vector3 {
    const center = new THREE.Vector3();
    polygon.forEach((point) => center.add(point));
    center.divideScalar(polygon.length);
    return center;
  }

  /**
   * Get plane normal from pose
   */
  private getPlaneNormal(pose: XRPose): THREE.Vector3 {
    const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
    const normal = new THREE.Vector3(0, 1, 0);
    normal.applyMatrix4(matrix);
    normal.sub(new THREE.Vector3().setFromMatrixPosition(matrix));
    normal.normalize();
    return normal;
  }

  /**
   * Determine if plane is horizontal or vertical
   */
  private determinePlaneOrientation(normal: THREE.Vector3): PlaneOrientation {
    const upVector = new THREE.Vector3(0, 1, 0);
    const angle = normal.angleTo(upVector);
    // If normal is close to up/down, it's horizontal
    return angle < Math.PI / 4 || angle > (3 * Math.PI) / 4
      ? 'horizontal'
      : 'vertical';
  }

  /**
   * Create mesh for plane visualization
   */
  private createPlaneMesh(
    polygon: THREE.Vector3[],
    orientation: PlaneOrientation
  ): THREE.Mesh {
    const shape = new THREE.Shape();

    // Project polygon points to 2D for shape creation
    const localPolygon = this.projectPolygonTo2D(polygon);

    if (localPolygon.length > 0) {
      shape.moveTo(localPolygon[0].x, localPolygon[0].y);
      for (let i = 1; i < localPolygon.length; i++) {
        shape.lineTo(localPolygon[i].x, localPolygon[i].y);
      }
      shape.closePath();
    }

    const geometry = new THREE.ShapeGeometry(shape);
    const material =
      orientation === 'horizontal'
        ? this.horizontalPlaneMaterial
        : this.verticalPlaneMaterial;

    const mesh = new THREE.Mesh(geometry, material);

    // Position mesh at center of polygon
    const center = this.calculateCenter(polygon);
    mesh.position.copy(center);

    // Orient mesh to match plane
    const normal = this.calculatePolygonNormal(polygon);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    mesh.quaternion.copy(quaternion);

    mesh.visible = this.showPlaneVisualization;

    return mesh;
  }

  /**
   * Update plane mesh geometry
   */
  private updatePlaneMesh(mesh: THREE.Mesh, polygon: THREE.Vector3[]): void {
    const shape = new THREE.Shape();
    const localPolygon = this.projectPolygonTo2D(polygon);

    if (localPolygon.length > 0) {
      shape.moveTo(localPolygon[0].x, localPolygon[0].y);
      for (let i = 1; i < localPolygon.length; i++) {
        shape.lineTo(localPolygon[i].x, localPolygon[i].y);
      }
      shape.closePath();
    }

    const geometry = new THREE.ShapeGeometry(shape);
    mesh.geometry.dispose();
    mesh.geometry = geometry;

    const center = this.calculateCenter(polygon);
    mesh.position.copy(center);

    const normal = this.calculatePolygonNormal(polygon);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    mesh.quaternion.copy(quaternion);
  }

  /**
   * Project 3D polygon to 2D for mesh creation
   */
  private projectPolygonTo2D(polygon: THREE.Vector3[]): THREE.Vector2[] {
    if (polygon.length === 0) return [];

    const center = this.calculateCenter(polygon);
    const normal = this.calculatePolygonNormal(polygon);

    // Create a coordinate system on the plane
    const xAxis = new THREE.Vector3(1, 0, 0);
    if (Math.abs(normal.dot(xAxis)) > 0.9) {
      xAxis.set(0, 1, 0);
    }
    xAxis.cross(normal).normalize();
    const yAxis = new THREE.Vector3().crossVectors(normal, xAxis);

    // Project points to 2D
    return polygon.map((point) => {
      const relative = point.clone().sub(center);
      return new THREE.Vector2(relative.dot(xAxis), relative.dot(yAxis));
    });
  }

  /**
   * Calculate polygon normal
   */
  private calculatePolygonNormal(polygon: THREE.Vector3[]): THREE.Vector3 {
    if (polygon.length < 3) return new THREE.Vector3(0, 1, 0);

    const v1 = new THREE.Vector3().subVectors(polygon[1], polygon[0]);
    const v2 = new THREE.Vector3().subVectors(polygon[2], polygon[0]);
    const normal = new THREE.Vector3().crossVectors(v1, v2);
    normal.normalize();
    return normal;
  }

  /**
   * Generate unique plane ID
   */
  private generatePlaneId(): string {
    return `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Called when a new plane is detected
   */
  private onPlaneDetected(plane: DetectedPlane): void {
    console.log(`Plane detected: ${plane.orientation} at`, plane.center);

    const event = new CustomEvent('planeDetected', {
      detail: plane,
    });
    window.dispatchEvent(event);
  }

  /**
   * Called when a plane is removed
   */
  private onPlaneRemoved(plane: DetectedPlane): void {
    console.log(`Plane removed: ${plane.id}`);

    const event = new CustomEvent('planeRemoved', {
      detail: plane,
    });
    window.dispatchEvent(event);
  }

  /**
   * Get all detected planes
   */
  public getPlanes(): DetectedPlane[] {
    return Array.from(this.detectedPlanes.values());
  }

  /**
   * Get horizontal planes only
   */
  public getHorizontalPlanes(): DetectedPlane[] {
    return this.getPlanes().filter((plane) => plane.orientation === 'horizontal');
  }

  /**
   * Get vertical planes only
   */
  public getVerticalPlanes(): DetectedPlane[] {
    return this.getPlanes().filter((plane) => plane.orientation === 'vertical');
  }

  /**
   * Find closest plane to a point
   */
  public findClosestPlane(
    point: THREE.Vector3,
    orientation?: PlaneOrientation
  ): DetectedPlane | null {
    let planes = this.getPlanes();
    if (orientation) {
      planes = planes.filter((plane) => plane.orientation === orientation);
    }

    if (planes.length === 0) return null;

    return planes.reduce((closest, plane) => {
      const distToCurrent = point.distanceTo(plane.center);
      const distToClosest = point.distanceTo(closest.center);
      return distToCurrent < distToClosest ? plane : closest;
    });
  }

  /**
   * Toggle plane visualization
   */
  public setPlaneVisualization(show: boolean): void {
    this.showPlaneVisualization = show;
    this.planeMeshes.children.forEach((mesh) => {
      mesh.visible = show;
    });
  }

  /**
   * Check if point is on a plane
   */
  public isPointOnPlane(
    point: THREE.Vector3,
    plane: DetectedPlane,
    threshold: number = 0.05
  ): boolean {
    const distance = Math.abs(
      plane.normal.dot(point.clone().sub(plane.center))
    );
    return distance < threshold;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.detectedPlanes.forEach((plane) => {
      plane.mesh.geometry.dispose();
    });
    this.scene.remove(this.planeMeshes);
    this.detectedPlanes.clear();
    this.horizontalPlaneMaterial.dispose();
    this.verticalPlaneMaterial.dispose();
  }
}

// Usage example
export function initARSurfaceDetection(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
): ARSurfaceDetection {
  const surfaceDetection = new ARSurfaceDetection(scene, renderer);

  // Listen for plane detection events
  window.addEventListener('planeDetected', ((event: CustomEvent) => {
    const plane = event.detail as DetectedPlane;
    console.log(`New ${plane.orientation} plane detected`);
  }) as EventListener);

  return surfaceDetection;
}
