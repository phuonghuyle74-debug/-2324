import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2, Hand } from 'lucide-react';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

interface GestureControllerProps {
  onGesture: (command: 'SCATTER' | 'GATHER') => void;
  active: boolean;
}

export const GestureController: React.FC<GestureControllerProps> = ({ onGesture, active }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string>('None');
  
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const animationFrameRef = useRef<number>(0);

  // Load Model
  useEffect(() => {
    const loadModel = async () => {
      setLoading(true);
      try {
        // Load WASM from jsdelivr to ensure availability
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        );
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        recognizerRef.current = recognizer;
        console.log("Gesture Recognizer loaded");
      } catch (error) {
        console.error("Failed to load gesture model:", error);
      } finally {
        setLoading(false);
      }
    };

    if (active && !recognizerRef.current) {
      loadModel();
    }
  }, [active]);

  // Start Camera
  const startCamera = async () => {
    if (!recognizerRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "user" 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata to load to get dimensions
        videoRef.current.onloadedmetadata = () => {
           videoRef.current?.play();
           setEnabled(true);
           predictWebcam();
        }
      }
    } catch (e) {
      console.error("Camera access denied", e);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setEnabled(false);
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const predictWebcam = () => {
    if (!videoRef.current || !canvasRef.current || !recognizerRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      
      const results = recognizerRef.current.recognizeForVideo(video, Date.now());

      // Draw results for debugging/feedback
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Simple visualization
        if (results.landmarks && results.landmarks.length > 0) {
           const landmarks = results.landmarks[0];
           // Draw a simple box or points
           ctx.fillStyle = '#10b981';
           landmarks.forEach(p => {
             ctx.fillRect(p.x * canvas.width, p.y * canvas.height, 4, 4);
           });
        }
      }

      if (results.gestures.length > 0) {
        const gesture = results.gestures[0][0];
        const name = gesture.categoryName;
        const score = gesture.score;

        if (score > 0.5) {
          setDetectedGesture(name);
          // Logic mapping
          if (name === 'Open_Palm') {
            onGesture('SCATTER');
          } else if (name === 'Closed_Fist') {
            onGesture('GATHER');
          }
        }
      } else {
        setDetectedGesture('None');
      }
    }

    if (enabled) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    }
  };

  useEffect(() => {
    if (enabled) {
      // Keep loop running
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [enabled]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-auto">
      {enabled && (
        <div className="relative w-32 h-24 md:w-40 md:h-32 bg-black/50 rounded-lg overflow-hidden border border-white/20 shadow-xl backdrop-blur-sm">
           <video 
             ref={videoRef} 
             className="absolute w-full h-full object-cover opacity-60" 
             muted 
             playsInline 
           />
           <canvas 
             ref={canvasRef}
             className="absolute top-0 left-0 w-full h-full object-cover"
             width={320}
             height={240}
           />
           
           {/* Gesture Label */}
           <div className="absolute bottom-0 left-0 w-full bg-black/60 p-1 text-center">
             <span className="text-[10px] md:text-xs text-white font-mono uppercase tracking-wider">
               {detectedGesture === 'Open_Palm' ? '🖐 SCATTER' : 
                detectedGesture === 'Closed_Fist' ? '✊ GATHER' : 
                'Scanning...'}
             </span>
           </div>
        </div>
      )}
      
      <button 
        onClick={enabled ? stopCamera : startCamera}
        disabled={loading}
        className={`p-3 md:p-4 rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg ${
          enabled 
            ? 'bg-red-500/20 border-red-500/50 text-red-100 hover:bg-red-500/40' 
            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
        }`}
        title={enabled ? "Stop Gesture Control" : "Enable Gesture Control"}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : 
         enabled ? <CameraOff size={20} /> : <Hand size={20} />}
      </button>
      
      {!enabled && !loading && (
        <div className="text-[10px] text-white/50 bg-black/40 px-2 py-1 rounded backdrop-blur-md">
           Tap to enable gestures
        </div>
      )}
    </div>
  );
};