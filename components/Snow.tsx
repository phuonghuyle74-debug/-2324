import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 2000;

const vertexShader = `
  uniform float uTime;
  attribute float aSpeed;
  attribute float aPhase;
  attribute float aSize;
  
  void main() {
    vec3 pos = position;
    
    // Falling physics
    float height = 50.0;
    float fall = uTime * aSpeed;
    
    // Wrap y: continuous falling simulation
    // Original range roughly -20 to 20
    // We shift it so particles reset to top when they hit bottom
    pos.y = 25.0 - mod(pos.y + fall + 25.0, height);
    
    // Horizontal drift based on time and phase (wind simulation)
    pos.x += sin(uTime * 0.2 + aPhase) * 1.5;
    pos.z += cos(uTime * 0.3 + aPhase) * 1.5;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation (particles shrink further away)
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  void main() {
    // Soft circular particle
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;
    
    // Soft gradient from center
    float alpha = (1.0 - r) * 0.6; // Base opacity 0.6
    
    // Pure white snow
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`;

export const Snow: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null);
  
  const { positions, attributes } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    
    for(let i=0; i<COUNT; i++) {
      // Distribute randomly in a large volume around the tree
      pos[i*3] = (Math.random() - 0.5) * 60; // X: -30 to 30
      pos[i*3+1] = (Math.random() - 0.5) * 50; // Y: -25 to 25
      pos[i*3+2] = (Math.random() - 0.5) * 60; // Z: -30 to 30
      
      // Random fall speed
      speeds[i] = 2.0 + Math.random() * 3.0;
      
      // Random phase for wind oscillation
      phases[i] = Math.random() * Math.PI * 2;
      
      // Random size variation
      sizes[i] = Math.random() * 1.5 + 0.5;
    }
    
    return { 
      positions: pos, 
      attributes: { speeds, phases, sizes } 
    };
  }, []);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSpeed" count={COUNT} array={attributes.speeds} itemSize={1} />
        <bufferAttribute attach="attributes-aPhase" count={COUNT} array={attributes.phases} itemSize={1} />
        <bufferAttribute attach="attributes-aSize" count={COUNT} array={attributes.sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial 
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};