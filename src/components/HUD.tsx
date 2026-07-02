/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coins, Heart, Trophy, Clock } from 'lucide-react';

interface HUDProps {
  score: number;
  coins: number;
  lives: number;
  levelName: string;
  timeLeft: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  coins,
  lives,
  levelName,
  timeLeft,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  return (
    <div id="game-hud" className="absolute top-0 left-0 w-full p-2 sm:p-4 flex flex-col gap-1.5 sm:gap-2 text-white pointer-events-none select-none z-30 font-sans text-[10px] bg-gradient-to-b from-black/80 via-black/40 to-transparent">
      {/* NES Classic columns HUD row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 text-center tracking-wider gap-y-1.5 gap-x-1 retro-text-shadow">
        <div>
          <span className="block text-[7px] sm:text-[8px] text-neutral-400">MARIO</span>
          <span className="text-white block mt-1 text-[9px] sm:text-[10px]">{score.toString().padStart(6, '0')}</span>
        </div>
        <div>
          <span className="block text-[7px] sm:text-[8px] text-neutral-400">COINS</span>
          <span className="text-yellow-300 block mt-1 text-[9px] sm:text-[10px]">🪙 x{coins.toString().padStart(2, '0')}</span>
        </div>
        <div>
          <span className="block text-[7px] sm:text-[8px] text-neutral-400">WORLD</span>
          <span className="text-sky-300 block mt-1 uppercase text-[9px] sm:text-[10px]">
            {levelName.includes("1-1") || levelName.toLowerCase().includes("grassland") ? "1-1" :
             levelName.includes("1-2") || levelName.toLowerCase().includes("cavern") ? "1-2" : "1-3"}
          </span>
        </div>
        <div>
          <span className="block text-[7px] sm:text-[8px] text-neutral-400">TIME</span>
          <span className="text-emerald-400 block mt-1 text-[9px] sm:text-[10px]">{timeLeft.toString().padStart(3, '0')}</span>
        </div>
        <div>
          <span className="block text-[7px] sm:text-[8px] text-neutral-400">LIVES</span>
          <span className="text-red-400 block mt-1 text-[9px] sm:text-[10px]">❤️ x{lives}</span>
        </div>
      </div>

      {/* Control buttons layer (interactive) */}
      <div className="flex justify-end gap-2 mt-1 pointer-events-auto">
        <button
          id="btn-mute"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="px-2 py-1 bg-black border-2 border-white hover:bg-neutral-800 text-[9px] font-bold transition active:scale-95 cursor-pointer rounded-none"
          title="Mute/Unmute Audio"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button
          id="btn-pause"
          onClick={(e) => {
            e.stopPropagation();
            onPause();
          }}
          className="px-3 py-1 bg-red-600 text-white border-2 border-white hover:bg-red-700 text-[9px] font-bold transition active:scale-95 cursor-pointer rounded-none shadow-[2px_2px_0px_#000]"
        >
          PAUSE
        </button>
      </div>
    </div>
  );
};
