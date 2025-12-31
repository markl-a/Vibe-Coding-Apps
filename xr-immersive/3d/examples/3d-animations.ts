/**
 * 3D Animations Example
 *
 * This example demonstrates various 3D animation techniques using Three.js.
 * Includes keyframe animations, skeletal animations, morph targets, and custom animations.
 */

import * as THREE from 'three';

export interface AnimationTrack {
  name: string;
  property: string;
  values: number[];
  times: number[];
  interpolation?: THREE.InterpolationModes;
}

export class Animations3D {
  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private mixers: Map<string, THREE.AnimationMixer> = new Map();
  private customAnimations: Map<string, CustomAnimation> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.clock = new THREE.Clock();
  }

  /**
   * Create a simple rotation animation
   */
  public createRotationAnimation(
    object: THREE.Object3D,
    axis: 'x' | 'y' | 'z',
    duration: number = 2,
    loop: boolean = true
  ): THREE.AnimationAction {
    const times = [0, duration];
    const values = [0, Math.PI * 2];

    const track = new THREE.NumberKeyframeTrack(
      `.rotation[${axis}]`,
      times,
      values
    );

    const clip = new THREE.AnimationClip('rotation', duration, [track]);

    const mixer = new THREE.AnimationMixer(object);
    const action = mixer.clipAction(clip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);

    const id = this.generateId();
    this.mixers.set(id, mixer);

    action.play();
    return action;
  }

  /**
   * Create a position animation (movement)
   */
  public createPositionAnimation(
    object: THREE.Object3D,
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    duration: number = 2,
    loop: boolean = false
  ): THREE.AnimationAction {
    const times = [0, duration];
    const values = [
      startPos.x, startPos.y, startPos.z,
      endPos.x, endPos.y, endPos.z,
    ];

    const track = new THREE.VectorKeyframeTrack(
      '.position',
      times,
      values
    );

    const clip = new THREE.AnimationClip('position', duration, [track]);

    const mixer = new THREE.AnimationMixer(object);
    const action = mixer.clipAction(clip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);

    const id = this.generateId();
    this.mixers.set(id, mixer);

    action.play();
    return action;
  }

  /**
   * Create a scale animation
   */
  public createScaleAnimation(
    object: THREE.Object3D,
    startScale: THREE.Vector3,
    endScale: THREE.Vector3,
    duration: number = 1,
    loop: boolean = false
  ): THREE.AnimationAction {
    const times = [0, duration];
    const values = [
      startScale.x, startScale.y, startScale.z,
      endScale.x, endScale.y, endScale.z,
    ];

    const track = new THREE.VectorKeyframeTrack(
      '.scale',
      times,
      values
    );

    const clip = new THREE.AnimationClip('scale', duration, [track]);

    const mixer = new THREE.AnimationMixer(object);
    const action = mixer.clipAction(clip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);

    const id = this.generateId();
    this.mixers.set(id, mixer);

    action.play();
    return action;
  }

  /**
   * Create a color animation
   */
  public createColorAnimation(
    material: THREE.MeshStandardMaterial,
    startColor: THREE.Color,
    endColor: THREE.Color,
    duration: number = 2,
    loop: boolean = true
  ): THREE.AnimationAction {
    const times = [0, duration];
    const values = [
      startColor.r, startColor.g, startColor.b,
      endColor.r, endColor.g, endColor.b,
    ];

    const track = new THREE.ColorKeyframeTrack(
      '.color',
      times,
      values
    );

    const clip = new THREE.AnimationClip('color', duration, [track]);

    const mixer = new THREE.AnimationMixer(material);
    const action = mixer.clipAction(clip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);

    const id = this.generateId();
    this.mixers.set(id, mixer);

    action.play();
    return action;
  }

  /**
   * Create a complex path animation using a curve
   */
  public createPathAnimation(
    object: THREE.Object3D,
    path: THREE.Curve<THREE.Vector3>,
    duration: number = 5,
    loop: boolean = true,
    lookAhead: boolean = true
  ): string {
    const id = this.generateId();

    const animation: CustomAnimation = {
      object,
      duration,
      elapsed: 0,
      loop,
      update: (delta: number) => {
        animation.elapsed += delta;
        const t = (animation.elapsed % duration) / duration;

        // Get position on curve
        const position = path.getPoint(t);
        object.position.copy(position);

        // Look ahead along the path
        if (lookAhead) {
          const lookAheadT = Math.min(t + 0.01, 1);
          const lookAheadPoint = path.getPoint(lookAheadT);
          object.lookAt(lookAheadPoint);
        }

        if (!loop && animation.elapsed >= duration) {
          return false; // Stop animation
        }
        return true; // Continue animation
      },
    };

    this.customAnimations.set(id, animation);
    return id;
  }

  /**
   * Create a bounce animation
   */
  public createBounceAnimation(
    object: THREE.Object3D,
    height: number = 1,
    duration: number = 1
  ): string {
    const id = this.generateId();
    const initialY = object.position.y;

    const animation: CustomAnimation = {
      object,
      duration,
      elapsed: 0,
      loop: true,
      update: (delta: number) => {
        animation.elapsed += delta;
        const t = (animation.elapsed % duration) / duration;

        // Sine wave for smooth bounce
        object.position.y = initialY + Math.abs(Math.sin(t * Math.PI)) * height;

        return true;
      },
    };

    this.customAnimations.set(id, animation);
    return id;
  }

  /**
   * Create a floating/hovering animation
   */
  public createFloatAnimation(
    object: THREE.Object3D,
    amplitude: number = 0.3,
    speed: number = 1
  ): string {
    const id = this.generateId();
    const initialY = object.position.y;

    const animation: CustomAnimation = {
      object,
      duration: Infinity,
      elapsed: 0,
      loop: true,
      update: (delta: number) => {
        animation.elapsed += delta * speed;
        object.position.y = initialY + Math.sin(animation.elapsed) * amplitude;
        return true;
      },
    };

    this.customAnimations.set(id, animation);
    return id;
  }

  /**
   * Create a spiral animation
   */
  public createSpiralAnimation(
    object: THREE.Object3D,
    radius: number = 2,
    height: number = 3,
    duration: number = 5,
    loop: boolean = true
  ): string {
    const id = this.generateId();
    const center = object.position.clone();

    const animation: CustomAnimation = {
      object,
      duration,
      elapsed: 0,
      loop,
      update: (delta: number) => {
        animation.elapsed += delta;
        const t = (animation.elapsed % duration) / duration;

        const angle = t * Math.PI * 4; // Two full rotations
        object.position.x = center.x + Math.cos(angle) * radius;
        object.position.z = center.z + Math.sin(angle) * radius;
        object.position.y = center.y + t * height;

        if (!loop && animation.elapsed >= duration) {
          return false;
        }
        return true;
      },
    };

    this.customAnimations.set(id, animation);
    return id;
  }

  /**
   * Create a pulsate animation (scale)
   */
  public createPulsateAnimation(
    object: THREE.Object3D,
    minScale: number = 0.8,
    maxScale: number = 1.2,
    speed: number = 2
  ): string {
    const id = this.generateId();
    const baseScale = object.scale.clone();

    const animation: CustomAnimation = {
      object,
      duration: Infinity,
      elapsed: 0,
      loop: true,
      update: (delta: number) => {
        animation.elapsed += delta * speed;
        const scale = minScale + (maxScale - minScale) * (Math.sin(animation.elapsed) * 0.5 + 0.5);
        object.scale.copy(baseScale).multiplyScalar(scale);
        return true;
      },
    };

    this.customAnimations.set(id, animation);
    return id;
  }

  /**
   * Create a shake animation
   */
  public createShakeAnimation(
    object: THREE.Object3D,
    intensity: number = 0.1,
    duration: number = 0.5
  ): string {
    const id = this.generateId();
    const initialPosition = object.position.clone();

    const animation: CustomAnimation = {
      object,
      duration,
      elapsed: 0,
      loop: false,
      update: (delta: number) => {
        animation.elapsed += delta;

        if (animation.elapsed < duration) {
          const progress = animation.elapsed / duration;
          const dampening = 1 - progress;

          object.position.x = initialPosition.x + (Math.random() - 0.5) * intensity * dampening;
          object.position.y = initialPosition.y + (Math.random() - 0.5) * intensity * dampening;
          object.position.z = initialPosition.z + (Math.random() - 0.5) * intensity * dampening;

          return true;
        } else {
          object.position.copy(initialPosition);
          return false;
        }
      },
    };

    this.customAnimations.set(id, animation);
    return id;
  }

  /**
   * Create a figure-8 path animation
   */
  public createFigure8Animation(
    object: THREE.Object3D,
    radius: number = 2,
    duration: number = 8,
    loop: boolean = true
  ): string {
    const id = this.generateId();
    const center = object.position.clone();

    const animation: CustomAnimation = {
      object,
      duration,
      elapsed: 0,
      loop,
      update: (delta: number) => {
        animation.elapsed += delta;
        const t = (animation.elapsed % duration) / duration;

        const angle = t * Math.PI * 2;
        object.position.x = center.x + radius * Math.sin(angle * 2);
        object.position.z = center.z + radius * Math.sin(angle);

        if (!loop && animation.elapsed >= duration) {
          return false;
        }
        return true;
      },
    };

    this.customAnimations.set(id, animation);
    return id;
  }

  /**
   * Create a morph target animation
   */
  public createMorphAnimation(
    mesh: THREE.Mesh,
    targetIndex: number,
    duration: number = 2,
    loop: boolean = true
  ): THREE.AnimationAction | null {
    if (!mesh.morphTargetInfluences) {
      console.warn('Mesh has no morph targets');
      return null;
    }

    const times = [0, duration / 2, duration];
    const values = [0, 1, 0];

    const track = new THREE.NumberKeyframeTrack(
      `.morphTargetInfluences[${targetIndex}]`,
      times,
      values
    );

    const clip = new THREE.AnimationClip('morph', duration, [track]);

    const mixer = new THREE.AnimationMixer(mesh);
    const action = mixer.clipAction(clip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);

    const id = this.generateId();
    this.mixers.set(id, mixer);

    action.play();
    return action;
  }

  /**
   * Stop a custom animation
   */
  public stopAnimation(animationId: string): boolean {
    return this.customAnimations.delete(animationId);
  }

  /**
   * Stop all animations
   */
  public stopAllAnimations(): void {
    this.mixers.forEach((mixer) => mixer.stopAllAction());
    this.customAnimations.clear();
  }

  /**
   * Update all animations (call in animation loop)
   */
  public update(): void {
    const delta = this.clock.getDelta();

    // Update Three.js mixers
    this.mixers.forEach((mixer) => {
      mixer.update(delta);
    });

    // Update custom animations
    this.customAnimations.forEach((animation, id) => {
      const shouldContinue = animation.update(delta);
      if (!shouldContinue) {
        this.customAnimations.delete(id);
      }
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stopAllAnimations();
    this.mixers.clear();
    this.customAnimations.clear();
  }
}

interface CustomAnimation {
  object: THREE.Object3D;
  duration: number;
  elapsed: number;
  loop: boolean;
  update: (delta: number) => boolean;
}

// Usage example
export function initAnimations(scene: THREE.Scene): Animations3D {
  const animations = new Animations3D(scene);

  // Example: Create a cube with various animations
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 1, -3);
  scene.add(cube);

  // Add rotation animation
  animations.createRotationAnimation(cube, 'y', 4, true);

  // Add floating animation
  animations.createFloatAnimation(cube, 0.3, 1);

  // Example: Create a sphere with bounce animation
  const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(2, 0, -3);
  scene.add(sphere);

  animations.createBounceAnimation(sphere, 2, 1);

  return animations;
}
