/**
 * 3D Model Loading Example
 *
 * This example demonstrates how to load and display various 3D model formats
 * using Three.js loaders. Supports GLTF, FBX, OBJ, and other common formats.
 */

import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

export interface ModelLoadOptions {
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
  castShadow?: boolean;
  receiveShadow?: boolean;
  autoCenter?: boolean;
  autoScale?: boolean;
  targetSize?: number;
}

export interface LoadedModel {
  id: string;
  name: string;
  object: THREE.Object3D;
  boundingBox: THREE.Box3;
  animations: THREE.AnimationClip[];
  mixer?: THREE.AnimationMixer;
  format: string;
  loadTime: number;
}

export class ModelLoader3D {
  private scene: THREE.Scene;
  private loadedModels: Map<string, LoadedModel> = new Map();
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private fbxLoader: FBXLoader;
  private objLoader: OBJLoader;
  private loadingManager: THREE.LoadingManager;
  private textureLoader: THREE.TextureLoader;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Setup loading manager for progress tracking
    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.onStart = this.onLoadStart.bind(this);
    this.loadingManager.onLoad = this.onLoadComplete.bind(this);
    this.loadingManager.onProgress = this.onLoadProgress.bind(this);
    this.loadingManager.onError = this.onLoadError.bind(this);

    // Setup loaders
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);

    // GLTF/GLB Loader with Draco compression support
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/'); // Path to Draco decoder
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // FBX Loader
    this.fbxLoader = new FBXLoader(this.loadingManager);

    // OBJ Loader
    this.objLoader = new OBJLoader(this.loadingManager);
  }

  /**
   * Load a GLTF/GLB model
   */
  public async loadGLTF(
    url: string,
    options: ModelLoadOptions = {}
  ): Promise<LoadedModel> {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf: GLTF) => {
          const model = this.processLoadedModel(
            gltf.scene,
            url,
            'gltf',
            gltf.animations,
            options,
            performance.now() - startTime
          );
          resolve(model);
        },
        (progress) => {
          this.onModelLoadProgress(url, progress);
        },
        (error) => {
          console.error(`Failed to load GLTF model: ${url}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load an FBX model
   */
  public async loadFBX(
    url: string,
    options: ModelLoadOptions = {}
  ): Promise<LoadedModel> {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (fbx: THREE.Group) => {
          const animations = fbx.animations || [];
          const model = this.processLoadedModel(
            fbx,
            url,
            'fbx',
            animations,
            options,
            performance.now() - startTime
          );
          resolve(model);
        },
        (progress) => {
          this.onModelLoadProgress(url, progress);
        },
        (error) => {
          console.error(`Failed to load FBX model: ${url}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load an OBJ model
   */
  public async loadOBJ(
    url: string,
    options: ModelLoadOptions = {}
  ): Promise<LoadedModel> {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      this.objLoader.load(
        url,
        (obj: THREE.Group) => {
          const model = this.processLoadedModel(
            obj,
            url,
            'obj',
            [],
            options,
            performance.now() - startTime
          );
          resolve(model);
        },
        (progress) => {
          this.onModelLoadProgress(url, progress);
        },
        (error) => {
          console.error(`Failed to load OBJ model: ${url}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Process loaded model with options
   */
  private processLoadedModel(
    object: THREE.Object3D,
    url: string,
    format: string,
    animations: THREE.AnimationClip[],
    options: ModelLoadOptions,
    loadTime: number
  ): LoadedModel {
    // Apply transformations
    if (options.position) {
      object.position.copy(options.position);
    }
    if (options.rotation) {
      object.rotation.copy(options.rotation);
    }
    if (options.scale) {
      object.scale.copy(options.scale);
    }

    // Calculate bounding box
    const boundingBox = new THREE.Box3().setFromObject(object);

    // Auto-center if requested
    if (options.autoCenter) {
      const center = boundingBox.getCenter(new THREE.Vector3());
      object.position.sub(center);
      boundingBox.setFromObject(object);
    }

    // Auto-scale if requested
    if (options.autoScale && options.targetSize) {
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      const scale = options.targetSize / maxDimension;
      object.scale.multiplyScalar(scale);
      boundingBox.setFromObject(object);
    }

    // Setup shadows
    if (options.castShadow !== false || options.receiveShadow !== false) {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = options.castShadow !== false;
          child.receiveShadow = options.receiveShadow !== false;
        }
      });
    }

    // Add to scene
    this.scene.add(object);

    // Create animation mixer if animations exist
    let mixer: THREE.AnimationMixer | undefined;
    if (animations.length > 0) {
      mixer = new THREE.AnimationMixer(object);
      console.log(`Model has ${animations.length} animations`);
    }

    // Create model data
    const model: LoadedModel = {
      id: this.generateModelId(),
      name: this.extractFileName(url),
      object,
      boundingBox,
      animations,
      mixer,
      format,
      loadTime,
    };

    this.loadedModels.set(model.id, model);

    console.log(
      `Loaded ${format.toUpperCase()} model: ${model.name} (${loadTime.toFixed(2)}ms)`
    );

    // Trigger event
    const event = new CustomEvent('modelLoaded', {
      detail: model,
    });
    window.dispatchEvent(event);

    return model;
  }

  /**
   * Load model with automatic format detection
   */
  public async loadModel(
    url: string,
    options: ModelLoadOptions = {}
  ): Promise<LoadedModel> {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'gltf':
      case 'glb':
        return this.loadGLTF(url, options);
      case 'fbx':
        return this.loadFBX(url, options);
      case 'obj':
        return this.loadOBJ(url, options);
      default:
        throw new Error(`Unsupported model format: ${extension}`);
    }
  }

  /**
   * Load multiple models
   */
  public async loadModels(
    urls: string[],
    options: ModelLoadOptions = {}
  ): Promise<LoadedModel[]> {
    const promises = urls.map((url) => this.loadModel(url, options));
    return Promise.all(promises);
  }

  /**
   * Play animation on a model
   */
  public playAnimation(
    modelId: string,
    animationIndex: number = 0,
    options: {
      loop?: boolean;
      clampWhenFinished?: boolean;
      timeScale?: number;
    } = {}
  ): THREE.AnimationAction | null {
    const model = this.loadedModels.get(modelId);
    if (!model || !model.mixer || !model.animations[animationIndex]) {
      console.warn(`Animation not available for model: ${modelId}`);
      return null;
    }

    const action = model.mixer.clipAction(model.animations[animationIndex]);
    action.setLoop(
      options.loop !== false ? THREE.LoopRepeat : THREE.LoopOnce,
      Infinity
    );
    action.clampWhenFinished = options.clampWhenFinished || false;
    action.timeScale = options.timeScale || 1.0;
    action.play();

    return action;
  }

  /**
   * Stop all animations on a model
   */
  public stopAnimations(modelId: string): void {
    const model = this.loadedModels.get(modelId);
    if (model?.mixer) {
      model.mixer.stopAllAction();
    }
  }

  /**
   * Update animations (call in animation loop)
   */
  public update(deltaTime: number): void {
    this.loadedModels.forEach((model) => {
      if (model.mixer) {
        model.mixer.update(deltaTime);
      }
    });
  }

  /**
   * Remove model from scene
   */
  public removeModel(modelId: string): boolean {
    const model = this.loadedModels.get(modelId);
    if (!model) return false;

    this.scene.remove(model.object);

    // Cleanup
    model.object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        }
      }
    });

    this.loadedModels.delete(modelId);
    return true;
  }

  /**
   * Get model by ID
   */
  public getModel(modelId: string): LoadedModel | undefined {
    return this.loadedModels.get(modelId);
  }

  /**
   * Get all loaded models
   */
  public getAllModels(): LoadedModel[] {
    return Array.from(this.loadedModels.values());
  }

  /**
   * Clone a loaded model
   */
  public cloneModel(modelId: string, position?: THREE.Vector3): LoadedModel | null {
    const original = this.loadedModels.get(modelId);
    if (!original) return null;

    const clonedObject = original.object.clone();
    if (position) {
      clonedObject.position.copy(position);
    }

    this.scene.add(clonedObject);

    const clonedModel: LoadedModel = {
      id: this.generateModelId(),
      name: `${original.name}_clone`,
      object: clonedObject,
      boundingBox: new THREE.Box3().setFromObject(clonedObject),
      animations: original.animations,
      mixer: original.animations.length > 0
        ? new THREE.AnimationMixer(clonedObject)
        : undefined,
      format: original.format,
      loadTime: 0,
    };

    this.loadedModels.set(clonedModel.id, clonedModel);
    return clonedModel;
  }

  /**
   * Loading callbacks
   */
  private onLoadStart(url: string, loaded: number, total: number): void {
    console.log(`Loading started: ${url}`);
  }

  private onLoadComplete(): void {
    console.log('All resources loaded');
  }

  private onLoadProgress(url: string, loaded: number, total: number): void {
    const progress = (loaded / total) * 100;
    console.log(`Loading: ${progress.toFixed(2)}%`);
  }

  private onLoadError(url: string): void {
    console.error(`Error loading: ${url}`);
  }

  private onModelLoadProgress(url: string, progress: ProgressEvent): void {
    if (progress.lengthComputable) {
      const percentComplete = (progress.loaded / progress.total) * 100;
      console.log(`${url}: ${percentComplete.toFixed(2)}%`);
    }
  }

  /**
   * Utility functions
   */
  private generateModelId(): string {
    return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractFileName(url: string): string {
    return url.split('/').pop()?.split('.')[0] || 'unknown';
  }

  /**
   * Clean up all resources
   */
  public dispose(): void {
    this.loadedModels.forEach((model) => {
      this.removeModel(model.id);
    });
    this.dracoLoader.dispose();
  }
}

// Usage example
export async function initModelLoader(scene: THREE.Scene): Promise<ModelLoader3D> {
  const loader = new ModelLoader3D(scene);

  // Example: Load a GLTF model
  try {
    const model = await loader.loadGLTF('/models/sample.glb', {
      position: new THREE.Vector3(0, 0, -2),
      autoCenter: true,
      autoScale: true,
      targetSize: 1,
      castShadow: true,
      receiveShadow: true,
    });

    // Play first animation if available
    if (model.animations.length > 0) {
      loader.playAnimation(model.id, 0, { loop: true });
    }
  } catch (error) {
    console.error('Failed to load model:', error);
  }

  return loader;
}
