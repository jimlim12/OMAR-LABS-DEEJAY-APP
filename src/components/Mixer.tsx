import React from 'react';
import { Zap, Music2, Volume2 } from 'lucide-react';

interface MixerProps {
  crossfader: number;
  onCrossfaderChange: (val: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (val: number) => void;
}

export const Mixer: React.FC<MixerProps> = ({ 
  crossfader, 
  onCrossfaderChange, 
  masterVolume, 
  onMasterVolumeChange 
}) => {
  return (
    <div className="bg-[#1a1a1a] border-2 sm:border-4 border-[#2a2a2a] rounded-2xl sm:rounded-3xl p-3 sm:p-6 flex flex-col items-center justify-between h-full shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-red-600/20" />
      
      <div className="flex flex-col items-center gap-3 sm:gap-6 w-full">
        <div className="flex items-center gap-1 sm:gap-2 text-zinc-500">
          <Volume2 size={12} className="text-red-500 sm:w-4 sm:h-4" />
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Master</span>
        </div>
        
        <div className="h-32 sm:h-48 w-3 sm:w-4 bg-black rounded-full relative flex flex-col items-center border border-zinc-800 shadow-inner">
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600 to-red-400 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            style={{ height: `${masterVolume * 100}%` }}
          />
          <input 
            type="range" 
            min="0" max="1" step="0.01"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -rotate-180 [writing-mode:vertical-lr]"
          />
        </div>
      </div>

      <div className="w-full space-y-2 sm:space-y-4">
        <div className="flex justify-between px-2 sm:px-4">
          <span className="text-[8px] sm:text-[10px] font-black text-red-600 italic">A/C</span>
          <span className="text-[8px] sm:text-[10px] font-black text-red-600 italic">B/D</span>
        </div>
        <div className="relative h-10 sm:h-14 w-full bg-black rounded-xl sm:rounded-2xl border-2 border-[#2a2a2a] flex items-center px-1 sm:px-2 shadow-inner">
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div className="w-[1px] h-full bg-zinc-800" />
          </div>
          <div 
            className="absolute h-8 sm:h-10 w-12 sm:w-16 bg-[#333] border-2 border-zinc-600 rounded-lg sm:rounded-xl shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow hover:shadow-red-600/10 z-10"
            style={{ left: `calc(${crossfader * 100}% - ${crossfader * (window.innerWidth < 640 ? 48 : 64)}px)` }}
          >
            <div className="w-1 h-4 sm:h-6 bg-red-600 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          </div>
          <input 
            type="range" 
            min="0" max="1" step="0.01"
            value={crossfader}
            onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="text-center">
          <span className="text-[6px] sm:text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">X-Fader</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
        <button className="aspect-square rounded-xl sm:rounded-2xl bg-zinc-800/50 border-2 border-[#333] flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-zinc-500 hover:text-red-500 hover:border-red-600/50 hover:bg-red-600/10 transition-all group active:scale-95">
          <Zap size={16} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
          <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-widest">Sync</span>
        </button>
        <button className="aspect-square rounded-xl sm:rounded-2xl bg-zinc-800/50 border-2 border-[#333] flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-zinc-500 hover:text-blue-500 hover:border-blue-600/50 hover:bg-blue-600/10 transition-all group active:scale-95">
          <Music2 size={16} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
          <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-widest">Cue</span>
        </button>
      </div>
    </div>
  );
};
