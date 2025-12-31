/**
 * VR Scene Setup Example
 *
 * This example demonstrates how to set up a basic VR scene using WebXR and Three.js.
 * It includes camera, renderer, lighting, and environment setup for VR experiences.
 */

import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';

export class VRSceneSetup {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private room: THREE.Group;

  constructor(container: HTMLElement) {
    this.clock = new THREE.Clock();

    // Initialize scene
    this.scene = this.createScene();

    // Initialize camera
    this.camera = this.createCamera();

    // Initialize renderer
    this.renderer = this.createRenderer(container);

    // Setup VR environment
    this.setupEnvironment();
    this.setupLighting();
    this.createRoom();

    // Add VR button
    this.addVRButton(container);

    // Start animation loop
    this.renderer.setAnimationLoop(this.animate.bind(this));

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  /**
   * Create and configure the Three.js scene
   */
  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010);
    scene.fog = new THREE.Fog(0x101010, 10, 50);
    return scene;
  }

  /**
   * Create and configure the camera for VR
   */
  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.6, 3); // Average human eye height
    return camera;
  }

  /**
   * Create and configure the WebGL renderer with XR support
   */
  private createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    return renderer;
  }

  /**
   * Setup environment elements like ground plane and skybox
   */
  private setupEnvironment(): void {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x202020,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid helper for spatial reference
    const grid = new THREE.GridHelper(100, 100, 0x404040, 0x202020);
    this.scene.add(grid);
  }

  /**
   * Setup lighting for the VR scene
   */
  private setupLighting(): void {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    // Hemisphere light for natural outdoor feel
    const hemisphereLight = new THREE.HemisphereLight(
      0x8888ff, // Sky color
      0xff8844, // Ground color
      0.4
    );
    this.scene.add(hemisphereLight);

    // Directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 40;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Point lights for accent lighting
    const pointLight1 = new THREE.PointLight(0xff0000, 0.5, 10);
    pointLight1.position.set(-3, 2, -3);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0000ff, 0.5, 10);
    pointLight2.position.set(3, 2, -3);
    this.scene.add(pointLight2);
  }

  /**
   * Create a room environment for the VR experience
   */
  private createRoom(): void {
    this.room = new THREE.Group();

    // Create walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      side: THREE.BackSide,
    });

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 5),
      wallMaterial
    );
    backWall.position.z = -5;
    backWall.position.y = 2.5;
    this.room.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 5),
      wallMaterial
    );
    leftWall.position.x = -5;
    leftWall.position.y = 2.5;
    leftWall.rotation.y = Math.PI / 2;
    this.room.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 5),
      wallMaterial
    );
    rightWall.position.x = 5;
    rightWall.position.y = 2.5;
    rightWall.rotation.y = -Math.PI / 2;
    this.room.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      wallMaterial
    );
    ceiling.position.y = 5;
    ceiling.rotation.x = Math.PI / 2;
    this.room.add(ceiling);

    // Add some decorative elements
    this.addDecorativeElements();

    this.scene.add(this.room);
  }

  /**
   * Add decorative elements to make the scene more interesting
   */
  private addDecorativeElements(): void {
    // Floating cubes
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.5,
        metalness: 0.5,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 8
      );
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      cube.castShadow = true;
      cube.receiveShadow = true;
      this.room.add(cube);
    }

    // Floating spheres
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.SphereGeometry(0.2, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.3,
        metalness: 0.7,
        emissive: Math.random() * 0xffffff,
        emissiveIntensity: 0.2,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 8
      );
      sphere.castShadow = true;
      this.room.add(sphere);
    }
  }

  /**
   * Add VR button to enter VR mode
   */
  private addVRButton(container: HTMLElement): void {
    const button = VRButton.createButton(this.renderer);
    button.style.position = 'absolute';
    button.style.bottom = '20px';
    button.style.left = '50%';
    button.style.transform = 'translateX(-50%)';
    container.appendChild(button);
  }

  /**
   * Handle window resize events
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Animation loop
   */
  private animate(): void {
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Animate decorative elements
    this.room.children.forEach((child, index) => {
      if (child instanceof THREE.Mesh) {
        child.rotation.x += delta * 0.5 * (index % 2 === 0 ? 1 : -1);
        child.rotation.y += delta * 0.3;
        child.position.y += Math.sin(elapsed * 2 + index) * 0.001;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get the scene for external manipulation
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera for external manipulation
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the renderer for external manipulation
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
}

// Usage example
export function initVRScene(): VRSceneSetup {
  const container = document.getElementById('app') || document.body;
  return new VRSceneSetup(container);
}
