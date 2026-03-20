import React, { useEffect, useRef } from 'react';
import { Video, Monitor, Layers } from 'lucide-react';
import { DeckState } from '../types';

interface VideoMixerProps {
  decks: DeckState[];
  crossfader: number;
}

export const VideoMixer: React.FC<VideoMixerProps> = ({ decks, crossfader }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Simple mix logic: Deck A/C on left, Deck B/D on right
      // We'll just show the active playing videos
      const leftDecks = decks.filter(d => (d.id === 'A' || d.id === 'C') && d.videoFile && d.isPlaying);
      const rightDecks = decks.filter(d => (d.id === 'B' || d.id === 'D') && d.videoFile && d.isPlaying);

      const leftVideo = leftDecks[0] ? videoRefs.current[leftDecks[0].id] : null;
      const rightVideo = rightDecks[0] ? videoRefs.current[rightDecks[0].id] : null;

      if (leftVideo) {
        ctx.globalAlpha = 1 - crossfader;
        ctx.drawImage(leftVideo, 0, 0, canvas.width, canvas.height);
      }

      if (rightVideo) {
        ctx.globalAlpha = crossfader;
        ctx.drawImage(rightVideo, 0, 0, canvas.width, canvas.height);
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [decks, crossfader]);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden relative group aspect-video shadow-2xl">
      <canvas 
        ref={canvasRef} 
        width={1280} 
        height={720} 
        className="w-full h-full object-cover"
      />
      
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Output</span>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-colors">
          <Monitor size={16} />
        </button>
        <button className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-colors">
          <Layers size={16} />
        </button>
      </div>

      {/* Hidden video elements for processing */}
      {decks.map(deck => (
        deck.videoFile && (
          <video
            key={deck.id}
            ref={el => videoRefs.current[deck.id] = el}
            src={URL.createObjectURL(deck.videoFile)}
            className="hidden"
            loop
            muted
            autoPlay={deck.isPlaying}
          />
        )
      ))}

      {!decks.some(d => d.videoFile && d.isPlaying) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 text-zinc-600 gap-3">
          <Video size={48} strokeWidth={1} />
          <p className="text-xs font-medium uppercase tracking-widest">No Video Input Active</p>
        </div>
      )}
    </div>
  );
};
