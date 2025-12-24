export type AppState = 'TREE' | 'SCATTERED';

export interface PhotoData {
  id: string;
  url: string;
  aspectRatio: number;
  isPlaceholder?: boolean;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface DualPosition {
  tree: Position3D;
  scattered: Position3D;
  rotation?: Position3D; // For photos
}

// Custom event for gesture triggering
export interface GestureEvent extends Event {
  detail: { command: 'TOGGLE' | 'OPEN' | 'CLOSE' };
}