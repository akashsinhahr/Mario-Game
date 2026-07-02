/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw, Award, Sparkles, Home } from 'lucide-react';
import { audio } from '../audio';

interface LevelCompleteProps {
  levelId: number;
  levelName: string;
  score: number;
  coins: number;
  timeLeft: number;
  onNextLevel: () => void;
  onRestartLevel: () => void;
  onGoHome: () => void;
}

export const LevelComplete: React.FC<LevelCompleteProps> = ({
  levelId,
  levelName,
  score,
  coins,
  timeLeft,
  onNextLevel,
  onRestartLevel,
  onGoHome,
}) => {
  const [timeBonus, setTimeBonus] = useState<number>(0);
  const [finalCalculatedScore, setFinalCalculatedScore] = useState<number>(score);
  const [countingDone, setCountingDone] = useState<boolean>(false);

  useEffect(() => {
    audio.playStageClear();

    // Fun animated count-up for the remaining time bonus
    if (timeLeft > 0) {
      let currentTick = 0;
      const step = Math.max(1, Math.floor(timeLeft / 20));
      const interval = setInterval(() => {
        currentTick += step;
        if (currentTick >= timeLeft) {
          currentTick = timeLeft;
          clearInterval(interval);
          setCountingDone(true);
        }
        const bonus = currentTick * 10;
        setTimeBonus(bonus);
        setFinalCalculatedScore(score + bonus);
      }, 50);

      return () => clearInterval(interval);
    } else {
      setCountingDone(true);
    }
  }, [timeLeft, score]);

  const isFinalLevel = levelId === 3;

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] w-full bg-[#5c94fc] p-6 font-sans text-white select-none relative overflow-hidden">
      {/* Decorative retro clouds in background */}
      <div className="absolute top-10 left-[10%] w-24 h-10 bg-white border-4 border-black shadow-[4px_4px_0px_#000] pointer-events-none opacity-80" />
      <div className="absolute top-24 right-[15%] w-32 h-12 bg-white border-4 border-black shadow-[4px_4px_0px_#000] pointer-events-none opacity-80" />

      <div className="max-w-md w-full border-4 border-white rounded-none bg-black p-6 shadow-[8px_8px_0px_#000000] relative">
        <div className="text-center mb-6">
          <div className="flex justify-center gap-1.5 mb-2 text-yellow-400">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <Sparkles className="w-4 h-4 animate-bounce" />
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <h1 className="text-xl md:text-2xl font-black text-yellow-400 tracking-tight uppercase retro-text-shadow-yellow">
            STAGE CLEAR!
          </h1>
          <p className="text-[9px] text-emerald-400 font-mono font-bold uppercase mt-2">
            {levelName} COMPLETED!
          </p>
        </div>

        {/* Victory Message or Princess Peach Peach-Rescue Story */}
        {isFinalLevel ? (
          <div className="bg-[#fff3f3] text-black border-4 border-red-500 p-4 rounded-none mb-6 text-center shadow-inner font-mono text-[9px] leading-relaxed">
            <p className="text-[10px] font-black uppercase mb-1 text-red-600">👑 RESCUED QUEEN PEACH 👑</p>
            <p className="font-bold italic">
              "Thank you Mario! You defeated Bowser, collapsed his bridge, and rescued me! Our adventure is a complete success!"
            </p>
          </div>
        ) : (
          <div className="bg-neutral-950 border-2 border-neutral-800 p-4 rounded-none mb-6 space-y-3 font-mono text-[10px]">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 uppercase">STAGE SCORE:</span>
              <span className="font-bold text-neutral-200">{score.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 uppercase">REMAINING TIME:</span>
              <span className="font-bold text-sky-400">{timeLeft} SEC</span>
            </div>
            <div className="flex justify-between items-center text-yellow-400 font-bold border-b border-neutral-800 pb-2 text-[9px]">
              <span className="uppercase">TIME BONUS (x10):</span>
              <span>+{timeBonus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-neutral-300 font-bold uppercase">TOTAL SCORE:</span>
              <span className="text-sm font-black text-yellow-400">{finalCalculatedScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-1 text-[9px]">
              <span className="text-neutral-400 uppercase">TOTAL COINS:</span>
              <span className="font-bold text-amber-500">🪙 x{coins}</span>
            </div>
          </div>
        )}

        {/* Navigation Action Area */}
        <div className="space-y-3">
          {!isFinalLevel ? (
            <button
              onClick={() => {
                audio.playCoin();
                onNextLevel();
              }}
              className="w-full py-3.5 px-4 retro-btn-yellow text-xs font-black tracking-wider flex items-center justify-center gap-2 rounded-none cursor-pointer"
            >
              <span>NEXT STAGE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-2 text-center text-[9px] font-bold text-yellow-300 uppercase animate-pulse border-2 border-yellow-500 rounded-none mb-3 font-mono">
              🏆 CHAMPION OF THE MUSHROOM WORLD!
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                audio.playJump();
                onRestartLevel();
              }}
              className="py-2.5 px-4 retro-btn-dark text-[9px] font-bold tracking-wide flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              REPLAY
            </button>

            <button
              onClick={() => {
                audio.playCoin();
                onGoHome();
              }}
              className="py-2.5 px-4 retro-btn-dark text-[9px] font-bold tracking-wide flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
