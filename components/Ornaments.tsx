import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getScatterPosition, getTreePosition } from '../utils/math';

const ORNAMENT_COUNT = 180;
const GIFT_COUNT = 40;
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

interface CommonProps {
  progress: number;
}

// --- SPHERES (Ornaments) ---
export const Ornaments: React.FC<CommonProps> = ({ progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    return new Array(ORNAMENT_COUNT).fill(0).map((_, i) => ({
      treePos: getTreePosition(i, ORNAMENT_COUNT).multiplyScalar(1.05), // Slightly outside foliage
      scatterPos: getScatterPosition(i),
      scale: Math.random() * 0.3 + 0.2,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.7 ? '#D4AF37' : (Math.random() > 0.5 ? '#C0C0C0' : '#B8860B') // Gold, Silver, Dark Gold
    }));
  }, []);

  useLayoutEffect(() => {
    if (meshRef.current) {
      data.forEach((d, i) => {
        tempObj.position.copy(d.treePos);
        tempObj.scale.setScalar(d.scale);
        tempObj.updateMatrix();
        meshRef.current?.setMatrixAt(i, tempObj.matrix);
        meshRef.current?.setColorAt(i, tempColor.set(d.color));
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [data]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
      const d = data[i];
      const pos = new THREE.Vector3().lerpVectors(d.treePos, d.scatterPos, progress);
      pos.y += Math.sin(time + d.phase) * 0.05;

      tempObj.position.copy(pos);
      tempObj.scale.setScalar(d.scale);
      tempObj.rotation.set(time * 0.2, time * 0.1, 0);
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if(progress < 0.5) meshRef.current.rotation.y += 0.002;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ORNAMENT_COUNT]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        roughness={0.1}
        metalness={1.0}
        envMapIntensity={1.5}
      />
    </instancedMesh>
  );
};

// --- GIFT BOXES ---
export const GiftBoxes: React.FC<CommonProps> = ({ progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    return new Array(GIFT_COUNT).fill(0).map((_, i) => {
       // Position gifts mostly at the bottom half of the tree
       const p = i / GIFT_COUNT; 
       const adjustedIndex = i * 2; // Spread them out
       const treePos = getTreePosition(adjustedIndex, GIFT_COUNT * 3);
       // Push them out a bit more than leaves
       treePos.x *= 1.2;
       treePos.z *= 1.2;
       // Bias y towards bottom (-6 to 0 mostly)
       treePos.y = THREE.MathUtils.mapLinear(p, 0, 1, -5, 0); 

       return {
          treePos,
          scatterPos: getScatterPosition(i + 1000), // Offset seed
          scale: Math.random() * 0.4 + 0.3, // Larger than ornaments
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.5 ? '#8B0000' : (Math.random() > 0.5 ? '#006400' : '#4B0082') // Deep Red, Green, Indigo
       };
    });
  }, []);

  useLayoutEffect(() => {
    if (meshRef.current) {
      data.forEach((d, i) => {
        tempObj.position.copy(d.treePos);
        tempObj.scale.setScalar(d.scale);
        tempObj.rotation.set(0, Math.random() * Math.PI, 0);
        tempObj.updateMatrix();
        meshRef.current?.setMatrixAt(i, tempObj.matrix);
        meshRef.current?.setColorAt(i, tempColor.set(d.color));
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [data]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < GIFT_COUNT; i++) {
      const d = data[i];
      const pos = new THREE.Vector3().lerpVectors(d.treePos, d.scatterPos, progress);
      
      // Gifts float more slowly
      pos.y += Math.sin(time * 0.5 + d.phase) * 0.02;

      tempObj.position.copy(pos);
      tempObj.scale.setScalar(d.scale);
      // Rotate boxes slowly
      tempObj.rotation.set(Math.sin(time * 0.5 + d.phase)*0.1, time * 0.5 + d.phase, 0);
      
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if(progress < 0.5) meshRef.current.rotation.y += 0.002;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, GIFT_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        roughness={0.3}
        metalness={0.5}
        envMapIntensity={1}
      />
    </instancedMesh>
  );
};