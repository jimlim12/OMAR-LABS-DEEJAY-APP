import React, { useState } from 'react';
import { Grid, Plus, Trash2 } from 'lucide-react';
import { Sample } from '../types';

export const Sampler: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([
    { id: '1', name: 'Airhorn', url: '#', color: 'bg-red-500' },
    { id: '2', name: 'Laser', url: '#', color: 'bg-blue-500' },
    { id: '3', name: 'Siren', url: '#', color: 'bg-yellow-500' },
    { id: '4', name: 'Bass Drop', url: '#', color: 'bg-purple-500' },
    { id: '5', name: 'Clap', url: '#', color: 'bg-emerald-500' },
    { id: '6', name: 'Kick', url: '#', color: 'bg-orange-500' },
    { id: '7', name: 'Snare', url: '#', color: 'bg-pink-500' },
    { id: '8', name: 'Hi-Hat', url: '#', color: 'bg-cyan-500' },
  ]);

  const playSample = (id: string) => {
    console.log('Playing sample:', id);
    // In a real app, we'd trigger the Web Audio API here
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <Grid size={16} />
          <h3 className="text-xs font-bold uppercase tracking-widest">Custom Sampler</h3>
        </div>
        <button className="p-1.5 rounded-lg bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
          <Plus size={14} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 flex-1">
        {samples.map((sample) => (
          <button
            key={sample.id}
            onMouseDown={() => playSample(sample.id)}
            className={`relative group aspect-square rounded-xl ${sample.color} bg-opacity-10 border border-white/5 hover:bg-opacity-20 active:scale-95 transition-all flex flex-col items-center justify-center overflow-hidden`}
          >
            <div className={`absolute inset-0 ${sample.color} opacity-0 group-active:opacity-40 transition-opacity`} />
            <span className="text-[10px] font-bold text-white/80 z-10 text-center px-1">
              {sample.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
