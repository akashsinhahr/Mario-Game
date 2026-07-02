/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { PauseMenu } from './components/PauseMenu';
import { GameOver } from './components/GameOver';
import { LevelComplete } from './components/LevelComplete';
import { MobileControls } from './components/MobileControls';
import { audio } from './audio';
import { levels } from './levels';

type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'complete';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [levelId, setLevelId] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(400);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Simulated keyboard state for mobile touchscreen inputs
  const [simulatedKeys, setSimulatedKeys] = useState<{ [key: string]: boolean }>({});

  const currentLevelConfig = levels.find((l) => l.id === levelId) || levels[0];

  // Initialize and check mute preferences from localStorage if any
  useEffect(() => {
    const savedMute = localStorage.getItem('mario_muted') === 'true';
    setIsMuted(savedMute);
    if (savedMute) {
      audio.toggleMute();
    }
  }, []);

  const handleStartGame = (selectedLevel: number) => {
    setLevelId(selectedLevel);
    setScore(0);
    setCoins(0);
    setLives(3);
    setGameState('playing');
  };

  const handleToggleMute = () => {
    const newMuted = audio.toggleMute();
    setIsMuted(newMuted);
    localStorage.setItem('mario_muted', newMuted ? 'true' : 'false');
  };

  const handlePauseToggle = () => {
    if (gameState === 'playing') {
      setGameState('paused');
      audio.stopMusic();
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  };

  const handleLevelCompleted = (finalScore: number, finalCoins: number, remainingTime: number) => {
    setScore(finalScore);
    setCoins(finalCoins);
    setTimeLeft(remainingTime);
    setGameState('complete');
  };

  const handleGameOver = (finalScore: number, finalCoins: number) => {
    setScore(finalScore);
    setCoins(finalCoins);
    setGameState('gameover');
  };

  const handleNextLevel = () => {
    const nextLvl = levelId + 1;
    if (levels.some((l) => l.id === nextLvl)) {
      setLevelId(nextLvl);
      setGameState('playing');
    } else {
      // Finished all levels! Return to main menu
      setGameState('menu');
    }
  };

  const handleRestartLevel = () => {
    setGameState('playing');
  };

  const handleGoHome = () => {
    setGameState('menu');
    audio.stopMusic();
  };

  const handleStatsChange = (newScore: number, newCoins: number, newLives: number, newTimeLeft: number) => {
    setScore(newScore);
    setCoins(newCoins);
    setLives(newLives);
    setTimeLeft(newTimeLeft);
  };

  // Virtual mobile button trigger callback
  const handleMobileButtonPress = (key: string, isPressed: boolean) => {
    setSimulatedKeys((prev) => ({
      ...prev,
      [key]: isPressed,
    }));
  };

  // Determine if flower state is active to show Fire button on mobile controls
  // (we'll keep B button visible if they are powered-up or just always show for running speed!)
  const canShootFireball = true;

  return (
    <div className="min-h-screen bg-[#5c94fc] flex flex-col items-center justify-center font-sans antialiased relative selection:bg-red-500 selection:text-white overflow-x-hidden py-6 md:py-10">
      {/* Decorative cloud particles or stars in the background if any */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Game Screen Board resembling an authentic Arcade Cabinet monitor */}
      <main className="relative bg-black w-full max-w-4xl border-8 border-neutral-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] rounded-none p-1 overflow-hidden flex flex-col items-center justify-center">
        {gameState === 'menu' && (
          <MainMenu onStartGame={handleStartGame} />
        )}

        {(gameState === 'playing' || gameState === 'paused') && (
          <div className="relative w-full">
            {/* Heads-up display HUD overlay */}
            <HUD
              score={score}
              coins={coins}
              lives={lives}
              levelName={currentLevelConfig.name}
              timeLeft={timeLeft}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onPause={handlePauseToggle}
            />

            {/* Main Interactive HTML5 Canvas Game Frame */}
            <GameCanvas
              levelId={levelId}
              isPaused={gameState === 'paused'}
              externalKeys={simulatedKeys}
              onLevelComplete={handleLevelCompleted}
              onGameOver={handleGameOver}
              onPause={handlePauseToggle}
              onStatsChange={handleStatsChange}
            />

            {/* Virtual D-pad / Action controls for touch-screen players */}
            <MobileControls
              onPress={handleMobileButtonPress}
              canShoot={canShootFireball}
            />

            {/* Pause Menu Dialog Overlay */}
            {gameState === 'paused' && (
              <PauseMenu
                levelName={currentLevelConfig.name}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                onResume={handlePauseToggle}
                onRestart={handleRestartLevel}
                onGoHome={handleGoHome}
              />
            )}
          </div>
        )}

        {gameState === 'gameover' && (
          <GameOver
            score={score}
            coins={coins}
            levelName={currentLevelConfig.name}
            onRestart={handleRestartLevel}
            onGoHome={handleGoHome}
          />
        )}

        {gameState === 'complete' && (
          <LevelComplete
            levelId={levelId}
            levelName={currentLevelConfig.name}
            score={score}
            coins={coins}
            timeLeft={timeLeft}
            onNextLevel={handleNextLevel}
            onRestartLevel={handleRestartLevel}
            onGoHome={handleGoHome}
          />
        )}
      </main>

      {/* Footer Branding info */}
      <footer className="mt-6 text-center text-[11px] text-neutral-500 font-mono tracking-wider">
        SUPER PIXEL MARIO PLATFORMER &copy; 2026 &bull; BUILT WITH REACT &amp; HTML5 CANVAS
      </footer>
    </div>
  );
}
