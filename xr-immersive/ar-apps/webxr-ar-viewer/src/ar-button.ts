/**
 * AR Button for WebXR
 * Based on Three.js ARButton with customizations
 */

interface ARButtonOptions {
  requiredFeatures?: string[];
  optionalFeatures?: string[];
  domOverlay?: { root: HTMLElement };
}

export class ARButton {
  static createButton(
    renderer: THREE.WebGLRenderer,
    options: ARButtonOptions = {}
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.id = 'ar-button';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      background: #4CAF50;
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      z-index: 999;
      transition: background 0.3s;
    `;

    function showStartAR() {
      let currentSession: XRSession | null = null;

      async function onSessionStarted(session: XRSession) {
        session.addEventListener('end', onSessionEnded);
        await renderer.xr.setSession(session);
        button.textContent = 'EXIT AR';
        button.style.background = '#f44336';
        currentSession = session;
      }

      function onSessionEnded() {
        currentSession?.removeEventListener('end', onSessionEnded);
        button.textContent = 'START AR';
        button.style.background = '#4CAF50';
        currentSession = null;
      }

      button.textContent = 'START AR';

      button.onclick = async () => {
        if (currentSession === null) {
          const sessionInit: XRSessionInit = {
            requiredFeatures: options.requiredFeatures || ['hit-test'],
            optionalFeatures: options.optionalFeatures || [],
          };

          if (options.domOverlay) {
            sessionInit.optionalFeatures!.push('dom-overlay');
            sessionInit.domOverlay = options.domOverlay;
          }

          try {
            const session = await navigator.xr!.requestSession(
              'immersive-ar',
              sessionInit
            );
            await onSessionStarted(session);
          } catch (err) {
            console.error('Failed to start AR session:', err);
            alert('Failed to start AR session. Please try again.');
          }
        } else {
          currentSession.end();
        }
      };
    }

    function showARNotSupported() {
      button.textContent = 'AR NOT SUPPORTED';
      button.style.background = '#888';
      button.disabled = true;
    }

    function showARNotAllowed() {
      button.textContent = 'AR NOT ALLOWED';
      button.style.background = '#f44336';
      button.disabled = true;
    }

    if ('xr' in navigator) {
      navigator.xr!.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
          showStartAR();
        } else {
          showARNotSupported();
        }
      }).catch(showARNotAllowed);
    } else {
      showARNotSupported();
    }

    return button;
  }
}

// Type declarations for WebXR
declare global {
  interface Navigator {
    xr?: XRSystem;
  }

  interface XRSystem {
    isSessionSupported(mode: string): Promise<boolean>;
    requestSession(mode: string, options?: XRSessionInit): Promise<XRSession>;
  }

  interface XRSession {
    addEventListener(type: string, listener: () => void): void;
    removeEventListener(type: string, listener: () => void): void;
    requestReferenceSpace(type: string): Promise<XRReferenceSpace>;
    requestHitTestSource?(options: {
      space: XRReferenceSpace;
    }): Promise<XRHitTestSource>;
    end(): Promise<void>;
  }

  interface XRSessionInit {
    requiredFeatures?: string[];
    optionalFeatures?: string[];
    domOverlay?: { root: HTMLElement };
  }

  interface XRReferenceSpace {}

  interface XRHitTestSource {}

  interface XRFrame {
    getHitTestResults(source: XRHitTestSource): XRHitTestResult[];
  }

  interface XRHitTestResult {
    getPose(referenceSpace: XRReferenceSpace): XRPose | null;
  }

  interface XRPose {
    transform: {
      matrix: Float32Array;
    };
  }
}
