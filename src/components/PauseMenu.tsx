/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Keyboard } from 'lucide-react';

interface PauseMenuProps {
  levelName: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onResume: () => void;
  onRestart: () => void;
  onGoHome: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  levelName,
  isMuted,
  onToggleMute,
  onResume,
  onRestart,
  onGoHome,
}) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40 select-none font-sans text-white p-6">
      <div className="max-w-sm w-full bg-black border-4 border-white rounded-none p-6 shadow-[8px_8px_0px_#000000] relative">
        <div className="text-center mb-5">
          <h2 className="text-lg font-black text-yellow-400 tracking-wider retro-text-shadow-yellow">GAME PAUSED</h2>
          <p className="text-[9px] text-neutral-400 font-mono mt-2 uppercase">{levelName}</p>
        </div>

        {/* Buttons List */}
        <div className="space-y-3.5 mb-5">
          <button
            onClick={onResume}
            className="w-full py-2.5 px-4 retro-btn-yellow text-[10px] font-black flex items-center justify-center gap-2 rounded-none cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            RESUME GAME
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 retro-btn-dark text-[10px] font-black flex items-center justify-center gap-2 rounded-none cursor-pointer"
          >
            {isMuted ? '🔇 UNMUTE AUDIO' : '🔊 MUTE AUDIO'}
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 retro-btn-dark text-[10px] font-black flex items-center justify-center gap-2 rounded-none cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART LEVEL
          </button>

          <button
            onClick={onGoHome}
            className="w-full py-2.5 px-4 retro-btn-red text-[10px] font-black flex items-center justify-center gap-2 rounded-none cursor-pointer"
          >
            <Home className="w-4 h-4" />
            QUIT TO MENU
          </button>
        </div>

        {/* Short Controls Cheat Sheet */}
        <div className="border-t-2 border-neutral-800 pt-4 text-[8px] text-neutral-400 font-mono">
          <div className="flex items-center gap-1 font-bold text-neutral-300 uppercase mb-2">
            <Keyboard className="w-3.5 h-3.5" /> QUICK SHORTCUTS
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-left">
            <div>◀ ▶/A D: <span className="text-neutral-200">MOVE</span></div>
            <div>SPACE/W: <span className="text-neutral-200">JUMP</span></div>
            <div>SHIFT/X: <span className="text-neutral-200">SHOOT</span></div>
            <div>P / ESC: <span className="text-neutral-200">PAUSE</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
