import * as THREE from 'three';
import { ARButton } from './ar-button';

class WebXRARViewer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private reticle: THREE.Mesh;
  private hitTestSource: XRHitTestSource | null = null;
  private hitTestSourceRequested = false;
  private placedObjects: THREE.Object3D[] = [];

  constructor() {
    this.container = document.getElementById('app')!;

    // Scene setup
    this.scene = new THREE.Scene();

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 5, 5);
    this.scene.add(directionalLight);

    // Reticle (placement indicator)
    this.reticle = this.createReticle();
    this.reticle.visible = false;
    this.scene.add(this.reticle);

    // AR Button
    const arButton = ARButton.createButton(this.renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.getElementById('overlay')! },
    });
    document.body.appendChild(arButton);

    // Event listeners
    this.setupEventListeners();

    // Start render loop
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  private createReticle(): THREE.Mesh {
    const geometry = new THREE.RingGeometry(0.08, 0.1, 32);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    return new THREE.Mesh(geometry, material);
  }

  private createObject(): THREE.Object3D {
    const group = new THREE.Group();

    // Create a colorful cube
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0xff0000 }), // right
      new THREE.MeshStandardMaterial({ color: 0x00ff00 }), // left
      new THREE.MeshStandardMaterial({ color: 0x0000ff }), // top
      new THREE.MeshStandardMaterial({ color: 0xffff00 }), // bottom
      new THREE.MeshStandardMaterial({ color: 0xff00ff }), // front
      new THREE.MeshStandardMaterial({ color: 0x00ffff }), // back
    ];

    const cube = new THREE.Mesh(geometry, materials);
    cube.position.y = 0.05; // Lift slightly above ground
    group.add(cube);

    return group;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Handle tap to place object
    const controller = this.renderer.xr.getController(0);
    controller.addEventListener('select', this.onSelect.bind(this));
    this.scene.add(controller);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onSelect(): void {
    if (this.reticle.visible) {
      const object = this.createObject();
      object.position.setFromMatrixPosition(this.reticle.matrix);
      object.quaternion.setFromRotationMatrix(this.reticle.matrix);

      this.scene.add(object);
      this.placedObjects.push(object);

      // Update counter
      this.updateObjectCount();
    }
  }

  private updateObjectCount(): void {
    const countElement = document.getElementById('object-count');
    if (countElement) {
      countElement.textContent = `Objects: ${this.placedObjects.length}`;
    }
  }

  private render(_timestamp: number, frame?: XRFrame): void {
    if (frame) {
      const referenceSpace = this.renderer.xr.getReferenceSpace();
      const session = this.renderer.xr.getSession();

      if (session && referenceSpace) {
        // Request hit test source
        if (!this.hitTestSourceRequested) {
          session.requestReferenceSpace('viewer').then((viewerSpace) => {
            session.requestHitTestSource?.({ space: viewerSpace })?.then((source) => {
              this.hitTestSource = source;
            });
          });

          session.addEventListener('end', () => {
            this.hitTestSourceRequested = false;
            this.hitTestSource = null;
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
            }
          } else {
            this.reticle.visible = false;
          }
        }
      }
    }

    // Animate placed objects
    const time = Date.now() * 0.001;
    this.placedObjects.forEach((obj, index) => {
      obj.rotation.y = time + index * 0.5;
    });

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new WebXRARViewer();
});
