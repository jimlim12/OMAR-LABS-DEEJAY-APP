import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, RotateCcw, Music, Video, Zap, Hash, Repeat, Scissors, Sliders, Activity, Lock, Unlock } from 'lucide-react';
import { DeckId, DeckState } from '../types';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { analyze } from 'web-audio-beat-detector';

const SpectrumVisualizer: React.FC<{ analyser: AnalyserNode | null; isPlaying: boolean }> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const r = barHeight + 100 * (i / bufferLength);
        const g = 50 * (i / bufferLength);
        const b = 255;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    if (isPlaying) {
      draw();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [analyser, isPlaying]);

  return <canvas ref={canvasRef} className="w-full h-12 opacity-50" width={300} height={100} />;
};

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  color?: string;
}

const Knob: React.FC<KnobProps> = ({ label, value, min, max, onChange, color = 'red' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startVal.current = value;
    document.body.style.cursor = 'ns-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const delta = startY.current - currentY;
      const range = max - min;
      const newVal = Math.min(max, Math.max(min, startVal.current + (delta / 100) * range));
      onChange(newVal);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, min, max, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = (percentage / 100) * 270 - 135;

  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#333] to-[#111] border-2 border-[#2a2a2a] flex items-center justify-center cursor-ns-resize group shadow-lg"
      >
        <div 
          className={`absolute w-0.5 sm:w-1 h-3 sm:h-4 bg-${color}-500 top-1 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]`}
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'bottom center' }}
        />
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 flex items-center justify-center">
          <span className="text-[6px] sm:text-[7px] font-black text-zinc-500 group-hover:text-white transition-colors uppercase">{label}</span>
        </div>
      </div>
      <span className="text-[7px] sm:text-[8px] font-mono text-zinc-500">{value.toFixed(1)}</span>
    </div>
  );
};

interface DeckProps {
  state: DeckState;
  onUpdate: (id: DeckId, updates: Partial<DeckState>) => void;
  isCompact?: boolean;
}

export const Deck: React.FC<DeckProps> = ({ state, onUpdate, isCompact }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const loopStartRef = useRef<number>(0);
  const [isScratching, setIsScratching] = useState(false);
  const [isWaveScratching, setIsWaveScratching] = useState(false);
  const lastAngle = useRef(0);
  const lastX = useRef(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [rms, setRms] = useState(0); // Root Mean Square for beat pulsing

  const handleScratchStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsScratching(true);
    if (state.isPlaying) {
      onUpdate(state.id, { isPlaying: false });
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastAngle.current = Math.atan2(clientY - centerY, clientX - centerX);
  };

  const handleWaveScratchStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent dropzone from triggering if we are scratching
    e.stopPropagation();
    setIsWaveScratching(true);
    if (state.isPlaying) {
      onUpdate(state.id, { isPlaying: false });
    }
    lastX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
  };

  const handleWaveScratchMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isWaveScratching || !wavesurfer.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - lastX.current;
    
    const duration = wavesurfer.current.getDuration();
    if (duration > 0) {
      const seekDelta = (deltaX / window.innerWidth) * duration * 0.5; // Sensitivity
      const newTime = Math.max(0, Math.min(duration, state.currentTime + seekDelta));
      wavesurfer.current.seekTo(newTime / duration);
    }
    
    lastX.current = clientX;
  }, [isWaveScratching, state.currentTime, state.id]);

  const handleScratchMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isScratching || !wavesurfer.current) return;
    
    // We need to find the element again or pass it
    const jogWheel = document.getElementById(`jog-${state.id}`);
    if (!jogWheel) return;

    const rect = jogWheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const currentAngle = Math.atan2(clientY - centerY, clientX - centerX);
    let delta = currentAngle - lastAngle.current;
    
    // Handle wrap around
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    const duration = wavesurfer.current.getDuration();
    if (duration > 0) {
      const seekDelta = (delta / (2 * Math.PI)) * 2; // Adjust sensitivity
      const newTime = Math.max(0, Math.min(duration, state.currentTime + seekDelta));
      wavesurfer.current.seekTo(newTime / duration);
    }
    
    lastAngle.current = currentAngle;
  }, [isScratching, state.currentTime, state.id]);

  const handleScratchEnd = () => {
    setIsScratching(false);
    setIsWaveScratching(false);
  };

  useEffect(() => {
    if (isScratching || isWaveScratching) {
      window.addEventListener('mousemove', isScratching ? handleScratchMove : handleWaveScratchMove);
      window.addEventListener('mouseup', handleScratchEnd);
      window.addEventListener('touchmove', isScratching ? handleScratchMove : handleWaveScratchMove);
      window.addEventListener('touchend', handleScratchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', isScratching ? handleScratchMove : handleWaveScratchMove);
      window.removeEventListener('mouseup', handleScratchEnd);
      window.removeEventListener('touchmove', isScratching ? handleScratchMove : handleWaveScratchMove);
      window.removeEventListener('touchend', handleScratchEnd);
    };
  }, [isScratching, isWaveScratching, handleScratchMove, handleWaveScratchMove]);

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    onDrop: (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file.type.startsWith('video/')) {
        onUpdate(state.id, { videoFile: file });
      } else {
        onUpdate(state.id, { file: file });
      }
    }
  } as any);

  useEffect(() => {
    if (waveformRef.current && !wavesurfer.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#3f3f46',
        progressColor: '#ef4444',
        cursorColor: '#ffffff',
        barWidth: 2,
        barRadius: 3,
        height: isCompact ? 30 : 60,
        normalize: true,
      });

      wavesurfer.current.on('timeupdate', (time) => {
        onUpdate(state.id, { currentTime: time });
        
        // Looping logic
        if (state.isLooping && state.loopLength) {
          const beatDuration = 60 / state.bpm;
          const loopDuration = state.loopLength * beatDuration;
          if (time >= loopStartRef.current + loopDuration) {
            wavesurfer.current?.seekTo(loopStartRef.current / wavesurfer.current.getDuration());
          }
        }
      });

      wavesurfer.current.on('ready', () => {
        onUpdate(state.id, { duration: wavesurfer.current?.getDuration() || 0 });
        
        // Setup Analyser
        if (wavesurfer.current) {
          const audioContext = wavesurfer.current.getAudioContext();
          const mediaElement = wavesurfer.current.getMediaElement();
          
          // Check if already connected to avoid "MediaElementAudioSourceNode has already been created" error
          // In some environments/versions, we might need a more robust way to handle this.
          try {
            const analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 256;
            const source = audioContext.createMediaElementSource(mediaElement);
            source.connect(analyserNode);
            analyserNode.connect(audioContext.destination);
            setAnalyser(analyserNode);
          } catch (e) {
            console.warn('Audio nodes already connected or context issue:', e);
          }
        }
      });
    }

    return () => {
      wavesurfer.current?.destroy();
      wavesurfer.current = null;
    };
  }, [isCompact]);

  useEffect(() => {
    if (state.file && wavesurfer.current) {
      const url = URL.createObjectURL(state.file);
      wavesurfer.current.load(url);

      // Analyze BPM
      const analyzeBPM = async () => {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await state.file!.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const bpm = await analyze(audioBuffer);
          
          // Round BPM to nearest integer or 0.1
          const roundedBPM = Math.round(bpm);
          onUpdate(state.id, { bpm: roundedBPM });
          console.log(`Analyzed BPM for Deck ${state.id}: ${roundedBPM}`);
        } catch (error) {
          console.error('BPM Analysis failed:', error);
        }
      };

      analyzeBPM();

      return () => URL.revokeObjectURL(url);
    }
  }, [state.file]);

  useEffect(() => {
    if (wavesurfer.current) {
      if (state.isPlaying) {
        wavesurfer.current.play();
      } else {
        wavesurfer.current.pause();
      }
    }
  }, [state.isPlaying]);

  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(state.volume);
    }
  }, [state.volume]);

  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setPlaybackRate(state.pitch, state.isPitchLocked);
    }
  }, [state.pitch, state.isPitchLocked]);

  useEffect(() => {
    if (!analyser || !state.isPlaying) {
      setRms(0);
      return;
    }

    let animationFrame: number;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateRms = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const average = Math.sqrt(sum / bufferLength);
      setRms(average / 128); // Normalize roughly
      animationFrame = requestAnimationFrame(updateRms);
    };

    updateRms();
    return () => cancelAnimationFrame(animationFrame);
  }, [analyser, state.isPlaying]);

  const rotation = (state.currentTime * 360) % 360;

  return (
    <div className={`bg-[#1a1a1a] border-2 sm:border-4 border-[#2a2a2a] rounded-2xl sm:rounded-3xl p-3 sm:p-6 flex flex-col gap-3 sm:gap-6 shadow-2xl relative overflow-hidden ${isCompact ? 'h-full' : ''}`}>
      {/* Top Bar: Info & Waveform */}
      <div className="flex flex-col gap-2 sm:gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-600 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] text-base sm:text-xl italic shrink-0">
              {state.id}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100 truncate max-w-[120px] sm:max-w-[200px] uppercase tracking-tight">
                {state.file?.name || 'LOAD TRACK'}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <span className="text-[8px] sm:text-[10px] text-red-500 font-black uppercase tracking-widest">
                  {state.videoFile ? 'VIDEO' : 'AUDIO'}
                </span>
                <span className="text-[8px] sm:text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                  {Math.floor(state.currentTime / 60)}:{(state.currentTime % 60).toFixed(0).padStart(2, '0')} / {Math.floor(state.duration / 60)}:{(state.duration % 60).toFixed(0).padStart(2, '0')}
                </span>
                {state.bpm > 0 && (
                  <div className="flex items-center gap-1 px-1 sm:px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700">
                    <Activity size={8} className="text-emerald-500" />
                    <span className="text-[8px] sm:text-[9px] font-mono text-emerald-500 font-bold">{state.bpm} BPM</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 shrink-0">
            <button className="px-2 sm:px-3 py-1 rounded bg-zinc-800 text-[8px] sm:text-[10px] font-bold text-zinc-400 hover:text-white transition-colors border border-zinc-700">
              SYNC
            </button>
            <button className="px-2 sm:px-3 py-1 rounded bg-zinc-800 text-[8px] sm:text-[10px] font-bold text-zinc-400 hover:text-white transition-colors border border-zinc-700">
              MST
            </button>
          </div>
        </div>

        <div {...getRootProps()} className="relative group">
          <input {...getInputProps()} />
          <div 
            className="relative cursor-pointer"
            onMouseDown={handleWaveScratchStart}
            onTouchStart={handleWaveScratchStart}
          >
            <div ref={waveformRef} className="w-full bg-black/40 rounded-xl overflow-hidden border border-zinc-800" />
            <div className="absolute inset-0 pointer-events-none flex items-end">
              <SpectrumVisualizer analyser={analyser} isPlaying={state.isPlaying} />
            </div>
          </div>
          {!state.file && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-zinc-500 transition-colors">
              DRAG & DROP MEDIA
            </div>
          )}
        </div>
      </div>

      {/* Main Control Section: Jog Wheel & Pitch */}
      <div className="flex items-center justify-between gap-4 sm:gap-8">
        {/* Jog Wheel */}
        <div className="relative flex-1 flex justify-center items-center py-2 sm:py-4">
          <motion.div 
            id={`jog-${state.id}`}
            onMouseDown={handleScratchStart}
            onTouchStart={handleScratchStart}
            animate={{ 
              rotate: rotation,
              scale: 1 + rms * 0.05, // Beat pulse
              boxShadow: state.isPlaying ? `0 0 ${20 + rms * 40}px rgba(239, 68, 68, ${0.2 + rms * 0.4})` : '0 0 50px rgba(0,0,0,0.5)'
            }}
            transition={{ ease: "linear", duration: 0 }}
            className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-[#222] to-[#111] border-[8px] sm:border-[12px] border-[#2a2a2a] flex items-center justify-center relative group cursor-grab active:cursor-grabbing"
          >
            {/* Grooves */}
            <div className="absolute inset-0 rounded-full border border-white/5 opacity-20" />
            <div className="absolute inset-4 rounded-full border border-white/5 opacity-20" />
            <div className="absolute inset-8 rounded-full border border-white/5 opacity-20" />
            
            {/* Center Display */}
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-black border-2 border-red-600/50 flex flex-col items-center justify-center shadow-inner">
              <span className="text-[6px] sm:text-[8px] font-black text-red-500 uppercase tracking-tighter">OMARLABS</span>
              <span className="text-[8px] sm:text-[10px] font-mono text-white leading-none">
                {state.isPlaying ? 'PLAY' : 'STOP'}
              </span>
            </div>

            {/* Position Marker */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-4 sm:h-6 bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.8)] rounded-full" />
          </motion.div>
        </div>

        {/* Pitch Fader */}
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => onUpdate(state.id, { isPitchLocked: !state.isPitchLocked })}
              className={`px-1.5 sm:px-2 py-1 rounded border transition-all flex items-center justify-center gap-1 ${
                state.isPitchLocked 
                  ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}
              title="Key Lock / Master Tempo"
            >
              {state.isPitchLocked ? <Lock size={8} className="sm:w-[10px] sm:h-[10px]" /> : <Unlock size={8} className="sm:w-[10px] sm:h-[10px]" />}
              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">MT</span>
            </button>
            <button 
              onClick={() => onUpdate(state.id, { pitch: 1.0 })}
              className="px-1.5 sm:px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-all text-[7px] sm:text-[8px] font-black uppercase tracking-widest"
              title="Reset Pitch to 0%"
            >
              RST
            </button>
          </div>
          <span className="text-[8px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest">Pitch</span>
          <div className="h-32 sm:h-48 w-8 sm:w-10 bg-black rounded-lg sm:rounded-xl border-2 border-[#2a2a2a] relative flex justify-center p-1">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-zinc-800" />
            <input 
              type="range" 
              min="0.5" max="2" step="0.001" 
              value={state.pitch}
              onChange={(e) => {
                const p = parseFloat(e.target.value);
                onUpdate(state.id, { pitch: p });
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -rotate-180 [writing-mode:vertical-lr]"
            />
            <div 
              className="absolute w-6 sm:w-8 h-8 sm:h-12 bg-[#333] border border-zinc-600 rounded shadow-lg flex flex-col items-center justify-center pointer-events-none"
              style={{ top: `${(2 - state.pitch) / 1.5 * 100}%`, transform: 'translateY(-50%)' }}
            >
              <div className="w-4 sm:w-6 h-[1px] bg-red-500" />
            </div>
          </div>
          <span className="text-[8px] sm:text-[10px] font-mono text-red-500 font-bold">{(state.pitch * 100 - 100).toFixed(2)}%</span>
        </div>
      </div>

      {/* Bottom Section: Pads & Transport */}
      <div className="grid grid-cols-12 gap-2 sm:gap-6">
        {/* Performance Pads */}
        <div className="col-span-8 flex flex-col gap-2 sm:gap-4">
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {[
              { icon: <Zap size={10} className="sm:w-[14px] sm:h-[14px]" />, label: 'CUE' },
              { icon: <Hash size={10} className="sm:w-[14px] sm:h-[14px]" />, label: 'LOOP' },
              { icon: <Repeat size={10} className="sm:w-[14px] sm:h-[14px]" />, label: 'ROLL' },
              { icon: <Scissors size={10} className="sm:w-[14px] sm:h-[14px]" />, label: 'SLICE' },
            ].map((pad, i) => (
              <React.Fragment key={i}>
                <button className="aspect-square rounded-md sm:rounded-lg bg-zinc-800/50 border border-zinc-700 flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-zinc-500 hover:bg-red-600/20 hover:text-red-500 hover:border-red-600/50 transition-all active:scale-95">
                  {pad.icon}
                  <span className="text-[6px] sm:text-[7px] font-black">{pad.label}</span>
                </button>
                <button className="aspect-square rounded-md sm:rounded-lg bg-zinc-800/50 border border-zinc-700 flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-zinc-500 hover:bg-blue-600/20 hover:text-blue-500 hover:border-blue-600/50 transition-all active:scale-95">
                  {pad.icon}
                  <span className="text-[6px] sm:text-[7px] font-black">{pad.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Loop Controls */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest">Auto Loop</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[8px] sm:text-[9px] font-black text-zinc-600 uppercase">BPM</span>
                <input 
                  type="number" 
                  value={state.bpm}
                  onChange={(e) => onUpdate(state.id, { bpm: parseFloat(e.target.value) || 128 })}
                  className="w-10 sm:w-12 bg-black border border-zinc-800 rounded px-1 text-[8px] sm:text-[10px] font-mono text-red-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-0.5 sm:gap-1">
              {[0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128].map((length) => (
                <button 
                  key={length}
                  onClick={() => {
                    const isNewLoop = state.loopLength !== length || !state.isLooping;
                    if (isNewLoop) {
                      loopStartRef.current = state.currentTime;
                    }
                    onUpdate(state.id, { 
                      loopLength: isNewLoop ? length : null,
                      isLooping: isNewLoop
                    });
                  }}
                  className={`py-1 sm:py-1.5 rounded text-[7px] sm:text-[9px] font-bold transition-all border ${
                    state.isLooping && state.loopLength === length
                      ? 'bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                  }`}
                >
                  {length < 1 ? `1/${1/length}` : length}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="col-span-4 flex flex-col gap-2">
          <button 
            onClick={() => wavesurfer.current?.seekTo(0)}
            className="flex-1 rounded-lg sm:rounded-xl bg-zinc-800 border-2 border-[#333] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all active:scale-95 font-black text-[10px] sm:text-xs uppercase italic"
          >
            CUE
          </button>
          <button 
            onClick={() => onUpdate(state.id, { isPlaying: !state.isPlaying })}
            className={`flex-[2] rounded-lg sm:rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 gap-1 sm:gap-2 ${
              state.isPlaying 
                ? 'bg-red-600/10 border-red-600 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                : 'bg-zinc-800 border-[#333] text-zinc-400'
            }`}
          >
            {state.isPlaying ? <Pause size={16} className="sm:w-6 sm:h-6" fill="currentColor" /> : <Play size={16} className="sm:w-6 sm:h-6" fill="currentColor" />}
            <span className="font-black text-xs sm:text-sm uppercase italic">{state.isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>
        </div>
      </div>

      {/* EQ & Effects Section */}
      {!isCompact && (
        <div className="flex flex-col gap-3 sm:gap-6 pt-2 sm:pt-4 border-t border-zinc-800/50">
          <div className="flex justify-between items-start">
            {/* EQ Knobs */}
            <div className="flex flex-col gap-1 sm:gap-2">
              <span className="text-[7px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                <Sliders size={8} className="sm:w-[10px] sm:h-[10px]" /> EQ
              </span>
              <div className="flex gap-2 sm:gap-4">
                <Knob 
                  label="LOW" 
                  value={state.eq.low} 
                  min={-12} max={12} 
                  onChange={(val) => onUpdate(state.id, { eq: { ...state.eq, low: val } })} 
                  color="blue"
                />
                <Knob 
                  label="MID" 
                  value={state.eq.mid} 
                  min={-12} max={12} 
                  onChange={(val) => onUpdate(state.id, { eq: { ...state.eq, mid: val } })} 
                  color="yellow"
                />
                <Knob 
                  label="HIGH" 
                  value={state.eq.high} 
                  min={-12} max={12} 
                  onChange={(val) => onUpdate(state.id, { eq: { ...state.eq, high: val } })} 
                  color="red"
                />
              </div>
            </div>

            {/* Effects Knobs */}
            <div className="flex flex-col gap-1 sm:gap-2">
              <span className="text-[7px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                <Zap size={8} className="sm:w-[10px] sm:h-[10px]" /> FX
              </span>
              <div className="flex gap-2 sm:gap-4">
                <Knob 
                  label="FLTR" 
                  value={state.effects.filter} 
                  min={0} max={100} 
                  onChange={(val) => onUpdate(state.id, { effects: { ...state.effects, filter: val } })} 
                  color="emerald"
                />
                <Knob 
                  label="RVB" 
                  value={state.effects.reverb} 
                  min={0} max={100} 
                  onChange={(val) => onUpdate(state.id, { effects: { ...state.effects, reverb: val } })} 
                  color="indigo"
                />
                <Knob 
                  label="DLY" 
                  value={state.effects.delay} 
                  min={0} max={100} 
                  onChange={(val) => onUpdate(state.id, { effects: { ...state.effects, delay: val } })} 
                  color="violet"
                />
              </div>
            </div>

            {/* Master Gain */}
            <div className="flex flex-col items-end gap-1 sm:gap-2">
              <span className="text-[7px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest">Gain</span>
              <div className="flex items-center gap-2 sm:gap-4 h-10 sm:h-12">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] sm:text-[10px] font-mono text-zinc-400">{Math.round(state.volume * 100)}%</span>
                </div>
                <div className="w-24 sm:w-32 h-2 sm:h-3 bg-black rounded-full border border-zinc-800 overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all" 
                    style={{ width: `${state.volume * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
