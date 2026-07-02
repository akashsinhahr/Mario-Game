/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Volume2, Award, Keyboard, ArrowRight } from 'lucide-react';
import { HighScore } from '../types';
import { audio } from '../audio';

interface MainMenuProps {
  onStartGame: (levelId: number) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('mario_player_name') || 'MARIO';
  });

  useEffect(() => {
    // Read high scores from localStorage
    const scores = localStorage.getItem('mario_high_scores');
    if (scores) {
      try {
        setHighScores(JSON.parse(scores));
      } catch (e) {
        console.error("Failed to parse high scores", e);
      }
    } else {
      // Default initial scores for retro feel
      const defaultScores: HighScore[] = [
        { name: 'LUIGI', score: 12500, coins: 45, date: '2026-06-25' },
        { name: 'MARIO', score: 9800, coins: 32, date: '2026-06-30' },
        { name: 'TOAD', score: 4300, coins: 15, date: '2026-07-01' },
      ];
      localStorage.setItem('mario_high_scores', JSON.stringify(defaultScores));
      setHighScores(defaultScores);
    }
  }, []);

  const handleStart = () => {
    audio.init();
    audio.playCoin();
    localStorage.setItem('mario_player_name', playerName.trim() || 'MARIO');
    onStartGame(selectedLevel);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] w-full bg-[#5c94fc] p-4 md:p-6 select-none font-sans text-white relative overflow-hidden">
      {/* Fluffy retro pixel style clouds in background, gently drifting for life */}
      <div className="absolute top-10 left-[10%] w-24 h-10 bg-white border-4 border-black shadow-[4px_4px_0px_#000] pointer-events-none animate-drift" />
      <div className="absolute top-24 right-[15%] w-32 h-12 bg-white border-4 border-black shadow-[4px_4px_0px_#000] pointer-events-none animate-drift" style={{ animationDelay: '1.5s', animationDirection: 'alternate-reverse' }} />
      <div className="absolute bottom-32 left-[25%] w-20 h-8 bg-white border-4 border-black shadow-[4px_4px_0px_#000] pointer-events-none animate-drift" style={{ animationDelay: '3s' }} />

      {/* Main retro box */}
      <div className="bg-black border-4 border-white p-6 max-w-2xl w-full z-10 flex flex-col md:flex-row gap-6 relative shadow-[8px_8px_0px_#000000]">
        {/* Left Side: Game Branding & Play Trigger */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="text-center md:text-left mb-4">
            {/* Super Mario Retro-style Logo Header */}
            <div className="inline-block px-2.5 py-1 bg-red-600 text-white font-bold text-[8px] tracking-wider uppercase transform -rotate-1 mb-2.5 border-2 border-white shadow-[2px_2px_0px_#000]">
              CHIPTUNE ARCADE CLASSIC
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase flex flex-col items-center md:items-start gap-y-1">
              <span className="text-red-500 retro-text-shadow-sm inline-block animate-pulse">SUPER</span>
              <span className="text-yellow-400 retro-text-shadow-sm inline-block">PIXEL MARIO</span>
            </h1>
            <p className="text-[10px] text-neutral-400 mt-2 font-mono leading-relaxed">
              CLASSIC 2D PLATFORMER EXPERIENCE
            </p>
          </div>

          {/* Player Name & Level Selection */}
          <div className="space-y-4 my-4 bg-neutral-950 p-3.5 border-2 border-neutral-800">
            <div>
              <label className="block text-[10px] font-bold uppercase text-yellow-400 mb-1 font-mono">
                Player Name:
              </label>
              <input
                type="text"
                maxLength={10}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                className="w-full px-2 py-1.5 bg-black border-2 border-white text-white text-[11px] font-mono tracking-wide uppercase focus:outline-none focus:ring-0 rounded-none"
                placeholder="MARIO"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-yellow-400 mb-1 font-mono">
                Select World Level:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setSelectedLevel(lvl);
                      audio.init();
                      audio.playJump();
                    }}
                    className={`py-2 px-0.5 border-2 text-[8px] font-bold transition cursor-pointer rounded-none ${
                      selectedLevel === lvl
                        ? 'bg-yellow-400 border-white text-black shadow-[2px_2px_0px_#000] transform translate-y-[-1px]'
                        : 'bg-black border-neutral-700 text-neutral-400 hover:border-white hover:text-white'
                    }`}
                  >
                    WORLD 1-{lvl}
                  </button>
                ))}
              </div>
              <div className="text-[8px] text-neutral-400 mt-1.5 font-mono">
                {selectedLevel === 1 && "World 1-1: Grassland hills & pipes"}
                {selectedLevel === 2 && "World 1-2: Cavern lava pits & beetle patrol"}
                {selectedLevel === 3 && "World 1-3: Bowser's castle & bridge"}
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 px-4 retro-btn-red text-xs font-black tracking-wider flex items-center justify-center gap-2 rounded-none cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            START GAME
          </button>
        </div>

        {/* Right Side: Keyboard Bindings & Leaderboard */}
        <div className="flex-1 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-5">
          {/* Controls Panel */}
          <div>
            <h3 className="text-[10px] font-bold uppercase text-yellow-400 flex items-center gap-1.5 mb-2 font-mono">
              <Keyboard className="w-3.5 h-3.5 text-yellow-400" />
              Keyboard Controls
            </h3>
            <ul className="text-[9px] text-neutral-300 space-y-1 bg-neutral-950 p-2.5 border-2 border-neutral-800 font-mono">
              <li className="flex justify-between">
                <span>◀ ▶ / A D</span>
                <span className="font-bold text-yellow-400">Run</span>
              </li>
              <li className="flex justify-between">
                <span>SPACE / W</span>
                <span className="font-bold text-yellow-400">Jump</span>
              </li>
              <li className="flex justify-between">
                <span>SHIFT / X</span>
                <span className="font-bold text-yellow-400">Fireball</span>
              </li>
              <li className="flex justify-between">
                <span>▼ / S</span>
                <span className="font-bold text-yellow-400">Crouch</span>
              </li>
              <li className="flex justify-between">
                <span>ESC / P</span>
                <span className="font-bold text-yellow-400">Pause</span>
              </li>
            </ul>
          </div>

          {/* Leaderboard */}
          <div>
            <h3 className="text-[10px] font-bold uppercase text-yellow-400 flex items-center gap-1.5 mb-2 font-mono">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              High Scores
            </h3>
            <div className="bg-neutral-950 border-2 border-neutral-800 overflow-hidden divide-y divide-neutral-800">
              {highScores.length === 0 ? (
                <div className="p-2 text-center text-[9px] text-neutral-500 italic font-mono">
                  No scores logged
                </div>
              ) : (
                highScores.slice(0, 3).map((scoreObj, idx) => (
                  <div key={idx} className="p-1.5 flex justify-between items-center text-[9px] font-mono">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-neutral-500">#{idx + 1}</span>
                      <span className="font-black text-white">{scoreObj.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] text-yellow-400">x{scoreObj.coins} 🪙</span>
                      <span className="font-black text-yellow-400">{scoreObj.score}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Floor ground blocks */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-[#92451c] border-t-4 border-black" />
    </div>
  );
};
