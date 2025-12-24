import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_HEIGHT, TREE_RADIUS } from '../utils/math';

interface Props {
  progress: number;
}

// --- GOLDEN STAR TOP ---
export const StarTop: React.FC<Props> = ({ progress }) => {
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.2;
    const innerRadius = 0.5;
    
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2;
      // Rotate angle to make star point up
      const a = angle - Math.PI / 2; 
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    return shape;
  }, []);

  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    
    // Idle Animation
    meshRef.current.rotation.y = t * 0.5;
    meshRef.current.rotation.z = Math.sin(t) * 0.1;
    
    // Morph logic
    // Tree: Top of tree (y = 6)
    // Scattered: Float higher and maybe spin faster
    const treeY = (TREE_HEIGHT / 2) + 0.5;
    const scatterY = treeY + 4;
    
    meshRef.current.position.y = THREE.MathUtils.lerp(treeY, scatterY, progress);
    
    // Scale up slightly when scattered
    const s = THREE.MathUtils.lerp(1, 1.5, progress);
    meshRef.current.scale.setScalar(s);
  });

  return (
    <mesh ref={meshRef}>
      <extrudeGeometry args={[starShape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 }]} />
      <meshStandardMaterial 
        color="#FFD700"
        emissive="#FFD700"
        emissiveIntensity={0.5}
        metalness={1}
        roughness={0.1}
      />
    </mesh>
  );
};

// --- SPIRAL GOLD WIRE ---
export const SpiralWire: React.FC<Props> = ({ progress }) => {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const turns = 5;
    const segments = 200;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Height from bottom (-6) to top (6)
      const y = (t * TREE_HEIGHT) - (TREE_HEIGHT / 2);
      // Radius tapers from bottom to top
      const r = ((1 - t) * TREE_RADIUS * 1.3) + 0.2;
      const angle = t * Math.PI * 2 * turns;
      
      points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 100, 0.08, 8, false);
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if(!groupRef.current) return;
    
    // In Tree mode: Standard
    // In Scatter mode: Scale up huge to form ambient rings
    const scale = THREE.MathUtils.lerp(1, 4, progress);
    groupRef.current.scale.setScalar(scale);
    
    // Rotate 
    groupRef.current.rotation.y += 0.005;
    // When scattered, rotate differently
    groupRef.current.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 8, progress);
    
    // Opacity fade could be handled by material if we had a transparent ref, 
    // but metallic gold looks good even large.
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial 
          color="#F59E0B"
          metalness={1}
          roughness={0.2}
          emissive="#B45309"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
};