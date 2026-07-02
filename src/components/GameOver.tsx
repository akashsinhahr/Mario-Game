/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RotateCcw, Home, Award } from 'lucide-react';
import { HighScore } from '../types';
import { audio } from '../audio';

interface GameOverProps {
  score: number;
  coins: number;
  levelName: string;
  onRestart: () => void;
  onGoHome: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  score,
  coins,
  levelName,
  onRestart,
  onGoHome,
}) => {
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('mario_player_name') || 'MARIO';
  });
  const [scoreSubmitted, setScoreSubmitted] = useState<boolean>(false);
  const [isHighScore, setIsHighScore] = useState<boolean>(false);

  useEffect(() => {
    audio.playDeath();

    // Check if score is a high score
    const scoresStr = localStorage.getItem('mario_high_scores');
    if (scoresStr) {
      try {
        const scores: HighScore[] = JSON.parse(scoresStr);
        // Eligible if scores count < 5 or score beats the lowest score in list
        if (scores.length < 5 || score > scores[scores.length - 1].score) {
          setIsHighScore(true);
        }
      } catch (e) {
        setIsHighScore(true);
      }
    } else {
      setIsHighScore(true);
    }
  }, [score]);

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const scoresStr = localStorage.getItem('mario_high_scores');
    let scores: HighScore[] = [];
    if (scoresStr) {
      try {
        scores = JSON.parse(scoresStr);
      } catch (err) {
        scores = [];
      }
    }

    const newScore: HighScore = {
      name: playerName.toUpperCase().substring(0, 10),
      score,
      coins,
      date: new Date().toISOString().split('T')[0],
    };

    scores.push(newScore);
    // Sort descending
    scores.sort((a, b) => b.score - a.score);
    // Keep top 5
    scores = scores.slice(0, 5);

    localStorage.setItem('mario_high_scores', JSON.stringify(scores));
    localStorage.setItem('mario_player_name', playerName.toUpperCase());
    setScoreSubmitted(true);
    audio.playCoin();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] w-full bg-[#5c94fc] p-6 font-sans text-white select-none relative overflow-hidden">
      {/* Decorative retro clouds in background */}
      <div className="absolute top-10 left-[10%] w-24 h-10 bg-white border-4 border-black shadow-[4px_4px_0px_#000] pointer-events-none opacity-80" />
      <div className="absolute top-24 right-[15%] w-32 h-12 bg-white border-4 border-black shadow-[4px_4px_0px_#000] pointer-events-none opacity-80" />

      <div className="max-w-md w-full border-4 border-white rounded-none bg-black p-6 shadow-[8px_8px_0px_#000000] relative">
        <div className="text-center mb-6">
          <div className="text-red-500 font-bold tracking-widest text-[8px] uppercase mb-2 font-mono">
            MISHAP IN THE MUSHROOM KINGDOM
          </div>
          <h1 className="text-xl md:text-2xl font-black text-red-600 tracking-tight uppercase retro-text-shadow-red animate-bounce">
            GAME OVER
          </h1>
          <p className="text-[9px] text-neutral-400 mt-2 font-mono">
            {levelName}
          </p>
        </div>

        {/* Statistics Board */}
        <div className="bg-neutral-950 border-2 border-neutral-800 p-4 rounded-none mb-6 space-y-3.5 font-mono">
          <div className="flex justify-between items-center text-[10px] border-b border-neutral-800 pb-2">
            <span className="text-neutral-400 uppercase">FINAL SCORE:</span>
            <span className="text-sm font-black text-red-500">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-neutral-400 uppercase">COINS:</span>
            <span className="font-bold text-yellow-400 flex items-center gap-1">
              🪙 x{coins}
            </span>
          </div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-neutral-400 uppercase">RANK:</span>
            <span className="font-bold text-sky-400">
              {score > 10000 ? 'SUPER PLUMBER' : score > 5000 ? 'GOOMBA SQUISHER' : 'GREENHORN'}
            </span>
          </div>
        </div>

        {/* High Score Submission Panel */}
        {isHighScore && !scoreSubmitted ? (
          <form onSubmit={handleSubmitScore} className="bg-neutral-950 border-2 border-yellow-500 p-3 mb-6 rounded-none">
            <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-[8px] uppercase mb-2 font-mono">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              NEW HIGH SCORE!
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                maxLength={10}
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                placeholder="YOUR NAME"
                className="w-full px-2 py-1.5 bg-black border-2 border-white text-[10px] text-white font-mono uppercase focus:outline-none rounded-none"
              />
              <button
                type="submit"
                className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold text-[9px] uppercase rounded-none transition cursor-pointer border-2 border-white shadow-[2px_2px_0px_#000]"
              >
                SUBMIT SCORE
              </button>
            </div>
          </form>
        ) : scoreSubmitted ? (
          <div className="bg-neutral-950 border-2 border-emerald-500 p-3 rounded-none text-center text-[9px] font-bold text-emerald-400 mb-6 font-mono">
            🎉 SCORE LOGGED TO RANKINGS!
          </div>
        ) : null}

        {/* Navigation Actions */}
        <div className="space-y-3">
          <button
            onClick={() => {
              audio.playCoin();
              onRestart();
            }}
            className="w-full py-3 px-4 retro-btn-red text-[11px] font-bold tracking-wide flex items-center justify-center gap-2 rounded-none cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            TRY AGAIN
          </button>

          <button
            onClick={() => {
              audio.playJump();
              onGoHome();
            }}
            className="w-full py-2.5 px-4 retro-btn-dark text-[11px] font-bold tracking-wide flex items-center justify-center gap-2 rounded-none cursor-pointer"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
