import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Upload, Music, Play, Pause, X, Sparkles, Image as ImageIcon, Menu } from 'lucide-react';

import { AppState, PhotoData } from './types';
import { Foliage } from './components/Foliage';
import { Ornaments, GiftBoxes } from './components/Ornaments';
import { SpiralWire, StarTop } from './components/TreeAccessories';
import { PhotoGallery } from './components/PhotoGallery';
import { GestureController } from './components/GestureController';
import { Snow } from './components/Snow';

// 1x1 Dark Grey Transparent Pixel
const PLACEHOLDER_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const MAX_PLACEHOLDERS = 8;
const DEFAULT_PHOTOS: PhotoData[] = Array.from({ length: MAX_PLACEHOLDERS }).map((_, i) => ({
  id: `placeholder-${i}`,
  url: PLACEHOLDER_URL,
  aspectRatio: 1,
  isPlaceholder: true
}));

const MainScene = ({ appState, photos }: { appState: AppState, photos: PhotoData[] }) => {
  const [smoothProgress, setSmoothProgress] = useState(0);

  useEffect(() => {
    let animId: number;
    const target = appState === 'SCATTERED' ? 1 : 0;
    
    const animate = () => {
      setSmoothProgress(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.001) return target;
        return prev + diff * 0.05; // Smoothing factor
      });
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [appState]);

  return (
    <>
      {/* Lighting: Enhanced for Luxury */}
      <ambientLight intensity={0.4} color="#aaddcc" />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#fff8e7" />
      <pointLight position={[-10, 5, -10]} intensity={0.8} color="#ffd700" />
      <spotLight 
        position={[0, 25, 5]} 
        intensity={3} 
        angle={0.4} 
        penumbra={1} 
        color="#ffffff" 
        castShadow 
        distance={50}
      />
      
      <Snow />

      <group position={[0, -2, 0]}>
        <Foliage progress={smoothProgress} />
        <SpiralWire progress={smoothProgress} />
        <StarTop progress={smoothProgress} />
        <Ornaments progress={smoothProgress} />
        <GiftBoxes progress={smoothProgress} />
        <PhotoGallery photos={photos} progress={smoothProgress} />
      </group>

      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.6} mipmapBlur intensity={2.0} radius={0.5} />
        <Vignette eskil={false} offset={0.1} darkness={1.0} />
        <Noise opacity={0.02} />
      </EffectComposer>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={appState === 'TREE'}
        autoRotateSpeed={0.5}
        minDistance={8}
        maxDistance={25}
      />
      
      {/* City environment for nice reflections on gold/gifts */}
      <Environment preset="city" />
    </>
  );
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('TREE');
  const [photos, setPhotos] = useState<PhotoData[]>(DEFAULT_PHOTOS);
  const [bgm, setBgm] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Mobile Optimization: Default to false (hidden) so the tree is visible immediately
  const [showControls, setShowControls] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // Audio Logic
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(e => console.warn("Autoplay blocked", e));
      else audioRef.current.pause();
    }
  }, [isPlaying, bgm]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setPhotos(prev => {
        const next = [...prev];
        let fileIdx = 0;
        
        // Fill placeholders first
        for (let i = 0; i < next.length && fileIdx < files.length; i++) {
          if (next[i].isPlaceholder) {
            next[i] = {
              id: Math.random().toString(36).substr(2, 9),
              url: URL.createObjectURL(files[fileIdx]),
              aspectRatio: 1, // Default square
              isPlaceholder: false
            };
            fileIdx++;
          }
        }
        
        // Append remaining
        while (fileIdx < files.length) {
           next.push({
              id: Math.random().toString(36).substr(2, 9),
              url: URL.createObjectURL(files[fileIdx]),
              aspectRatio: 1,
              isPlaceholder: false
           });
           fileIdx++;
        }
        return next;
      });
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setBgm(url);
      setIsPlaying(true);
    }
  };

  const toggleState = () => {
    setAppState(prev => prev === 'TREE' ? 'SCATTERED' : 'TREE');
  };

  const handleGesture = (command: 'SCATTER' | 'GATHER') => {
    if (command === 'SCATTER' && appState !== 'SCATTERED') {
      setAppState('SCATTERED');
    } else if (command === 'GATHER' && appState !== 'TREE') {
      setAppState('TREE');
    }
  };

  const activePhotoCount = photos.filter(p => !p.isPlaceholder).length;

  return (
    <div className="relative w-full h-full bg-black font-sans text-white overflow-hidden selection:bg-emerald-500/30">
      
      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 4, 18], fov: 40 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <MainScene appState={appState} photos={photos} />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-4 md:p-6">
        
        {/* Header - Mobile optimized size */}
        <header className="flex justify-between items-start pointer-events-auto z-10 w-full">
          <div className="glass-panel p-4 md:p-6 rounded-2xl animate-fade-in-down max-w-[75%] md:max-w-none">
            <h1 className="text-2xl md:text-5xl font-serif tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-100 drop-shadow-[0_0_15px_rgba(255,215,0,0.6)] leading-tight">
              Merry Christmas
            </h1>
            <h2 className="text-sm md:text-2xl font-light text-emerald-100/90 mt-1 ml-1 tracking-[0.2em] uppercase drop-shadow-md">
              Feiyan
            </h2>
          </div>

          <div className="flex gap-3">
             <button 
                onClick={() => setShowControls(!showControls)}
                className={`p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-md ${!showControls ? 'animate-pulse bg-emerald-500/20 border-emerald-500/50' : ''}`}
                aria-label="Toggle Controls"
             >
               {showControls ? <X size={20} /> : <div className="w-5 h-5 grid place-items-center space-y-1"><span className="block w-5 h-0.5 bg-white"></span><span className="block w-5 h-0.5 bg-white"></span><span className="block w-5 h-0.5 bg-white"></span></div>}
             </button>
          </div>
        </header>

        {/* Controls Panel - Mobile optimized position and width */}
        <div className={`absolute top-20 right-4 md:top-32 md:right-6 pointer-events-auto transition-all duration-500 ease-out transform origin-top-right z-20 ${showControls ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'}`}>
          <div className="w-60 md:w-72 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 md:gap-6">
            
            {/* Morph Trigger */}
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-xs text-emerald-200/50 uppercase tracking-widest font-bold">Experience Mode</label>
              <button 
                onClick={toggleState}
                className={`w-full py-3 md:py-4 rounded-xl border transition-all duration-500 flex items-center justify-center gap-2 group ${
                  appState === 'TREE' 
                    ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                    : 'bg-amber-900/40 border-amber-500/30 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                }`}
              >
                <Sparkles size={16} className={`transition-transform duration-700 ${appState === 'SCATTERED' ? 'rotate-180 scale-110' : ''}`} />
                <span className="font-serif tracking-wide text-sm md:text-base">
                  {appState === 'TREE' ? 'View The Tree' : 'View Memories'}
                </span>
              </button>
            </div>

            {/* Upload Memories */}
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-xs text-emerald-200/50 uppercase tracking-widest font-bold">Memories</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3 md:p-4 hover:bg-white/10 transition-colors"
              >
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-300 group-hover:scale-110 transition-transform">
                      <ImageIcon size={18} />
                    </div>
                    <div>
                      <div className="text-xs md:text-sm text-white/90">Add Photos</div>
                      <div className="text-[10px] md:text-xs text-white/40">{activePhotoCount} memories loaded</div>
                    </div>
                 </div>
                 <input 
                   ref={fileInputRef} 
                   type="file" 
                   multiple 
                   accept="image/*" 
                   className="hidden" 
                   onChange={handlePhotoUpload} 
                 />
              </div>
            </div>

            {/* BGM Control */}
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-xs text-emerald-200/50 uppercase tracking-widest font-bold">Ambience</label>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => musicInputRef.current?.click()}
                   className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                   title="Upload BGM"
                 >
                   <Upload size={16} className="text-white/70" />
                 </button>
                 
                 <div className="flex-1 h-11 md:h-12 bg-white/5 border border-white/10 rounded-xl flex items-center px-3 justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                       <Music size={14} className={`text-amber-300 ${isPlaying ? 'animate-bounce' : ''}`} />
                       <span className="text-[10px] md:text-xs text-white/60 truncate w-20 md:w-24">
                         {bgm ? 'Playing...' : 'No Audio'}
                       </span>
                    </div>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={!bgm}
                      className="text-white/80 hover:text-white disabled:opacity-30"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                 </div>
                 <input 
                   ref={musicInputRef} 
                   type="file" 
                   accept="audio/*" 
                   className="hidden" 
                   onChange={handleMusicUpload} 
                 />
              </div>
              <audio ref={audioRef} src={bgm || ''} loop />
            </div>
          </div>
        </div>

      </div>

      {/* Gesture Component */}
      <GestureController active={true} onGesture={handleGesture} />

      {/* Intro Overlay - Mobile adjusted position */}
      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 pointer-events-none z-0">
          <div className="text-white/30 text-xs md:text-sm font-light tracking-wide">
             Interactive WebGL Experience
          </div>
      </div>

    </div>
  );
}