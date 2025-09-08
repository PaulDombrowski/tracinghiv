import React, { useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';

// 3D Model component (renamed to IsbnModel earlier)
function IsbnModel({ url = `${process.env.PUBLIC_URL}/hivpdf.glb` }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh) {
        o.material = new THREE.MeshStandardMaterial({
          color: 0xff0000,      // rot als Basis
          metalness: 1.0,       // stark metallisch
          roughness: 0.1,       // glatt für Reflexionen
          envMapIntensity: 0.7, // deutlich sichtbare Umgebungsspiegelung
        });
        o.castShadow = false;   // Shadows aus (schont Performance, vermeidet helle Ränder)
        o.receiveShadow = false;
      }
    });
  }, [scene]);

  // sanfte Autorotation
  useFrame((_, delta) => {
    if (scene) {
      scene.rotation.y += 0.12 * delta;
      scene.rotation.x += 0.05 * delta;
    }
  });

  return <primitive object={scene} scale={[0.25, 0.25, 0.25]} position={[0, 0, 0]} />;
}

function ResponsiveModel({ rightBias = 1.0 }) {
  const { size, camera } = useThree();
  const groupRef = React.useRef();
  const controlsRef = React.useRef();

  // target values (based on viewport); keep relatively large
  const base = Math.max(size.width, size.height) / 900; // 900px ≈ 1.0
  const targetScale = THREE.MathUtils.clamp(base * 1.15, 0.95, 2.0);
  const biasFactor = THREE.MathUtils.clamp(size.width / 1200, 0.7, 1.7);
  const targetOffsetX = Math.min(rightBias * biasFactor, 2.2);

  // smooth state (no jumps)
  const smooth = React.useRef({ scale: targetScale, offsetX: targetOffsetX });

  useFrame(() => {
    // lerp towards targets
    smooth.current.scale = THREE.MathUtils.lerp(smooth.current.scale, targetScale, 0.1);
    smooth.current.offsetX = THREE.MathUtils.lerp(smooth.current.offsetX, targetOffsetX, 0.12);

    const s = smooth.current.scale;
    const ox = smooth.current.offsetX;

    // apply to group
    if (groupRef.current) {
      groupRef.current.scale.set(s, s, s);
      groupRef.current.position.x = ox;
    }

    // keep camera distance proportional (slightly conservative so it stays big)
    camera.position.set(3 / (s * 0.92), 4 / (s * 0.92), 5 / (s * 0.92));
    camera.updateProjectionMatrix();

    // update controls target smoothly
    if (controlsRef.current) {
      const t = controlsRef.current.target;
      t.x = THREE.MathUtils.lerp(t.x, ox, 0.2);
      t.y = THREE.MathUtils.lerp(t.y, 0, 0.2);
      t.z = THREE.MathUtils.lerp(t.z, 0, 0.2);
      controlsRef.current.update();
    }
  });

  return (
    <>
      <group ref={groupRef} position={[targetOffsetX, 0, 0]} scale={[targetScale, targetScale, targetScale]}>
        <IsbnModel />
      </group>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export default function HivModelStage({ rightBias = 1.0 }) {
  return (
    <Canvas
      shadows={false}
      frameloop="always"
      dpr={[1, 1.25]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [3, 4, 5], fov: 50 }}
      style={{ width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none' }}
    >
      {/* Transparenter Hintergrund */}
      <color attach="background" args={["transparent"]} />

      {/* Licht-Setup (ohne Shadows) */}
      <ambientLight intensity={1.2} color={new THREE.Color(0.9, 0.8, 1.0)} />
      <directionalLight position={[0, 10, 10]} intensity={1.8} color={new THREE.Color(1.0, 0.8, 0.9)} />

      {/* Umgebung für Reflexionen (JPG/HDR) */}
      <Environment files={`${process.env.PUBLIC_URL}/reflexions.jpg`} background={false} />

      {/* Responsives Modell nach rechts verschoben */}
      <ResponsiveModel rightBias={rightBias} />
    </Canvas>
  );
}

// Preload für schnelleres Laden
useGLTF.preload(`${process.env.PUBLIC_URL}/hivpdf.glb`);