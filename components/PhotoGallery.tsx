import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image, Text } from '@react-three/drei';
import * as THREE from 'three';
import { getGalleryPosition, getTreePosition } from '../utils/math';
import { PhotoData } from '../types';

interface PhotoGalleryProps {
  photos: PhotoData[];
  progress: number;
}

const PhotoItem = ({ photo, index, total, progress }: { photo: PhotoData; index: number; total: number; progress: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.Material>(null);

  // Calculate Target Positions
  // 1. Tree: Embedded inside the tree
  const treePosVec = getTreePosition(index * 30, total * 30); // Spread them out in the tree
  treePosVec.y += 2; // Shift up slightly
  const treePos = treePosVec;
  
  // 2. Gallery: Cylinder around user
  const { pos: galleryPos, rot: galleryRot } = getGalleryPosition(index, total);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Interpolate Position
    const targetPos = new THREE.Vector3().lerpVectors(treePos, galleryPos, progress);
    
    // Add simple float
    targetPos.y += Math.sin(state.clock.elapsedTime + index) * 0.05;
    
    // Smooth movement
    groupRef.current.position.lerp(targetPos, 0.1);

    // Interpolate Rotation
    // Tree rotation (facing outward from center roughly)
    const treeRot = new THREE.Euler(0, Math.atan2(treePos.x, treePos.z), 0);
    
    // Create Quaternions for smooth rotation interpolation
    const qStart = new THREE.Quaternion().setFromEuler(treeRot);
    const qEnd = new THREE.Quaternion().setFromEuler(galleryRot);
    groupRef.current.quaternion.slerp(qStart.clone().slerp(qEnd, progress), 0.1);

    // Scale Logic: Small in tree, Large in gallery
    const scale = THREE.MathUtils.lerp(0.8, 2.5, progress);
    groupRef.current.scale.setScalar(scale);

    // Opacity/Visibility logic if needed
    // We can boost emissive intensity when scattered
  });

  return (
    <group ref={groupRef}>
      {/* Golden Frame */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshStandardMaterial 
            color="#D4AF37" 
            metalness={1} 
            roughness={0.2} 
            emissive={photo.isPlaceholder ? "#553300" : "#000000"}
            emissiveIntensity={photo.isPlaceholder ? 0.5 : 0}
        />
      </mesh>
      
      {/* Photo */}
      <Image 
        url={photo.url}
        transparent
        opacity={photo.isPlaceholder ? 0.3 : 1}
        color={photo.isPlaceholder ? "#333" : "#fff"} // Tint placeholders dark
        scale={[1, 1]}
      />
    </group>
  );
};

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, progress }) => {
  return (
    <group>
      {photos.map((photo, i) => (
        <PhotoItem 
          key={photo.id} 
          photo={photo} 
          index={i} 
          total={photos.length} 
          progress={progress}
        />
      ))}
    </group>
  );
};