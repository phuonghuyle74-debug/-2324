import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getScatterPosition, getTreePosition } from '../utils/math';

const COUNT = 3500;

// GLSL Shaders
const vertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0 = Tree, 1 = Scattered
  attribute vec3 aTargetPos;
  attribute float aSize;
  
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 startPos = position; // Tree
    vec3 endPos = aTargetPos; // Scatter

    // Add some noise to movement
    float noise = sin(position.y * 10.0 + uTime) * 0.1;
    
    // Lerp position based on progress
    vec3 pos = mix(startPos, endPos, uProgress);
    
    // Add breathing effect to tree
    if(uProgress < 0.5) {
        pos.x += sin(uTime * 1.5 + pos.y) * 0.05;
        pos.z += cos(uTime * 1.5 + pos.y) * 0.05;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = aSize * (350.0 / -mvPosition.z);
    
    // Rich Emerald Green to Deep Forest + Gold Hints
    // Brighter, more saturated emerald for luxury feel
    vec3 colorBase = vec3(0.0, 0.6, 0.3); 
    vec3 colorTip = vec3(0.2, 0.8, 0.4);
    
    // Mix based on height for gradient
    vec3 treeColor = mix(colorBase, colorTip, (position.y + 6.0) / 12.0);
    
    // Scatter color (Ambient Gold/Dark Green)
    vec3 colorScatter = vec3(0.02, 0.1, 0.05); 
    
    vColor = mix(treeColor, colorScatter, uProgress);
    
    // Sparkle effect
    float sparkle = sin(uTime * 5.0 + position.x * 10.0) * 0.5 + 0.5;
    vAlpha = 0.8 + 0.2 * sparkle;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Circular particle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Soft glow edge
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 2.0); // Sharper glow for "light" feel

    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

interface FoliageProps {
  progress: number; // 0 to 1
}

export const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  const { positions, targetPositions, sizes } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const target = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Tree State (Source)
      const treeP = getTreePosition(i, COUNT);
      // Add randomness to tree volume
      treeP.x += (Math.random() - 0.5) * 0.8; // More volume
      treeP.z += (Math.random() - 0.5) * 0.8;
      treeP.y += (Math.random() - 0.5) * 0.5;

      pos[i * 3] = treeP.x;
      pos[i * 3 + 1] = treeP.y;
      pos[i * 3 + 2] = treeP.z;

      // Scatter State (Target)
      const scatP = getScatterPosition(i);
      target[i * 3] = scatP.x;
      target[i * 3 + 1] = scatP.y;
      target[i * 3 + 2] = scatP.z;

      sz[i] = Math.random() * 0.6 + 0.3; // Slightly larger particles
    }
    return { positions: pos, targetPositions: target, sizes: sz };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 }
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      // Smoothly interpolate uniform
      material.uniforms.uProgress.value = THREE.MathUtils.lerp(
        material.uniforms.uProgress.value,
        progress,
        0.1
      );
      
      // Gentle rotation of the whole tree
      if(progress < 0.5) {
          meshRef.current.rotation.y += 0.002; // Faster rotation
      }
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          count={targetPositions.length / 3}
          array={targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </points>
  );
};