import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  getAvatarItemById,
  getHairColorById,
  getSkinToneById,
  getStudioBackgroundById,
} from '../../data/avatarCatalog';
import type { AvatarConfig, FaceExpressionId } from '../../types/avatar';

export interface ChibiAvatar3DHandle {
  captureSnapshot: (options?: {
    transparent?: boolean;
    width?: number;
    height?: number;
  }) => string | null;
  resetCamera: () => void;
  triggerBounce: () => void;
}

interface ChibiAvatar3DProps {
  config: AvatarConfig;
  className?: string;
  interactive?: boolean;
  autoRotate?: boolean;
  showFloorPedestal?: boolean;
}

function detectSoftwareWebGL(renderer: THREE.WebGLRenderer): boolean {
  try {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '')
      : String(gl.getParameter(gl.RENDERER) ?? '');
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(
      rendererStr
    );
  } catch {
    return false;
  }
}

function createSoftShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.06,
      size / 2,
      size / 2,
      size * 0.48
    );
    grad.addColorStop(0, 'rgba(37, 41, 46, 0.30)');
    grad.addColorStop(0.5, 'rgba(37, 41, 46, 0.14)');
    grad.addColorStop(1, 'rgba(37, 41, 46, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      for (const m of mat) {
        disposeMaterial(m);
      }
    } else if (mat) {
      disposeMaterial(mat);
    }
  });
}

function disposeMaterial(mat: THREE.Material): void {
  const std = mat as THREE.MeshStandardMaterial;
  std.map?.dispose();
  std.normalMap?.dispose();
  std.roughnessMap?.dispose();
  std.alphaMap?.dispose();
  mat.dispose();
}

function vinylMat(
  color: string | number,
  roughness = 0.56,
  metalness = 0.03
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

function glossyMat(
  color: string | number,
  roughness = 0.09,
  metalness = 0.08
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

function buildFaceFeatures(
  faceId: FaceExpressionId,
  blushHex: string
): THREE.Group {
  const face = new THREE.Group();
  const darkEyeMat = glossyMat('#2B1710', 0.06, 0.12);
  const irisWarmMat = glossyMat('#5A2E1A', 0.14, 0.05);
  const whiteMat = glossyMat('#FFFFFF', 0.08, 0.0);
  const browMat = vinylMat('#6E432C', 0.6, 0.02);
  const noseMat = glossyMat('#7C4222', 0.18, 0.04);
  const mouthInsideMat = vinylMat('#9D3F3B', 0.52, 0.0);
  const tongueMat = vinylMat('#EA827F', 0.48, 0.0);
  const blushMat = new THREE.MeshStandardMaterial({
    color: blushHex,
    roughness: 0.72,
    metalness: 0.0,
    transparent: true,
    opacity: 0.36,
  });

  // Button nose (reference vinyl toy signature)
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.062, 20, 16), noseMat);
  nose.scale.set(1.32, 0.92, 0.92);
  nose.position.set(0, -0.075, 0.755);
  face.add(nose);

  const noseSpec = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 10, 10),
    whiteMat
  );
  noseSpec.position.set(-0.022, -0.058, 0.805);
  face.add(noseSpec);

  // Rosy cheek blushes
  for (const side of [-1, 1]) {
    const blush = new THREE.Mesh(
      new THREE.SphereGeometry(0.115, 18, 14),
      blushMat
    );
    blush.scale.set(1.35, 0.72, 0.25);
    blush.position.set(side * 0.42, -0.17, 0.625);
    blush.rotation.y = side * 0.42;
    face.add(blush);
  }

  // Helper for big glossy vinyl eyes
  const addGlossyEye = (side: -1 | 1, scaleY = 1, scaleAll = 1) => {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.305, -0.015, 0.675);
    eyeGroup.rotation.y = side * 0.24;
    eyeGroup.scale.set(scaleAll, scaleAll * scaleY, scaleAll);

    // Subtle white sclera rim
    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 24, 20),
      whiteMat
    );
    sclera.scale.set(1.03, 1.08, 0.48);
    eyeGroup.add(sclera);

    // Main dark glossy iris
    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(0.128, 24, 20),
      darkEyeMat
    );
    iris.scale.set(1.0, 1.07, 0.52);
    iris.position.set(0, -0.004, 0.02);
    eyeGroup.add(iris);

    // Lower warm brown glow
    const warmArc = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 18, 14),
      irisWarmMat
    );
    warmArc.scale.set(0.95, 0.65, 0.45);
    warmArc.position.set(0, -0.042, 0.036);
    eyeGroup.add(warmArc);

    // Dual white catchlights
    const bigSpark = new THREE.Mesh(
      new THREE.SphereGeometry(0.037, 14, 12),
      whiteMat
    );
    bigSpark.position.set(-0.044, 0.048, 0.072);
    eyeGroup.add(bigSpark);

    const smallSpark = new THREE.Mesh(
      new THREE.SphereGeometry(0.017, 10, 10),
      whiteMat
    );
    smallSpark.position.set(0.045, -0.046, 0.07);
    eyeGroup.add(smallSpark);

    // Soft top eyelash arch
    const lash = new THREE.Mesh(
      new THREE.TorusGeometry(0.145, 0.016, 10, 24, Math.PI * 0.78),
      darkEyeMat
    );
    lash.rotation.z = Math.PI * 0.11;
    lash.position.set(0, 0.016, 0.045);
    eyeGroup.add(lash);

    face.add(eyeGroup);
  };

  // Helper for smiling squint eye (^ ^)
  const addSquintEye = (side: -1 | 1) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.026, 12, 24, Math.PI * 0.84),
      darkEyeMat
    );
    arc.position.set(side * 0.305, -0.025, 0.705);
    arc.rotation.y = side * 0.24;
    arc.rotation.z = Math.PI * 0.08;
    face.add(arc);
  };

  // Eyebrows
  const addEyebrows = (tilt = 0.18, yOffset = 0.255) => {
    for (const side of [-1, 1] as const) {
      const brow = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.024, 0.105, 8, 12),
        browMat
      );
      brow.position.set(side * 0.28, yOffset, 0.68);
      brow.rotation.z = Math.PI / 2 - side * tilt;
      brow.rotation.y = side * 0.22;
      face.add(brow);
    }
  };

  // Happy open smile (reference toy smile)
  const addHappyOpenMouth = () => {
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.255, 0.715);

    const cavity = new THREE.Mesh(
      new THREE.SphereGeometry(0.125, 22, 16),
      mouthInsideMat
    );
    cavity.scale.set(1.08, 0.78, 0.34);
    mouthGroup.add(cavity);

    const upperLipMask = new THREE.Mesh(
      new THREE.TorusGeometry(0.118, 0.018, 10, 20, Math.PI),
      darkEyeMat
    );
    upperLipMask.rotation.z = Math.PI;
    upperLipMask.position.set(0, 0.055, 0.025);
    mouthGroup.add(upperLipMask);

    const tongue = new THREE.Mesh(
      new THREE.SphereGeometry(0.082, 16, 12),
      tongueMat
    );
    tongue.scale.set(1.05, 0.56, 0.36);
    tongue.position.set(0, -0.035, 0.02);
    mouthGroup.add(tongue);

    face.add(mouthGroup);
  };

  // Gentle closed smile
  const addGentleSmile = (offsetX = 0, rotZ = 0) => {
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.095, 0.02, 10, 22, Math.PI * 0.76),
      darkEyeMat
    );
    smile.position.set(offsetX, -0.225, 0.725);
    smile.rotation.z = Math.PI + Math.PI * 0.12 + rotZ;
    face.add(smile);
  };

  switch (faceId) {
    case 'happy_squint':
      addSquintEye(-1);
      addSquintEye(1);
      addEyebrows(0.24, 0.27);
      addHappyOpenMouth();
      break;
    case 'cool_confident':
      addGlossyEye(-1, 0.78, 0.94);
      addGlossyEye(1, 0.78, 0.94);
      addEyebrows(-0.08, 0.225);
      addGentleSmile(0.02, 0.14);
      break;
    case 'playful_wink':
      addGlossyEye(-1, 1.0, 1.02);
      addSquintEye(1);
      addEyebrows(0.22, 0.265);
      addHappyOpenMouth();
      break;
    case 'cute_surprised': {
      addGlossyEye(-1, 1.08, 1.07);
      addGlossyEye(1, 1.08, 1.07);
      addEyebrows(0.28, 0.3);
      const oMouth = new THREE.Mesh(
        new THREE.SphereGeometry(0.068, 18, 14),
        mouthInsideMat
      );
      oMouth.scale.set(0.95, 1.08, 0.45);
      oMouth.position.set(0, -0.255, 0.73);
      face.add(oMouth);
      break;
    }
    case 'sparkle_round':
    default:
      addGlossyEye(-1, 1.0, 1.03);
      addGlossyEye(1, 1.0, 1.03);
      addEyebrows(0.22, 0.265);
      addHappyOpenMouth();
      break;
  }

  return face;
}

function buildHairGroup(
  hairId: string,
  hairHex: string,
  accentHex = '#D46534'
): THREE.Group {
  const hair = new THREE.Group();
  const mainMat = vinylMat(hairHex, 0.62, 0.02);
  const accentMat = vinylMat(accentHex, 0.5, 0.04);

  if (hairId === 'fluffy_curls') {
    // Cloud-like plush blind-box curls inspired directly by reference image
    const puffs: [number, number, number, number, number?, number?, number?][] = [
      // Top hero cloud puffs
      [-0.22, 0.62, 0.26, 0.44, 1.15, 0.96, 0.98],
      [0.34, 0.46, 0.24, 0.36, 1.04, 1.0, 0.96],
      [-0.58, 0.36, 0.08, 0.35, 0.98, 1.04, 1.0],
      [0.64, 0.24, 0.02, 0.34, 0.96, 1.04, 1.0],
      [0.02, 0.58, -0.22, 0.46, 1.16, 0.98, 1.0],
      // Back full volume curls
      [-0.46, 0.14, -0.45, 0.4, 1.0, 1.05, 1.0],
      [0.46, 0.14, -0.45, 0.4, 1.0, 1.05, 1.0],
      [0.0, 0.06, -0.62, 0.44, 1.18, 1.02, 0.92],
      // Lower side neck curls behind ears
      [-0.64, -0.28, -0.22, 0.27, 1.0, 1.0, 1.0],
      [0.64, -0.28, -0.22, 0.27, 1.0, 1.0, 1.0],
      [-0.36, -0.42, -0.48, 0.28, 1.05, 0.92, 0.95],
      [0.36, -0.42, -0.48, 0.28, 1.05, 0.92, 0.95],
      [0.0, -0.44, -0.56, 0.3, 1.15, 0.88, 0.9],
      // Little side-burn curls hugging temples
      [-0.68, 0.04, 0.26, 0.16, 0.82, 1.18, 0.85],
      [0.68, 0.04, 0.26, 0.16, 0.82, 1.18, 0.85],
    ];
    for (const [x, y, z, r, sx = 1, sy = 1, sz = 1] of puffs) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 24, 20),
        mainMat
      );
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      hair.add(mesh);
    }
    // Cute little sprout tuft on crown
    const sprout = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.075, 0.13, 10, 14),
      mainMat
    );
    sprout.position.set(0.24, 0.94, 0.05);
    sprout.rotation.z = -0.55;
    hair.add(sprout);
    return hair;
  }

  // Smooth rounded hair dome shared by sleeker styles
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.835, 36, 30, 0, Math.PI * 2, 0, Math.PI * 0.64),
    mainMat
  );
  cap.scale.set(1.06, 0.99, 1.02);
  cap.position.set(0, 0.05, -0.02);
  hair.add(cap);

  // Back skull shell
  const backShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.815, 32, 26),
    mainMat
  );
  backShell.scale.set(1.04, 0.95, 0.92);
  backShell.position.set(0, -0.04, -0.15);
  hair.add(backShell);

  if (hairId === 'neat_bangs') {
    for (let i = -3; i <= 3; i++) {
      const t = i / 3;
      const bang = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.125, 0.22, 10, 14),
        mainMat
      );
      bang.position.set(t * 0.52, 0.44 - Math.abs(t) * 0.06, 0.64 - Math.abs(t) * 0.14);
      bang.rotation.x = 0.24;
      bang.rotation.z = -t * 0.14;
      hair.add(bang);
    }
    for (const side of [-1, 1]) {
      const sideLock = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.12, 0.42, 10, 14),
        mainMat
      );
      sideLock.position.set(side * 0.72, -0.06, 0.18);
      sideLock.rotation.z = side * 0.1;
      hair.add(sideLock);
    }
  } else if (hairId === 'soft_bob') {
    // Full rounded bob hugging jawline
    const bobBack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.82, 0.9, 0.78, 32, 1, false, Math.PI * 0.42, Math.PI * 1.16),
      mainMat
    );
    bobBack.position.set(0, -0.24, -0.06);
    hair.add(bobBack);

    for (const side of [-1, 1]) {
      const cheekCurve = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.18, 0.56, 12, 16),
        mainMat
      );
      cheekCurve.position.set(side * 0.74, -0.18, 0.14);
      cheekCurve.rotation.z = -side * 0.16;
      hair.add(cheekCurve);
    }
    // Swept side bangs
    const leftFringe = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 20, 16),
      mainMat
    );
    leftFringe.scale.set(1.45, 0.72, 0.62);
    leftFringe.position.set(-0.24, 0.5, 0.56);
    leftFringe.rotation.z = 0.25;
    hair.add(leftFringe);

    const rightFringe = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 16),
      mainMat
    );
    rightFringe.scale.set(1.3, 0.68, 0.6);
    rightFringe.position.set(0.34, 0.48, 0.54);
    rightFringe.rotation.z = -0.32;
    hair.add(rightFringe);
  } else if (hairId === 'twin_buns') {
    // Parted curtain bangs
    for (const side of [-1, 1]) {
      const curtain = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 20, 16),
        mainMat
      );
      curtain.scale.set(1.25, 0.78, 0.64);
      curtain.position.set(side * 0.3, 0.48, 0.58);
      curtain.rotation.z = -side * 0.35;
      hair.add(curtain);

      // Cute top twin bun + ribbon tie
      const bun = new THREE.Mesh(
        new THREE.SphereGeometry(0.27, 22, 18),
        mainMat
      );
      bun.position.set(side * 0.62, 0.74, -0.05);
      hair.add(bun);

      const tie = new THREE.Mesh(
        new THREE.TorusGeometry(0.19, 0.045, 10, 20),
        accentMat
      );
      tie.position.set(side * 0.56, 0.63, -0.04);
      tie.rotation.set(Math.PI / 2, side * 0.45, 0);
      hair.add(tie);
    }
  } else if (hairId === 'fresh_undercut') {
    // Swept volumetric top quiff
    const quiffParts: [number, number, number, number, number, number, number][] = [
      [0.05, 0.76, 0.22, 0.38, 1.35, 0.76, 1.05],
      [-0.28, 0.68, 0.32, 0.28, 1.25, 0.72, 0.95],
      [0.36, 0.66, 0.14, 0.3, 1.15, 0.74, 0.96],
      [0.0, 0.72, -0.14, 0.4, 1.25, 0.78, 1.05],
    ];
    for (const [x, y, z, r, sx, sy, sz] of quiffParts) {
      const tuft = new THREE.Mesh(
        new THREE.SphereGeometry(r, 22, 18),
        mainMat
      );
      tuft.position.set(x, y, z);
      tuft.scale.set(sx, sy, sz);
      hair.add(tuft);
    }
  } else if (hairId === 'long_flowing') {
    // Graceful long hair sweeping past shoulders
    const backCurtain = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.68, 0.85, 14, 24),
      mainMat
    );
    backCurtain.scale.set(1.16, 1.0, 0.56);
    backCurtain.position.set(0, -0.45, -0.42);
    hair.add(backCurtain);

    for (const side of [-1, 1]) {
      const frontStrand = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.17, 0.86, 12, 16),
        mainMat
      );
      frontStrand.position.set(side * 0.68, -0.32, 0.1);
      frontStrand.rotation.z = side * 0.08;
      hair.add(frontStrand);

      const fringe = new THREE.Mesh(
        new THREE.SphereGeometry(0.27, 18, 14),
        mainMat
      );
      fringe.scale.set(1.25, 0.76, 0.65);
      fringe.position.set(side * 0.29, 0.49, 0.57);
      fringe.rotation.z = -side * 0.34;
      hair.add(fringe);
    }
  }

  return hair;
}

function buildCharacter(config: AvatarConfig): {
  root: THREE.Group;
  headGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
} {
  const root = new THREE.Group();

  const skin = getSkinToneById(config.skinId);
  const hairColor = getHairColorById(config.hairColorId);
  const topItem = getAvatarItemById(config.topId);
  const bottomItem = getAvatarItemById(config.bottomId);
  const shoesItem = getAvatarItemById(config.shoesId);

  const skinMat = vinylMat(skin.hex, 0.54, 0.02);
  const skinShadowMat = vinylMat(skin.shadowHex, 0.6, 0.02);

  // =======================================================
  // 1. HEAD + EARS + FACE + HAIR + HEADWEAR/EYEWEAR/AUDIO
  // =======================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.67, 0);

  // Rounded-squircle Chibi head
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.755, 40, 34),
    skinMat
  );
  headMesh.scale.set(1.07, 0.96, 1.0);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Plump rounded vinyl ears
  for (const side of [-1, 1]) {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.81, -0.07, 0.01);
    earGroup.rotation.z = -side * 0.14;

    const earOuter = new THREE.Mesh(
      new THREE.SphereGeometry(0.185, 22, 18),
      skinMat
    );
    earOuter.scale.set(0.88, 1.02, 0.62);
    earGroup.add(earOuter);

    const earInner = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 16, 12),
      skinShadowMat
    );
    earInner.scale.set(0.82, 0.92, 0.4);
    earInner.position.set(0, -0.01, 0.065);
    earGroup.add(earInner);

    headGroup.add(earGroup);
  }

  // Facial features
  const faceGroup = buildFaceFeatures(config.faceId, skin.blushHex);
  headGroup.add(faceGroup);

  // Hairstyle
  const hairItem = getAvatarItemById(config.hairId);
  const hairGroup = buildHairGroup(
    config.hairId,
    hairColor.hex,
    hairItem?.modelConfig.accentColor ?? '#D46534'
  );
  headGroup.add(hairGroup);

  // =======================================================
  // 2. NECK + TORSO + TOPS + ARMS
  // =======================================================
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.2, 22),
    skinShadowMat
  );
  neck.position.set(0, 0.99, 0);
  root.add(neck);

  const topPrimary = topItem?.modelConfig.primaryColor ?? '#F6DF6C';
  const topSecondary = topItem?.modelConfig.secondaryColor ?? '#8BC9D1';
  const topAccent = topItem?.modelConfig.accentColor ?? '#F3B465';
  const topVariant = topItem?.modelConfig.styleVariant ?? 'basic_tee';

  const topMainMat = vinylMat(topPrimary, 0.6, 0.03);
  const topSecMat = vinylMat(topSecondary, 0.58, 0.03);
  const topAccMat = vinylMat(topAccent, 0.48, 0.06);

  // Base compact A-line Chibi torso
  const torsoMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.44, 0.64, 34),
    topVariant === 'craft_apron' ? topSecMat : topMainMat
  );
  torsoMesh.position.set(0, 0.68, 0);
  torsoMesh.castShadow = true;
  root.add(torsoMesh);

  // Rounded upper shoulder dome
  const shoulderCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 28, 20),
    topVariant === 'craft_apron' ? topSecMat : topMainMat
  );
  shoulderCap.scale.set(1.06, 0.55, 0.98);
  shoulderCap.position.set(0, 0.96, 0);
  root.add(shoulderCap);

  // Collar detail
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.21, 0.056, 14, 28),
    topVariant === 'basic_tee' ||
      topVariant === 'bomber_jacket' ||
      topVariant === 'guardian_jacket'
      ? topSecMat
      : topMainMat
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.97, 0.01);
  root.add(collar);

  // Style-specific details for each Top
  if (topVariant === 'warm_hoodie') {
    // Hood resting behind neck
    const hood = new THREE.Mesh(
      new THREE.TorusGeometry(0.29, 0.105, 14, 24, Math.PI * 1.3),
      topMainMat
    );
    hood.rotation.set(Math.PI * 0.42, 0, Math.PI * 0.85);
    hood.position.set(0, 0.97, -0.14);
    root.add(hood);

    // Kangaroo front pocket
    const pocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.19, 0.12),
      topMainMat
    );
    pocket.position.set(0, 0.52, 0.37);
    root.add(pocket);

    // Drawstrings
    for (const side of [-1, 1]) {
      const string = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.016, 0.22, 6, 10),
        topSecMat
      );
      string.position.set(side * 0.095, 0.8, 0.34);
      root.add(string);

      const aglet = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 10, 10),
        topAccMat
      );
      aglet.position.set(side * 0.095, 0.68, 0.35);
      root.add(aglet);
    }
  } else if (topVariant === 'bomber_jacket' || topVariant === 'guardian_jacket') {
    // Ribbed bottom hem
    const hem = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.048, 12, 32),
      topVariant === 'guardian_jacket' ? topAccMat : topSecMat
    );
    hem.rotation.x = Math.PI / 2;
    hem.position.set(0, 0.38, 0);
    root.add(hem);

    // Center placket zip line
    const placket = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.58, 0.06),
      topVariant === 'guardian_jacket' ? topAccMat : topSecMat
    );
    placket.position.set(0, 0.67, 0.385);
    root.add(placket);

    // Chest craft emblem patch
    const emblem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.072, 0.03, 18),
      topVariant === 'guardian_jacket'
        ? glossyMat('#E6B34B', 0.25, 0.45)
        : topAccMat
    );
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0.16, 0.77, 0.345);
    root.add(emblem);
  } else if (topVariant === 'cropped_jacket') {
    // Layered white inner shirt hem peeking underneath
    const innerHem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.455, 0.14, 30),
      topSecMat
    );
    innerHem.position.set(0, 0.37, 0);
    root.add(innerHem);

    // Open center panel showing inner tee
    const innerStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.52, 0.08),
      topSecMat
    );
    innerStrip.position.set(0, 0.69, 0.36);
    root.add(innerStrip);
  } else if (topVariant === 'ba_ba_modern') {
    // Flared traditional Bà Ba tunic skirt hem
    const tunicFlare = new THREE.Mesh(
      new THREE.CylinderGeometry(0.43, 0.49, 0.18, 32),
      topMainMat
    );
    tunicFlare.position.set(0, 0.34, 0);
    root.add(tunicFlare);

    // Cloth buttons down center
    for (let i = 0; i < 4; i++) {
      const btn = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 12, 10),
        topSecMat
      );
      btn.position.set(0, 0.84 - i * 0.115, 0.375 + i * 0.015);
      root.add(btn);
    }

    // Two small side pockets
    for (const side of [-1, 1]) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.12, 0.05),
        topMainMat
      );
      p.position.set(side * 0.21, 0.46, 0.39);
      p.rotation.y = side * 0.38;
      root.add(p);
    }
  } else if (topVariant === 'ao_dai_modern') {
    // High mandarin collar
    const mandarin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.215, 0.23, 0.11, 28),
      topMainMat
    );
    mandarin.position.set(0, 1.0, 0);
    root.add(mandarin);

    // Front & back graceful Ao Dai panels (tà áo)
    const frontFlap = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.38, 0.055),
      topMainMat
    );
    frontFlap.position.set(0, 0.25, 0.38);
    frontFlap.rotation.x = -0.14;
    root.add(frontFlap);

    const backFlap = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.38, 0.055),
      topMainMat
    );
    backFlap.position.set(0, 0.25, -0.38);
    backFlap.rotation.x = 0.14;
    root.add(backFlap);

    // Diagonal golden button accent
    for (let i = 0; i < 3; i++) {
      const knot = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 10, 10),
        topAccMat
      );
      knot.position.set(0.07 + i * 0.065, 0.89 - i * 0.075, 0.345 + i * 0.01);
      root.add(knot);
    }
  } else if (topVariant === 'craft_apron') {
    // Canvas leather apron layered over crisp cream shirt
    const apronBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.465, 0.56, 26, 1, false, -Math.PI * 0.38, Math.PI * 0.76),
      topMainMat
    );
    apronBody.position.set(0, 0.61, 0.03);
    root.add(apronBody);

    // Apron shoulder straps
    for (const side of [-1, 1]) {
      const strap = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.028, 0.22, 8, 12),
        topMainMat
      );
      strap.position.set(side * 0.16, 0.92, 0.22);
      strap.rotation.x = -0.38;
      root.add(strap);
    }

    // Utility pocket + thread spool accent
    const apronPocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.17, 0.08),
      vinylMat('#734630', 0.65, 0.02)
    );
    apronPocket.position.set(0, 0.5, 0.43);
    root.add(apronPocket);

    const redSpool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.09, 14),
      vinylMat('#B93818', 0.52, 0.02)
    );
    redSpool.position.set(-0.08, 0.6, 0.435);
    redSpool.rotation.z = 0.18;
    root.add(redSpool);
  } else if (topVariant === 'winter_knit') {
    // Cream knit chest band
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.37, 0.405, 0.12, 32),
      topSecMat
    );
    stripe.position.set(0, 0.72, 0);
    root.add(stripe);

    const stripe2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.398, 0.415, 0.055, 32),
      topAccMat
    );
    stripe2.position.set(0, 0.635, 0);
    root.add(stripe2);
  }

  // Chubby Arms + Mitten Hands
  const buildArm = (side: -1 | 1): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.39, 0.87, 0.02);

    let sleeveMat = topMainMat;
    if (topVariant === 'basic_tee') {
      // Raglan contrast sleeves like reference toy (peach left / mint right)
      sleeveMat = side === -1 ? topAccMat : topSecMat;
    } else if (
      topVariant === 'bomber_jacket' ||
      topVariant === 'guardian_jacket' ||
      topVariant === 'craft_apron'
    ) {
      sleeveMat = topSecMat;
    }

    // Sleeve puff
    const sleeve = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.145, 0.16, 12, 18),
      sleeveMat
    );
    sleeve.position.set(side * 0.08, -0.06, 0);
    sleeve.rotation.z = side * 0.72;
    arm.add(sleeve);

    // Chubby forearm / hand
    const isLongSleeve =
      topVariant === 'warm_hoodie' ||
      topVariant === 'bomber_jacket' ||
      topVariant === 'cropped_jacket' ||
      topVariant === 'winter_knit' ||
      topVariant === 'guardian_jacket' ||
      topVariant === 'ao_dai_modern';

    const forearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.118, 0.18, 12, 16),
      isLongSleeve ? sleeveMat : skinMat
    );
    forearm.position.set(side * 0.21, -0.17, 0.04);
    forearm.rotation.z = side * 0.65;
    forearm.rotation.x = -0.18;
    arm.add(forearm);

    // Plump mitten hand
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 20, 16),
      skinMat
    );
    hand.scale.set(1.06, 0.96, 0.96);
    hand.position.set(side * 0.31, -0.25, 0.07);
    arm.add(hand);

    // Little thumb nub
    const thumb = new THREE.Mesh(
      new THREE.SphereGeometry(0.056, 14, 12),
      skinMat
    );
    thumb.position.set(side * 0.27, -0.2, 0.155);
    arm.add(thumb);

    return arm;
  };

  const leftArmGroup = buildArm(-1);
  const rightArmGroup = buildArm(1);
  root.add(leftArmGroup);
  root.add(rightArmGroup);

  // =======================================================
  // 3. BOTTOMS + LEGS + SHOES
  // =======================================================
  const bottomPrimary = bottomItem?.modelConfig.primaryColor ?? '#EA766C';
  const bottomSecondary = bottomItem?.modelConfig.secondaryColor ?? '#D65E54';
  const bottomVariant = bottomItem?.modelConfig.styleVariant ?? 'active_shorts';
  const bottomMat = vinylMat(bottomPrimary, 0.62, 0.02);
  const bottomSecMat = vinylMat(bottomSecondary, 0.58, 0.02);

  // Pelvis / waist base
  const pelvis = new THREE.Mesh(
    new THREE.SphereGeometry(0.415, 28, 20),
    bottomMat
  );
  pelvis.scale.set(1.02, 0.58, 0.96);
  pelvis.position.set(0, 0.36, 0);
  root.add(pelvis);

  if (bottomVariant === 'pleated_skirt') {
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.39, 0.54, 0.32, 24),
      bottomMat
    );
    skirt.position.set(0, 0.29, 0);
    root.add(skirt);

    const skirtStripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.525, 0.022, 10, 32),
      bottomSecMat
    );
    skirtStripe.rotation.x = Math.PI / 2;
    skirtStripe.position.set(0, 0.155, 0);
    root.add(skirtStripe);
  }

  const shoesPrimary = shoesItem?.modelConfig.primaryColor ?? '#E59449';
  const shoesSecondary = shoesItem?.modelConfig.secondaryColor ?? '#F7F2E8';
  const shoesAccent = shoesItem?.modelConfig.accentColor ?? '#D46534';
  const shoesVariant = shoesItem?.modelConfig.styleVariant ?? 'chunky_sneakers';

  const shoeMainMat = vinylMat(shoesPrimary, 0.52, 0.04);
  const shoeSecMat = vinylMat(shoesSecondary, 0.56, 0.02);
  const shoeAccMat = vinylMat(shoesAccent, 0.46, 0.06);

  for (const side of [-1, 1] as const) {
    const legX = side * 0.205;

    // Upper thigh pant cuff or exposed leg
    if (bottomVariant === 'active_shorts') {
      const shortLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.165, 0.175, 0.18, 22),
        bottomMat
      );
      shortLeg.position.set(legX, 0.28, 0);
      root.add(shortLeg);

      const skinLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.132, 0.125, 0.19, 20),
        skinMat
      );
      skinLeg.position.set(legX, 0.16, 0);
      root.add(skinLeg);
    } else if (bottomVariant === 'pleated_skirt') {
      const skinLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.132, 0.122, 0.24, 20),
        skinMat
      );
      skinLeg.position.set(legX, 0.19, 0);
      root.add(skinLeg);

      // Cute white ankle socks
      const sock = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.126, 0.09, 18),
        bottomSecMat
      );
      sock.position.set(legX, 0.13, 0);
      root.add(sock);
    } else if (bottomVariant === 'wide_traditional') {
      const wideLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.175, 0.21, 0.34, 24),
        bottomMat
      );
      wideLeg.position.set(legX, 0.23, 0);
      root.add(wideLeg);
    } else {
      // Jogger or straight jeans
      const fullLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.165,
          bottomVariant === 'jogger_cuff' ? 0.13 : 0.155,
          0.32,
          24
        ),
        bottomMat
      );
      fullLeg.position.set(legX, 0.24, 0);
      root.add(fullLeg);

      const cuff = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.032, 10, 22),
        bottomSecMat
      );
      cuff.rotation.x = Math.PI / 2;
      cuff.position.set(legX, 0.105, 0);
      root.add(cuff);
    }

    // Footwear
    const footGroup = new THREE.Group();
    footGroup.position.set(legX, 0.085, 0.05);

    if (shoesVariant === 'pastel_slides') {
      const bareFoot = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 20, 16),
        skinMat
      );
      bareFoot.scale.set(0.95, 0.62, 1.38);
      bareFoot.position.set(0, 0.015, 0.02);
      footGroup.add(bareFoot);

      const slideSole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.165, 0.17, 0.055, 22),
        shoeSecMat
      );
      slideSole.scale.set(0.95, 1, 1.42);
      slideSole.position.set(0, -0.045, 0.02);
      footGroup.add(slideSole);

      const slideStrap = new THREE.Mesh(
        new THREE.TorusGeometry(0.145, 0.045, 12, 22, Math.PI),
        shoeMainMat
      );
      slideStrap.position.set(0, 0.005, 0.05);
      footGroup.add(slideStrap);
    } else {
      // Chunky vinyl sneaker / canvas / boots
      const sole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.175, 0.185, 0.075, 24),
        shoeSecMat
      );
      sole.scale.set(0.95, 1, 1.42);
      sole.position.set(0, -0.04, 0.025);
      footGroup.add(sole);

      const upper = new THREE.Mesh(
        new THREE.SphereGeometry(0.165, 22, 18),
        shoeMainMat
      );
      upper.scale.set(0.94, shoesVariant === 'craft_boots' ? 0.92 : 0.72, 1.36);
      upper.position.set(0, shoesVariant === 'craft_boots' ? 0.04 : 0.02, 0.02);
      footGroup.add(upper);

      if (shoesVariant === 'canvas_low') {
        const toeCap = new THREE.Mesh(
          new THREE.SphereGeometry(0.125, 16, 14),
          shoeSecMat
        );
        toeCap.scale.set(0.96, 0.65, 0.85);
        toeCap.position.set(0, 0.005, 0.155);
        footGroup.add(toeCap);
      } else if (shoesVariant === 'chunky_sneakers') {
        const laceBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.035, 0.11),
          shoeSecMat
        );
        laceBar.position.set(0, 0.095, 0.08);
        laceBar.rotation.x = 0.25;
        footGroup.add(laceBar);
      } else if (shoesVariant === 'craft_boots') {
        const bootCollar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.145, 0.155, 0.11, 20),
          shoeMainMat
        );
        bootCollar.position.set(0, 0.12, -0.03);
        footGroup.add(bootCollar);

        const laceAccent = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.08, 0.04),
          shoeAccMat
        );
        laceAccent.position.set(0, 0.11, 0.1);
        footGroup.add(laceAccent);
      }
    }

    root.add(footGroup);
  }

  // =======================================================
  // 4. MULTI-LAYER INDEPENDENT ACCESSORIES
  // =======================================================
  const activeAcc = new Set(config.accessoryIds);

  if (activeAcc.has('acc_beanie')) {
    const beanie = new THREE.Group();
    const bMat = vinylMat('#D46534', 0.7, 0.01);
    const cuffMat = vinylMat('#BF5629', 0.74, 0.01);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.56),
      bMat
    );
    dome.scale.set(1.06, 0.88, 1.02);
    dome.position.set(0, 0.55, -0.04);
    beanie.add(dome);

    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.66, 0.095, 14, 30),
      cuffMat
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, 0.57, -0.04);
    beanie.add(cuff);

    const pom = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 18, 14),
      vinylMat('#F7F2E8', 0.72, 0.01)
    );
    pom.position.set(0, 1.18, -0.08);
    beanie.add(pom);

    beanie.rotation.x = -0.14;
    headGroup.add(beanie);
  }

  if (activeAcc.has('acc_cap')) {
    const capGroup = new THREE.Group();
    const capMat = vinylMat('#1B3B82', 0.58, 0.03);
    const whiteFrontMat = vinylMat('#F7F2E8', 0.55, 0.02);
    const btnMat = vinylMat('#D46534', 0.48, 0.04);

    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.52),
      capMat
    );
    crown.scale.set(1.06, 0.76, 1.04);
    crown.position.set(0, 0.56, -0.02);
    capGroup.add(crown);

    const frontPatch = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 14),
      whiteFrontMat
    );
    frontPatch.scale.set(1.1, 0.78, 0.32);
    frontPatch.position.set(0, 0.76, 0.58);
    capGroup.add(frontPatch);

    const visor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.62, 0.055, 24, 1, false, -Math.PI * 0.34, Math.PI * 0.68),
      capMat
    );
    visor.position.set(0, 0.58, 0.44);
    visor.rotation.x = 0.14;
    capGroup.add(visor);

    const topBtn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), btnMat);
    topBtn.position.set(0, 1.09, -0.02);
    capGroup.add(topBtn);

    capGroup.rotation.x = -0.08;
    headGroup.add(capGroup);
  }

  if (activeAcc.has('acc_non_la')) {
    // Iconic sculpted Vietnamese Nón Lá mini perched jauntily on top
    const nonLa = new THREE.Group();
    const leafMat = vinylMat('#EBD7A7', 0.66, 0.02);
    const ringMat = vinylMat('#C9AD74', 0.62, 0.02);
    const ribbonMat = vinylMat('#B93818', 0.48, 0.04);

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, 0.56, 36, 1, true),
      new THREE.MeshStandardMaterial({
        color: '#EBD7A7',
        roughness: 0.65,
        metalness: 0.02,
        side: THREE.DoubleSide,
      })
    );
    cone.position.set(0, 0.96, -0.04);
    nonLa.add(cone);

    // Concentric bamboo rim rings
    for (const [r, y] of [
      [0.94, 0.69],
      [0.68, 0.85],
      [0.39, 1.02],
    ]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.016, 10, 32),
        ringMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, y, -0.04);
      nonLa.add(ring);
    }

    // Top bamboo cap
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), leafMat);
    tip.position.set(0, 1.24, -0.04);
    nonLa.add(tip);

    // Silky red chin strap ribbon
    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.74, 0.022, 10, 28, Math.PI * 0.92),
      ribbonMat
    );
    strap.position.set(0, 0.06, 0.2);
    strap.rotation.z = Math.PI + Math.PI * 0.04;
    strap.rotation.x = 0.25;
    nonLa.add(strap);

    nonLa.rotation.set(-0.14, 0, 0.08);
    headGroup.add(nonLa);
  }

  if (activeAcc.has('acc_round_glasses')) {
    const glasses = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#D4A034',
      roughness: 0.24,
      metalness: 0.72,
    });
    const lensMat = new THREE.MeshStandardMaterial({
      color: '#E6F5FC',
      roughness: 0.08,
      metalness: 0.1,
      transparent: true,
      opacity: 0.24,
    });

    for (const side of [-1, 1]) {
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.205, 0.02, 12, 28),
        frameMat
      );
      rim.position.set(side * 0.305, -0.015, 0.785);
      rim.rotation.y = side * 0.18;
      glasses.add(rim);

      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.195, 24),
        lensMat
      );
      lens.position.set(side * 0.305, -0.015, 0.782);
      lens.rotation.y = side * 0.18;
      glasses.add(lens);

      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.013, 0.56, 6, 10),
        frameMat
      );
      arm.rotation.x = Math.PI / 2;
      arm.position.set(side * 0.56, -0.015, 0.44);
      arm.rotation.y = -side * 0.26;
      glasses.add(arm);
    }

    const bridge = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.015, 0.14, 6, 10),
      frameMat
    );
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, -0.01, 0.82);
    glasses.add(bridge);

    headGroup.add(glasses);
  }

  if (activeAcc.has('acc_headphones')) {
    const hp = new THREE.Group();
    const bandMat = vinylMat('#F5ECE0', 0.46, 0.05);
    const accentMat = vinylMat('#D46534', 0.42, 0.06);
    const cushionMat = vinylMat('#343942', 0.68, 0.02);

    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.068, 14, 34, Math.PI),
      bandMat
    );
    band.position.set(0, 0.02, 0.0);
    hp.add(band);

    for (const side of [-1, 1]) {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.14, 24),
        bandMat
      );
      cup.rotation.z = Math.PI / 2;
      cup.position.set(side * 0.93, -0.06, 0.02);
      hp.add(cup);

      const cupTrim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.155, 22),
        accentMat
      );
      cupTrim.rotation.z = Math.PI / 2;
      cupTrim.position.set(side * 0.94, -0.06, 0.02);
      hp.add(cupTrim);

      const pad = new THREE.Mesh(
        new THREE.TorusGeometry(0.175, 0.048, 12, 24),
        cushionMat
      );
      pad.rotation.y = Math.PI / 2;
      pad.position.set(side * 0.86, -0.06, 0.02);
      hp.add(pad);
    }

    headGroup.add(hp);
  }

  if (activeAcc.has('acc_red_scarf')) {
    const scarf = new THREE.Group();
    const scarfMat = vinylMat('#B93818', 0.72, 0.01);
    const stripeMat = vinylMat('#F7F2E8', 0.68, 0.01);

    const wrap = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.088, 14, 28),
      scarfMat
    );
    wrap.rotation.x = Math.PI / 2;
    wrap.position.set(0, 0.96, 0.01);
    scarf.add(wrap);

    const tail1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.34, 0.065),
      scarfMat
    );
    tail1.position.set(0.14, 0.76, 0.33);
    tail1.rotation.z = 0.16;
    tail1.rotation.x = -0.18;
    scarf.add(tail1);

    const tailStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.145, 0.045, 0.07),
      stripeMat
    );
    tailStripe.position.set(0.165, 0.65, 0.355);
    tailStripe.rotation.z = 0.16;
    tailStripe.rotation.x = -0.18;
    scarf.add(tailStripe);

    root.add(scarf);
  }

  if (activeAcc.has('acc_saigon_tote')) {
    const tote = new THREE.Group();
    const canvasMat = vinylMat('#F5ECDC', 0.68, 0.01);
    const strapMat = vinylMat('#1B3B82', 0.56, 0.03);
    const redThreadMat = vinylMat('#B93818', 0.5, 0.03);

    // Crossbody diagonal strap
    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.47, 0.032, 10, 32),
      strapMat
    );
    strap.position.set(0.02, 0.68, 0.02);
    strap.rotation.set(0.18, 0.58, 0.72);
    tote.add(strap);

    // Tote bag resting at right hip
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.32, 0.14),
      canvasMat
    );
    bag.position.set(0.45, 0.38, 0.08);
    bag.rotation.y = 0.32;
    bag.rotation.z = 0.14;
    tote.add(bag);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.29, 0.055, 0.146),
      strapMat
    );
    stripe.position.set(0.455, 0.42, 0.08);
    stripe.rotation.y = 0.32;
    stripe.rotation.z = 0.14;
    tote.add(stripe);

    const mark = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 12, 10),
      redThreadMat
    );
    mark.position.set(0.47, 0.34, 0.155);
    tote.add(mark);

    root.add(tote);
  }

  if (activeAcc.has('acc_craft_pouch')) {
    const pouch = new THREE.Group();
    const leatherMat = vinylMat('#7A492E', 0.62, 0.04);
    const metalMat = new THREE.MeshStandardMaterial({
      color: '#C7D1DC',
      roughness: 0.24,
      metalness: 0.78,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: '#D4A034',
      roughness: 0.28,
      metalness: 0.68,
    });

    // Waist leather belt
    const belt = new THREE.Mesh(
      new THREE.TorusGeometry(0.43, 0.038, 12, 32),
      leatherMat
    );
    belt.rotation.x = Math.PI / 2;
    belt.position.set(0, 0.41, 0);
    pouch.add(belt);

    // Brass buckle front
    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.08, 0.05),
      brassMat
    );
    buckle.position.set(0, 0.41, 0.44);
    pouch.add(buckle);

    // Side tool pouch on left hip
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.22, 0.14),
      leatherMat
    );
    bag.position.set(-0.46, 0.35, 0.08);
    bag.rotation.z = -0.15;
    pouch.add(bag);

    // Mini metallic wrench peeking out
    const wrenchStem = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.022, 0.16, 8, 12),
      metalMat
    );
    wrenchStem.position.set(-0.49, 0.49, 0.09);
    wrenchStem.rotation.z = 0.28;
    pouch.add(wrenchStem);

    const wrenchHead = new THREE.Mesh(
      new THREE.TorusGeometry(0.052, 0.018, 8, 16, Math.PI * 1.45),
      metalMat
    );
    wrenchHead.position.set(-0.52, 0.58, 0.09);
    wrenchHead.rotation.z = 0.6;
    pouch.add(wrenchHead);

    root.add(pouch);
  }

  root.add(headGroup);

  return { root, headGroup, leftArmGroup, rightArmGroup };
}

export const ChibiAvatar3D = forwardRef<ChibiAvatar3DHandle, ChibiAvatar3DProps>(
  function ChibiAvatar3D(
    {
      config,
      className = '',
      interactive = true,
      autoRotate = false,
      showFloorPedestal = true,
    },
    ref
  ) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [webglUnavailable, setWebglUnavailable] = useState(false);

    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const characterHolderRef = useRef<THREE.Group | null>(null);
    const animatedPartsRef = useRef<{
      headGroup: THREE.Group;
      leftArmGroup: THREE.Group;
      rightArmGroup: THREE.Group;
    } | null>(null);
    const pedestalMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const bounceImpulseRef = useRef<number>(0);
    const resetTargetRef = useRef<boolean>(false);

    const defaultCamPosRef = useRef(new THREE.Vector3(0.32, 1.56, 4.75));
    const defaultTargetRef = useRef(new THREE.Vector3(0, 1.24, 0));

    useImperativeHandle(
      ref,
      () => ({
        captureSnapshot: (options) => {
          const renderer = rendererRef.current;
          const scene = sceneRef.current;
          const camera = cameraRef.current;
          if (!renderer || !scene || !camera) return null;

          const prevSize = new THREE.Vector2();
          renderer.getSize(prevSize);
          const prevPixelRatio = renderer.getPixelRatio();
          const prevClearAlpha = renderer.getClearAlpha();

          try {
            const targetW = options?.width ?? 768;
            const targetH = options?.height ?? 768;
            if (options?.transparent) {
              renderer.setClearColor(0x000000, 0);
            }
            renderer.setPixelRatio(1);
            renderer.setSize(targetW, targetH, false);
            camera.aspect = targetW / targetH;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
            return renderer.domElement.toDataURL('image/png');
          } catch {
            return null;
          } finally {
            renderer.setClearAlpha(prevClearAlpha);
            renderer.setPixelRatio(prevPixelRatio);
            renderer.setSize(prevSize.x, prevSize.y, false);
            camera.aspect = Math.max(1, prevSize.x) / Math.max(1, prevSize.y);
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
          }
        },
        resetCamera: () => {
          resetTargetRef.current = true;
        },
        triggerBounce: () => {
          bounceImpulseRef.current = 1.0;
        },
      }),
      []
    );

    // 1. Khởi tạo Scene, Renderer, Lighting, RoomEnvironment & OrbitControls 1 lần
    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        });
      } catch {
        setWebglUnavailable(true);
        return;
      }

      const isSoftware = detectSoftwareWebGL(renderer);
      renderer.setPixelRatio(
        isSoftware ? 1 : Math.min(window.devicePixelRatio || 1, 2)
      );
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;
      renderer.setClearColor(0x000000, 0);

      const width = Math.max(container.clientWidth, 240);
      const height = Math.max(container.clientHeight, 240);
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

      // Studio environment reflections (soft vinyl sheen)
      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = isSoftware ? 0.45 : 0.62;
      roomEnv.dispose();

      const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 40);
      camera.position.copy(defaultCamPosRef.current);

      // 3-point warm soft studio lights
      const hemi = new THREE.HemisphereLight('#FFFDF8', '#D8CEC2', 0.95);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight('#FFF6E8', 1.45);
      keyLight.position.set(2.8, 4.6, 3.8);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight('#DCEEFF', 0.62);
      fillLight.position.set(-3.2, 2.2, 2.5);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight('#FFE2C6', 0.78);
      rimLight.position.set(-1.8, 3.4, -3.6);
      scene.add(rimLight);

      // Soft studio floor pedestal + radial contact shadow
      const floorGroup = new THREE.Group();
      const shadowTex = createSoftShadowTexture();
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      });
      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.75, 1.75),
        shadowMat
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.008;
      floorGroup.add(shadowPlane);

      const pedestalMat = new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.72,
        metalness: 0.02,
        transparent: true,
        opacity: 0.52,
      });
      pedestalMatRef.current = pedestalMat;

      if (showFloorPedestal) {
        const pedestal = new THREE.Mesh(
          new THREE.CylinderGeometry(0.95, 1.02, 0.06, 40),
          pedestalMat
        );
        pedestal.position.y = -0.03;
        floorGroup.add(pedestal);
      }
      scene.add(floorGroup);

      // Character root container
      const characterHolder = new THREE.Group();
      scene.add(characterHolder);

      // OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.enablePan = false;
      controls.enableRotate = interactive;
      controls.enableZoom = interactive;
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 1.4;
      controls.minDistance = 3.35;
      controls.maxDistance = 6.2;
      controls.minPolarAngle = 0.58;
      controls.maxPolarAngle = 1.74;
      controls.target.copy(defaultTargetRef.current);
      controls.update();

      const onControlStart = () => {
        resetTargetRef.current = false;
      };
      controls.addEventListener('start', onControlStart);

      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      controlsRef.current = controls;
      characterHolderRef.current = characterHolder;

      // ResizeObserver for crisp responsive viewport
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.max(Math.round(entry.contentRect.width), 100);
          const h = Math.max(Math.round(entry.contentRect.height), 100);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        }
      });
      ro.observe(container);

      // Animation Loop with idle breathing + pop-bounce spring + camera reset
      const clock = new THREE.Clock();
      let rafId = 0;
      let disposed = false;

      const animate = () => {
        if (disposed) return;
        rafId = window.requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.getElapsedTime();

        // Smooth camera reset
        if (resetTargetRef.current) {
          camera.position.lerp(defaultCamPosRef.current, Math.min(1, dt * 7));
          controls.target.lerp(defaultTargetRef.current, Math.min(1, dt * 7));
          if (
            camera.position.distanceTo(defaultCamPosRef.current) < 0.02 &&
            controls.target.distanceTo(defaultTargetRef.current) < 0.02
          ) {
            camera.position.copy(defaultCamPosRef.current);
            controls.target.copy(defaultTargetRef.current);
            resetTargetRef.current = false;
          }
        }

        // Pop-bounce decay on outfit change
        let bounceScaleY = 1;
        let bounceScaleXZ = 1;
        let bounceY = 0;
        if (bounceImpulseRef.current > 0.004) {
          bounceImpulseRef.current = THREE.MathUtils.damp(
            bounceImpulseRef.current,
            0,
            7.5,
            dt
          );
          const b = bounceImpulseRef.current;
          const wave = Math.sin((1 - b) * Math.PI * 2.4) * b;
          bounceScaleY = 1 + wave * 0.095;
          bounceScaleXZ = 1 - wave * 0.055;
          bounceY = Math.max(0, wave) * 0.14;
        }

        // Gentle breathing & toy charm sway
        const breath = Math.sin(elapsed * 2.2) * 0.024;
        characterHolder.position.y = breath + bounceY;
        characterHolder.scale.set(bounceScaleXZ, bounceScaleY, bounceScaleXZ);

        const parts = animatedPartsRef.current;
        if (parts) {
          parts.headGroup.rotation.z = Math.sin(elapsed * 1.4) * 0.032;
          parts.headGroup.rotation.y = Math.sin(elapsed * 0.9) * 0.045;
          parts.leftArmGroup.rotation.z = Math.sin(elapsed * 2.2) * 0.04;
          parts.rightArmGroup.rotation.z = -Math.sin(elapsed * 2.2) * 0.04;
        }

        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      return () => {
        disposed = true;
        window.cancelAnimationFrame(rafId);
        ro.disconnect();
        controls.removeEventListener('start', onControlStart);
        controls.dispose();
        disposeObject3D(characterHolder);
        disposeObject3D(floorGroup);
        shadowTex.dispose();
        envRT.dispose();
        pmrem.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        sceneRef.current = null;
        cameraRef.current = null;
        rendererRef.current = null;
        controlsRef.current = null;
        characterHolderRef.current = null;
        animatedPartsRef.current = null;
      };
    }, [interactive, autoRotate, showFloorPedestal]);

    // 2. Rebuild modular Chibi meshes whenever AvatarConfig changes
    useEffect(() => {
      const holder = characterHolderRef.current;
      if (!holder) return;

      while (holder.children.length > 0) {
        const child = holder.children[0];
        holder.remove(child);
        disposeObject3D(child);
      }

      const built = buildCharacter(config);
      holder.add(built.root);
      animatedPartsRef.current = {
        headGroup: built.headGroup,
        leftArmGroup: built.leftArmGroup,
        rightArmGroup: built.rightArmGroup,
      };

      const bg = getStudioBackgroundById(config.studioBgId);
      if (pedestalMatRef.current) {
        pedestalMatRef.current.color.set(bg.floorTint);
      }

      // Pop-bounce delight on every customization change
      bounceImpulseRef.current = 0.88;
    }, [config]);

    const studioBg = getStudioBackgroundById(config.studioBgId);

    return (
      <div
        className={`relative w-full h-full overflow-hidden select-none ${className}`}
        style={{ background: studioBg.cssGradient }}
      >
        {webglUnavailable ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#25292E]">
            <p className="font-display font-bold text-sm">
              Trình duyệt tạm thời chưa bật WebGL 3D
            </p>
            <p className="text-xs text-[#615D57] mt-1 max-w-xs">
              Hãy bật tăng tốc phần cứng trên trình duyệt để xoay nhân vật Chibi
              3D Góc Thợ nhé.
            </p>
          </div>
        ) : (
          <div
            ref={mountRef}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
            aria-label="Sân khấu nhân vật Chibi 3D Góc Thợ"
          />
        )}
      </div>
    );
  }
);
