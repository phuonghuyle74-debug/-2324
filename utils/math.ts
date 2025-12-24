import * as THREE from 'three';

// Constants
export const TREE_HEIGHT = 12;
export const TREE_RADIUS = 4;
export const SCATTER_RADIUS = 15;

/**
 * Generates a spiral cone position (The Tree)
 */
export const getTreePosition = (index: number, total: number): THREE.Vector3 => {
  const y = (index / total) * TREE_HEIGHT - (TREE_HEIGHT / 2); // -6 to +6
  const radius = ((TREE_HEIGHT / 2) - y) * (TREE_RADIUS / TREE_HEIGHT) * 1.5;
  const angle = index * 0.5; // Spiral tightness
  
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    y,
    Math.sin(angle) * radius
  );
};

/**
 * Generates a random sphere position (The Ambient Background)
 */
export const getScatterPosition = (index: number): THREE.Vector3 => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  const r = 8 + Math.random() * SCATTER_RADIUS;

  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

/**
 * Generates a cylinder gallery position (The Memory Gallery)
 */
export const getGalleryPosition = (index: number, total: number): { pos: THREE.Vector3, rot: THREE.Euler } => {
  // Cylindrical arrangement around the user
  const radius = 6; 
  const angleStep = (Math.PI * 2) / Math.min(total, 8); // Max 8 per ring
  const ringIndex = Math.floor(index / 8);
  const positionInRing = index % 8;
  
  const angle = positionInRing * angleStep;
  const y = ringIndex * 2.5 - 2; // Stack rings vertically

  const pos = new THREE.Vector3(
    Math.cos(angle) * radius,
    y,
    Math.sin(angle) * radius
  );

  // Look at center (0,0,0) but inverted so image faces inward
  const dummy = new THREE.Object3D();
  dummy.position.copy(pos);
  dummy.lookAt(0, 0, 0);
  
  return { pos, rot: dummy.rotation };
};