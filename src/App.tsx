import React, { useState, useCallback, useEffect } from 'react';
import { LayoutGrid, Layout, Settings, Music, Video as VideoIcon, Volume2, Info, Maximize2, Smartphone, Monitor } from 'lucide-react';
import { Deck } from './components/Deck';
import { Mixer } from './components/Mixer';
import { Sampler } from './components/Sampler';
import { VideoMixer } from './components/VideoMixer';
import { DeckId, DeckState } from './types';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_DECK_STATE = (id: DeckId): DeckState => ({
  id,
  isPlaying: false,
  volume: 0.8,
  pitch: 1.0,
  currentTime: 0,
  duration: 0,
  file: null,
  videoFile: null,
  eq: { low: 0, mid: 0, high: 0 },
  effects: { filter: 0, reverb: 0, delay: 0 },
  loopLength: null,
  isLooping: false,
  bpm: 128,
  key: null,
  isPitchLocked: true
});

export default function App() {
  const [decks, setDecks] = useState<DeckState[]>([
    INITIAL_DECK_STATE('A'),
    INITIAL_DECK_STATE('B'),
    INITIAL_DECK_STATE('C'),
    INITIAL_DECK_STATE('D'),
  ]);
  const [skin, setSkin] = useState<'2-deck' | '4-deck'>('4-deck');
  const [crossfader, setCrossfader] = useState(0.5);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [layoutOverride, setLayoutOverride] = useState<'auto' | 'landscape' | 'portrait'>('auto');

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveIsPortrait = layoutOverride === 'auto' ? isPortrait : layoutOverride === 'portrait';

  const updateDeck = useCallback((id: DeckId, updates: Partial<DeckState>) => {
    setDecks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden pb-20 lg:pb-12">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Music className="text-white" size={18} />
            </div>
            <h1 className="text-sm lg:text-lg font-black tracking-tighter text-white uppercase italic">
              OMAR LABS <span className="text-indigo-500 hidden sm:inline">DEEJAY</span>
            </h1>
          </div>
          <div className="h-4 w-[1px] bg-zinc-800 mx-1 lg:mx-2" />
          <nav className="flex gap-1">
            <button 
              onClick={() => setSkin('2-deck')}
              className={`px-2 lg:px-3 py-1.5 rounded-md text-[9px] lg:text-[10px] font-bold uppercase tracking-wider transition-all ${skin === '2-deck' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              2D
            </button>
            <button 
              onClick={() => setSkin('4-deck')}
              className={`px-2 lg:px-3 py-1.5 rounded-md text-[9px] lg:text-[10px] font-bold uppercase tracking-wider transition-all ${skin === '4-deck' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              4D
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-zinc-900/50 rounded-full border border-zinc-800">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-mono text-zinc-400">ENGINE OK</span>
            </div>
            <div className="w-[1px] h-3 bg-zinc-800" />
            <span className="text-[10px] font-mono text-zinc-400">44.1 KHZ</span>
          </div>
          
          {/* Orientation Indicator & Override */}
          <div className="flex items-center gap-1 p-1 bg-zinc-900/50 rounded-lg border border-zinc-800">
            <button 
              onClick={() => setLayoutOverride('auto')}
              className={`p-1.5 rounded transition-all ${layoutOverride === 'auto' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Auto Layout"
            >
              {isPortrait ? <Smartphone size={14} /> : <Monitor size={14} />}
            </button>
            <button 
              onClick={() => setLayoutOverride('landscape')}
              className={`p-1.5 rounded transition-all ${layoutOverride === 'landscape' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Force Landscape"
            >
              <Monitor size={14} />
            </button>
            <button 
              onClick={() => setLayoutOverride('portrait')}
              className={`p-1.5 rounded transition-all ${layoutOverride === 'portrait' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Force Portrait"
            >
              <Smartphone size={14} />
            </button>
          </div>

          <button className="p-2 text-zinc-500 hover:text-white transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="p-2 sm:p-4 lg:p-6 max-w-[1800px] mx-auto space-y-4 sm:space-y-6">
        {/* Top Section: Video Mixer & Sampler - Hidden on small portrait for focus */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 ${effectiveIsPortrait ? 'hidden sm:grid' : 'grid'}`}>
          <div className="lg:col-span-8">
            <VideoMixer decks={decks} crossfader={crossfader} />
          </div>
          <div className="lg:col-span-4">
            <Sampler />
          </div>
        </div>

        {/* Middle Section: Decks & Mixer */}
        <div className={`grid grid-cols-1 ${effectiveIsPortrait ? 'gap-4 sm:gap-8' : 'lg:grid-cols-12 gap-4 sm:gap-6'} items-stretch`}>
          {/* Left Decks */}
          <div className={`${effectiveIsPortrait ? 'order-1' : 'lg:col-span-4'} flex flex-col gap-4 sm:gap-6 ${skin === '2-deck' ? 'justify-center' : ''}`}>
            <Deck state={decks[0]} onUpdate={updateDeck} />
            {skin === '4-deck' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Deck state={decks[2]} onUpdate={updateDeck} isCompact />
              </motion.div>
            )}
          </div>

          {/* Center Mixer */}
          <div className={`${effectiveIsPortrait ? 'order-2' : 'lg:col-span-4'}`}>
            <Mixer 
              crossfader={crossfader} 
              onCrossfaderChange={setCrossfader}
              masterVolume={masterVolume}
              onMasterVolumeChange={setMasterVolume}
            />
          </div>

          {/* Right Decks */}
          <div className={`${effectiveIsPortrait ? 'order-3' : 'lg:col-span-4'} flex flex-col gap-4 sm:gap-6 ${skin === '2-deck' ? 'justify-center' : ''}`}>
            <Deck state={decks[1]} onUpdate={updateDeck} />
            {skin === '4-deck' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Deck state={decks[3]} onUpdate={updateDeck} isCompact />
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-10 border-t border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 fixed bottom-0 left-0 right-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-zinc-500" />
            <span className="text-[9px] lg:text-[10px] text-zinc-500 uppercase font-bold tracking-widest truncate max-w-[100px] sm:max-w-none">v1.2.4 Production</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-zinc-500">
            <Volume2 size={14} />
            <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${masterVolume * 100}%` }} />
            </div>
          </div>
          <button className="text-zinc-500 hover:text-white transition-colors">
            <Maximize2 size={14} />
          </button>
        </div>
      </footer>
    </div>
  );
}
