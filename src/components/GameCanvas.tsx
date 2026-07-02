/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Player, Enemy, Block, PowerUp, Fireball, Particle, FloatingScore, LevelConfig, BlockType, BlockItem, PowerUpType } from '../types';
import { levels } from '../levels';
import { audio } from '../audio';

interface GameCanvasProps {
  levelId: number;
  onLevelComplete: (score: number, coins: number, timeLeft: number) => void;
  onGameOver: (score: number, coins: number) => void;
  onPause: () => void;
  onStatsChange: (score: number, coins: number, lives: number, timeLeft: number) => void;
  isPaused: boolean;
  externalKeys: { [key: string]: boolean };
}

const BLOCK_SIZE = 40; // 40px per grid block
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;
const GRAVITY = 0.5;
const TERMINAL_VELOCITY = 12;

// Piranha Plant emerge/retract cycle (in frames, ~60fps)
const PIRANHA_RETRACT_HOLD = 90;
const PIRANHA_RISE = 35;
const PIRANHA_EXTEND_HOLD = 70;
const PIRANHA_RETREAT = 35;
const PIRANHA_CYCLE_TOTAL = PIRANHA_RETRACT_HOLD + PIRANHA_RISE + PIRANHA_EXTEND_HOLD + PIRANHA_RETREAT;

// Returns 0 (fully hidden in pipe) to 1 (fully extended) for a given cycle timer value
const getPiranhaPop = (timer: number): number => {
  const t = timer % PIRANHA_CYCLE_TOTAL;
  if (t < PIRANHA_RETRACT_HOLD) return 0;
  if (t < PIRANHA_RETRACT_HOLD + PIRANHA_RISE) {
    return (t - PIRANHA_RETRACT_HOLD) / PIRANHA_RISE;
  }
  if (t < PIRANHA_RETRACT_HOLD + PIRANHA_RISE + PIRANHA_EXTEND_HOLD) return 1;
  const retreatT = t - (PIRANHA_RETRACT_HOLD + PIRANHA_RISE + PIRANHA_EXTEND_HOLD);
  return 1 - retreatT / PIRANHA_RETREAT;
};

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelId,
  onLevelComplete,
  onGameOver,
  onPause,
  onStatsChange,
  isPaused,
  externalKeys,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentLevelConfig = levels.find((l) => l.id === levelId) || levels[0];

  // Game Stats States (shared with parent for HUD or triggers)
  const [coinsCount, setCoinsCount] = useState<number>(0);
  const [scoreCount, setScoreCount] = useState<number>(0);
  const [livesCount, setLivesCount] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(400);

  // References to keep game loop state consistent without React trigger delays
  const stateRef = useRef<{
    player: Player;
    blocks: Block[];
    enemies: Enemy[];
    powerups: PowerUp[];
    fireballs: Fireball[];
    particles: Particle[];
    floatingScores: FloatingScore[];
    cameraX: number;
    timeLeft: number;
    gameEnded: boolean;
    levelId: number;
    isPaused: boolean;
    bridgeCollapseProgress: number; // for Level 3 castle axe bridge collapsing
    bridgeCollapseActive: boolean;
    bowserDefeated: boolean;
    bowserX: number;
    bowserY: number;
    bowserVx: number;
    bowserVy: number;
    bowserHp: number;
    bowserFacing: 'left' | 'right';
    bowserFireballs: { x: number; y: number; vx: number; vy: number; id: string }[];
    bowserJumpTimer: number;
    screenShakeTimer: number;
  }>({
    player: {
      x: BLOCK_SIZE * currentLevelConfig.startX,
      y: BLOCK_SIZE * currentLevelConfig.startY,
      vx: 0,
      vy: 0,
      width: 28,
      height: 38,
      state: 'small',
      isDead: false,
      isInvincible: false,
      invincibleTimer: 0,
      isFlashing: false,
      flashTimer: 0,
      isGrounded: false,
      facing: 'right',
      crouching: false,
      slidingOnFlagpole: false,
      flagpoleSlideX: 0,
      victoryWalk: false,
      score: 0,
      coins: 0,
      lives: 3,
    },
    blocks: [],
    enemies: [],
    powerups: [],
    fireballs: [],
    particles: [],
    floatingScores: [],
    cameraX: 0,
    timeLeft: 400,
    gameEnded: false,
    levelId: levelId,
    isPaused: isPaused,
    // Bowser battle states
    bridgeCollapseProgress: 0,
    bridgeCollapseActive: false,
    bowserDefeated: false,
    bowserX: 144 * BLOCK_SIZE, // positioned on the bridge in level 3
    bowserY: 10 * BLOCK_SIZE,
    bowserVx: -1,
    bowserVy: 0,
    bowserHp: 5,
    bowserFacing: 'left',
    bowserFireballs: [],
    bowserJumpTimer: 0,
    screenShakeTimer: 0,
  });

  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Synchronize paused state
  useEffect(() => {
    stateRef.current.isPaused = isPaused;
    if (!isPaused && !stateRef.current.gameEnded) {
      // Play level music when resuming
      playThemeMusic();
    } else {
      audio.stopMusic();
    }
  }, [isPaused]);

  // Synchronize level transitions
  useEffect(() => {
    initLevel();
  }, [levelId]);

  // Handle external keyboard/touch states (virtual controls)
  useEffect(() => {
    Object.keys(externalKeys).forEach((key) => {
      keysPressedRef.current[key] = externalKeys[key];
    });
  }, [externalKeys]);

  // Mirror live gameplay stats up to the parent so the HUD reflects real-time score/coins/lives/time
  useEffect(() => {
    onStatsChange(scoreCount, coinsCount, livesCount, timeLeft);
  }, [scoreCount, coinsCount, livesCount, timeLeft]);

  const playThemeMusic = () => {
    if (stateRef.current.player.isInvincible) {
      audio.startMusic('invincible');
    } else if (currentLevelConfig.theme === 'underworld') {
      audio.startMusic('underworld');
    } else if (currentLevelConfig.theme === 'castle') {
      audio.startMusic('castle');
    } else {
      audio.startMusic('overworld');
    }
  };

  const initLevel = () => {
    const config = levels.find((l) => l.id === levelId) || levels[0];
    audio.stopMusic();
    audio.init();

    // Rebuild block list from static configuration
    const mappedBlocks: Block[] = [];
    
    // Add default ground first
    for (let col = 0; col < config.width; col++) {
      // Create holes/gaps in grassland or lava pits in caverns
      const isLavaArea = config.theme === 'underworld' && config.blocks.some(b => b.gridX === col && b.type === 'lava');
      const isCastleLava = config.theme === 'castle' && config.blocks.some(b => b.gridX === col && b.type === 'lava');
      
      // Level 1 pits
      const isGap1 = config.id === 1 && ((col >= 60 && col <= 63) || (col >= 86 && col <= 88) || (col >= 110 && col <= 114));

      if (!isGap1 && !isLavaArea && !isCastleLava) {
        // Standard floor blocks
        mappedBlocks.push({
          id: `ground-${col}-13`,
          x: col * BLOCK_SIZE,
          y: 13 * BLOCK_SIZE,
          gridX: col,
          gridY: 13,
          type: config.theme === 'castle' ? 'castle-brick' : 'ground',
          contains: 'none',
          hitsLeft: 0,
          isHitAnimated: false,
          hitOffset: 0,
        });
        mappedBlocks.push({
          id: `ground-${col}-14`,
          x: col * BLOCK_SIZE,
          y: 14 * BLOCK_SIZE,
          gridX: col,
          gridY: 14,
          type: config.theme === 'castle' ? 'castle-brick' : 'ground',
          contains: 'none',
          hitsLeft: 0,
          isHitAnimated: false,
          hitOffset: 0,
        });
      }
    }

    // Add configuration block layout
    config.blocks.forEach((b, index) => {
      // Remove any overlapping ground block to place custom block
      const overlapIdx = mappedBlocks.findIndex((mb) => mb.gridX === b.gridX && mb.gridY === b.gridY);
      if (overlapIdx !== -1) {
        mappedBlocks.splice(overlapIdx, 1);
      }

      mappedBlocks.push({
        id: `block-${b.gridX}-${b.gridY}-${index}`,
        x: b.gridX * BLOCK_SIZE,
        y: b.gridY * BLOCK_SIZE,
        gridX: b.gridX,
        gridY: b.gridY,
        type: b.type,
        contains: b.contains || 'none',
        hitsLeft: b.type === 'question' ? 1 : b.type === 'brick' && b.contains !== 'none' ? 5 : 0, // bricks can be hit multiple times if they hold coins
        isHitAnimated: false,
        hitOffset: 0,
      });
    });

    // Populate enemies
    const mappedEnemies: Enemy[] = config.enemies.map((e, index) => ({
      id: `enemy-${e.gridX}-${index}`,
      x: e.gridX * BLOCK_SIZE,
      y: 12 * BLOCK_SIZE - 5, // place on floor
      vx: -1.2,
      vy: 0,
      width: 32,
      height: 32,
      type: e.type,
      state: 'walk',
      facing: 'left',
      deadTimer: 0,
      grounded: true,
      spawnX: e.gridX * BLOCK_SIZE,
      spawnY: 12 * BLOCK_SIZE - 5,
    }));

    // Populate Piranha Plants lurking inside tagged pipes
    const piranhaWidth = 30;
    const piranhaHeight = 38;
    (config.piranhaPipes || []).forEach((p, index) => {
      const pipeTopY = p.gridY * BLOCK_SIZE;
      mappedEnemies.push({
        id: `piranha-${p.gridX}-${p.gridY}`,
        x: p.gridX * BLOCK_SIZE + (BLOCK_SIZE * 2 - piranhaWidth) / 2,
        y: pipeTopY,
        vx: 0,
        vy: 0,
        width: piranhaWidth,
        height: piranhaHeight,
        type: 'piranha',
        state: 'walk',
        facing: 'left',
        deadTimer: index * 77, // stagger cycles so plants don't all pop in sync
        grounded: true,
        spawnX: p.gridX * BLOCK_SIZE,
        spawnY: pipeTopY,
      });
    });

    // Reset player state but keep coins, score, lives
    const prevPlayer = stateRef.current.player;
    const freshPlayer: Player = {
      x: BLOCK_SIZE * config.startX,
      y: BLOCK_SIZE * config.startY,
      vx: 0,
      vy: 0,
      width: 28,
      height: 34, // Small by default unless super/fire is carried over
      state: prevPlayer.state,
      isDead: false,
      isInvincible: false,
      invincibleTimer: 0,
      isFlashing: false,
      flashTimer: 0,
      isGrounded: false,
      facing: 'right',
      crouching: false,
      slidingOnFlagpole: false,
      flagpoleSlideX: 0,
      victoryWalk: false,
      score: prevPlayer.score,
      coins: prevPlayer.coins,
      lives: prevPlayer.lives,
    };

    // Adjust height if super/fire state is kept
    if (freshPlayer.state !== 'small') {
      freshPlayer.height = 46;
    }

    stateRef.current = {
      player: freshPlayer,
      blocks: mappedBlocks,
      enemies: mappedEnemies,
      powerups: [],
      fireballs: [],
      particles: [],
      floatingScores: [],
      cameraX: 0,
      timeLeft: 400,
      gameEnded: false,
      levelId: levelId,
      isPaused: isPaused,
      // Bowser Castle battle states
      bridgeCollapseProgress: 0,
      bridgeCollapseActive: false,
      bowserDefeated: false,
      bowserX: 145 * BLOCK_SIZE,
      bowserY: 9 * BLOCK_SIZE,
      bowserVx: -1,
      bowserVy: 0,
      bowserHp: 5,
      bowserFacing: 'left',
      bowserFireballs: [],
      bowserJumpTimer: 0,
      screenShakeTimer: 0,
    };

    setCoinsCount(freshPlayer.coins);
    setScoreCount(freshPlayer.score);
    setLivesCount(freshPlayer.lives);
    setTimeLeft(400);

    // Play stage music
    playThemeMusic();
  };

  // Trigger high score updates
  const handlePlayerDeath = () => {
    const p = stateRef.current.player;
    p.lives--;
    setLivesCount(p.lives);

    if (p.lives <= 0) {
      stateRef.current.gameEnded = true;
      audio.stopMusic();
      onGameOver(p.score, p.coins);
    } else {
      // Reload level with lost life
      setTimeout(() => {
        initLevel();
      }, 2500);
    }
  };

  // Keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressedRef.current[e.code] = true;

      // Ignore OS key-repeat events for discrete actions (prevents pause flicker on held keys)
      if (!e.repeat) {
        // Handle pause trigger via ESC or P
        if (e.key === 'p' || e.key === 'P' || e.code === 'Escape') {
          onPause();
        }

        // Action Shoot fireball via Shift / X
        if (e.code === 'ShiftLeft' || e.code === 'KeyX' || e.code === 'KeyF') {
          shootFireball();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [levelId]);

  // Main game ticks
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let secondTimer = 0;

    const gameLoop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      if (!stateRef.current.isPaused && !stateRef.current.gameEnded) {
        // Game clock ticks down
        secondTimer += dt;
        if (secondTimer >= 1000) {
          secondTimer = 0;
          if (stateRef.current.timeLeft > 0 && !stateRef.current.player.victoryWalk) {
            stateRef.current.timeLeft--;
            setTimeLeft(stateRef.current.timeLeft);
            if (stateRef.current.timeLeft <= 0) {
              killPlayer();
            }
          }
        }

        updatePhysics();
        resolveCollisions();
        updateBowser(dt); // Boss battle updates for Castle
      }

      renderCanvas();
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [levelId, isPaused]);

  // --- Fireball triggers ---
  const shootFireball = () => {
    const { player, fireballs } = stateRef.current;
    if (player.state !== 'fire' || player.isDead || player.slidingOnFlagpole || player.victoryWalk) return;
    if (fireballs.length >= 2) return; // Limit 2 fireballs active

    audio.playFireball();

    const fx = player.facing === 'right' ? player.x + player.width : player.x - 8;
    const fy = player.y + player.height / 3;
    const fvx = player.facing === 'right' ? 6 : -6;

    fireballs.push({
      id: `fireball-${Date.now()}-${Math.random()}`,
      x: fx,
      y: fy,
      vx: fvx,
      vy: 2, // starts with slight bounce
      bounces: 0,
    });
  };

  // --- Power-Up spawning ---
  const spawnPowerUp = (gridX: number, gridY: number, item: BlockItem) => {
    if (item === 'none') return;
    
    // Play custom retro sound
    audio.playPowerUpSpawn();

    const pX = gridX * BLOCK_SIZE;
    const pY = gridY * BLOCK_SIZE;

    if (item === 'coin') {
      // Coins just fly out, increment score/count and vanish
      const { player } = stateRef.current;
      player.coins++;
      player.score += 200;
      setCoinsCount(player.coins);
      setScoreCount(player.score);
      audio.playCoin();

      // Coin spin visual effect
      stateRef.current.particles.push({
        id: `coin-spin-${Date.now()}`,
        x: pX + BLOCK_SIZE / 2,
        y: pY - 10,
        vx: 0,
        vy: -5,
        color: '#fbbf24',
        size: 8,
        life: 0,
        maxLife: 30,
        rotation: 0,
        rotationSpeed: 0.2,
      });

      // Floating +200 text
      stateRef.current.floatingScores.push({
        id: `score-${Date.now()}`,
        x: pX + 8,
        y: pY - 12,
        text: '200',
        life: 40,
      });
      return;
    }

    // Spawn walking items: Mushroom, Flower, Star
    const pType = item as PowerUpType;
    stateRef.current.powerups.push({
      id: `powerup-${Date.now()}-${Math.random()}`,
      x: pX,
      y: pY,
      vx: pType === 'flower' ? 0 : 1.5, // Flower remains stationary
      vy: 0,
      width: 32,
      height: 32,
      type: pType,
      state: 'spawning',
      spawnProgress: 0,
    });
  };

  // --- Core Game Physics Update ---
  const updatePhysics = () => {
    const { player, enemies, powerups, fireballs, particles, floatingScores, cameraX } = stateRef.current;

    if (player.isDead) {
      player.vy += 0.35; // slower death gravity
      player.y += player.vy;
      // Fade/fall out of sight
      return;
    }

    // 1. Particle life cycles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life++;
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.25; // gravity for bits
      pt.rotation += pt.rotationSpeed;
      if (pt.life >= pt.maxLife) {
        particles.splice(i, 1);
      }
    }

    // 2. Floating text life cycles
    for (let i = floatingScores.length - 1; i >= 0; i--) {
      const fs = floatingScores[i];
      fs.life--;
      fs.y -= 0.6; // rise slowly
      if (fs.life <= 0) {
        floatingScores.splice(i, 1);
      }
    }

    // 3. Invincibility or flashing countdowns
    if (player.isInvincible) {
      player.invincibleTimer--;
      if (player.invincibleTimer <= 0) {
        player.isInvincible = false;
        // Restore standard level music
        playThemeMusic();
      }
    }
    if (player.isFlashing) {
      player.flashTimer--;
      if (player.flashTimer <= 0) {
        player.isFlashing = false;
      }
    }

    // 4. Special Flagpole Slide Sequence
    if (player.slidingOnFlagpole) {
      player.vy = 2; // steady slide down
      player.y += player.vy;

      // Bottom out check
      const groundFloorY = 13 * BLOCK_SIZE;
      if (player.y + player.height >= groundFloorY) {
        player.y = groundFloorY - player.height;
        player.slidingOnFlagpole = false;
        player.victoryWalk = true;
        player.vx = 2; // start walking to the castle!
      }
      return;
    }

    // 5. Victory Walk to Castle Door
    if (player.victoryWalk) {
      player.vx = 2;
      player.vy += GRAVITY;
      player.y += player.vy;

      // Prevent falling below ground floor during walk
      const floorY = 13 * BLOCK_SIZE;
      if (player.y + player.height >= floorY) {
        player.y = floorY - player.height;
        player.vy = 0;
        player.isGrounded = true;
      }

      player.x += player.vx;

      // Check if inside Castle Door
      const castleDoorBlock = stateRef.current.blocks.find(b => b.type === 'castle-door');
      if (castleDoorBlock && player.x >= castleDoorBlock.x + 10) {
        // Complete stage!
        stateRef.current.gameEnded = true;
        audio.stopMusic();
        onLevelComplete(player.score, player.coins, stateRef.current.timeLeft);
      }
      return;
    }

    // 6. Normal Player Inputs & Motion
    const keys = keysPressedRef.current;
    
    // Crouch
    player.crouching = (keys['ArrowDown'] || keys['KeyS']) && player.isGrounded && player.state !== 'small';
    
    // Modify speeds based on state
    const accel = 0.35;
    const maxSpeed = keys['KeyX'] || keys['ShiftLeft'] ? 4.5 : 3.0;
    const friction = 0.85;

    // Horiz accel
    if (keys['ArrowLeft'] || keys['KeyA']) {
      player.vx -= accel;
      player.facing = 'left';
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      player.vx += accel;
      player.facing = 'right';
    } else {
      player.vx *= friction; // Friction slide
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    // Speed limits
    if (player.vx > maxSpeed) player.vx = maxSpeed;
    if (player.vx < -maxSpeed) player.vx = -maxSpeed;

    // Jumping action (A)
    const jumpRequested = keys['Space'] || keys['ArrowUp'] || keys['KeyW'];
    if (jumpRequested) {
      if (player.isGrounded) {
        player.vy = -10.5; // Upward impulse
        player.isGrounded = false;
        audio.playJump();
        // Clear immediate press so player must release to jump again (prevents endless flight)
        keysPressedRef.current['Space'] = false;
        keysPressedRef.current['ArrowUp'] = false;
        keysPressedRef.current['KeyW'] = false;
      }
    }

    // Apply gravity
    player.vy += GRAVITY;
    if (player.vy > TERMINAL_VELOCITY) player.vy = TERMINAL_VELOCITY;

    // Apply motion X/Y independently to resolve tile collisions perfectly
    player.y += player.vy;
    resolvePlayerVerticalCollisions();

    player.x += player.vx;
    resolvePlayerHorizontalCollisions();

    // Prevent scrolling backwards beyond the left boundary (classic NES!)
    if (player.x < cameraX) {
      player.x = cameraX;
      player.vx = 0;
    }

    // Screen death pit boundary
    if (player.y > VIEW_HEIGHT + 20) {
      killPlayer();
    }

    // 7. Power-Up Movement
    for (let i = powerups.length - 1; i >= 0; i--) {
      const pu = powerups[i];
      if (pu.state === 'spawning') {
        pu.spawnProgress += 0.04;
        pu.y -= 40 * 0.04; // grows upward out of block
        if (pu.spawnProgress >= 1.0) {
          pu.state = 'active';
        }
      } else {
        // Gravity & speed
        pu.vy += GRAVITY;
        pu.x += pu.vx;
        resolvePowerUpHorizontalCollisions(pu);
        pu.y += pu.vy;
        resolvePowerUpVerticalCollisions(pu);
      }
    }

    // 8. Fireball Physics
    for (let i = fireballs.length - 1; i >= 0; i--) {
      const fb = fireballs[i];
      fb.vy += GRAVITY;
      fb.x += fb.vx;
      fb.y += fb.vy;

      // Custom bounce on floor & wall collisions
      let hitWall = false;
      let hitFloor = false;

      // Solid blocks check
      const boxSize = 8;
      const fRect = { x: fb.x, y: fb.y, w: boxSize, h: boxSize };

      stateRef.current.blocks.forEach((b) => {
        if (!isSolidBlock(b.type)) return;

        const bRect = { x: b.x, y: b.y, w: BLOCK_SIZE, h: BLOCK_SIZE };
        if (checkOverlap(fRect, bRect)) {
          // Determine side
          const overlapX = Math.min(fRect.x + fRect.w - bRect.x, bRect.x + bRect.w - fRect.x);
          const overlapY = Math.min(fRect.y + fRect.h - bRect.y, bRect.y + bRect.h - fRect.y);

          if (overlapX < overlapY) {
            hitWall = true;
          } else {
            // floor bounce
            if (fb.vy > 0) {
              fb.y -= overlapY;
              fb.vy = -5.5; // bounce up!
              fb.bounces++;
            } else {
              fb.vy = 1;
            }
          }
        }
      });

      // Remove out of bounds or after many bounces
      if (hitWall || fb.bounces > 4 || fb.x < cameraX || fb.x > cameraX + VIEW_WIDTH || fb.y > VIEW_HEIGHT) {
        // Explode into sparkles
        for (let k = 0; k < 5; k++) {
          particles.push({
            id: `spark-${Date.now()}-${Math.random()}`,
            x: fb.x,
            y: fb.y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            color: '#f97316',
            size: 3,
            life: 0,
            maxLife: 15,
            rotation: 0,
            rotationSpeed: 0,
          });
        }
        fireballs.splice(i, 1);
        continue;
      }

      // Check collision with enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        const en = enemies[j];
        if (en.state === 'dead' || en.state === 'flat') continue;
        if (en.type === 'piranha' && getPiranhaPop(en.deadTimer) < 0.2) continue; // hidden in pipe, can't be hit

        const enRect = { x: en.x, y: en.y, w: en.width, h: en.height };
        if (checkOverlap(fRect, enRect)) {
          // Beetle is immune to fireballs!
          if (en.type === 'beetle') {
            audio.playStomp(); // high tick noise
            // Reverse fireball direction
            fb.vx = -fb.vx;
            continue;
          }

          // Damage/Kill enemy!
          defeatEnemyFlyAway(en);
          fireballs.splice(i, 1);
          break;
        }
      }
    }

    // 9. Enemy Patrol AI & Motion
    for (let i = enemies.length - 1; i >= 0; i--) {
      const en = enemies[i];

      if (en.state === 'dead') {
        // Fly away physics (like when shot by fire or hit by invincible star)
        en.vy += 0.35;
        en.x += en.vx;
        en.y += en.vy;
        if (en.y > VIEW_HEIGHT + 40) {
          enemies.splice(i, 1);
        }
        continue;
      }

      if (en.state === 'flat') {
        en.deadTimer--;
        if (en.deadTimer <= 0) {
          enemies.splice(i, 1);
        }
        continue;
      }

      if (en.type === 'piranha') {
        // Lurks in its pipe, periodically rising up to bite then retracting
        en.deadTimer = (en.deadTimer + 1) % PIRANHA_CYCLE_TOTAL;
        const pop = getPiranhaPop(en.deadTimer);
        en.y = en.spawnY - en.height * pop;
        continue;
      }

      // Normal walking patrol
      en.vy += GRAVITY;
      en.x += en.vx;
      resolveEnemyHorizontalCollisions(en);
      en.y += en.vy;
      resolveEnemyVerticalCollisions(en);

      // reverse velocity on edge checks to make sure they don't fall off small platforms if underground
      if (currentLevelConfig.theme !== 'overworld' && en.grounded) {
        const checkLeftX = en.x;
        const checkRightX = en.x + en.width;
        const checkY = en.y + en.height + 5;

        let hasBlockBelowLeft = false;
        let hasBlockBelowRight = false;

        stateRef.current.blocks.forEach((b) => {
          if (!isSolidBlock(b.type)) return;
          if (checkLeftX >= b.x && checkLeftX <= b.x + BLOCK_SIZE && checkY >= b.y && checkY <= b.y + BLOCK_SIZE) hasBlockBelowLeft = true;
          if (checkRightX >= b.x && checkRightX <= b.x + BLOCK_SIZE && checkY >= b.y && checkY <= b.y + BLOCK_SIZE) hasBlockBelowRight = true;
        });

        if (!hasBlockBelowLeft && en.vx < 0) {
          en.vx = Math.abs(en.vx);
          en.facing = 'right';
        } else if (!hasBlockBelowRight && en.vx > 0) {
          en.vx = -Math.abs(en.vx);
          en.facing = 'left';
        }
      }
    }

    // 10. Update Camera to scroll and center smoothly
    const rightThreshold = cameraX + VIEW_WIDTH * 0.45;
    if (player.x > rightThreshold) {
      stateRef.current.cameraX = player.x - VIEW_WIDTH * 0.45;
      // Cap camera at the right edge of level
      const maxCamX = currentLevelConfig.width * BLOCK_SIZE - VIEW_WIDTH;
      if (stateRef.current.cameraX > maxCamX) {
        stateRef.current.cameraX = maxCamX;
      }
    }
  };

  // --- Boss Bowser logic for Level 3 Castle ---
  const updateBowser = (dt: number) => {
    if (levelId !== 3) return;

    const { player, particles } = stateRef.current;
    let bState = stateRef.current;

    if (bState.bowserDefeated) {
      bState.bowserVy += 0.35; // fall into lava
      bState.bowserY += bState.bowserVy;
      bState.bowserX += bState.bowserVx;
      return;
    }

    // 1. Bowser Movement AI: hop and pacing
    bState.bowserVy += 0.3; // castle lighter boss gravity
    bState.bowserX += bState.bowserVx;
    bState.bowserY += bState.bowserVy;

    // Keep Bowser restricted to bridge (columns 138 to 152)
    const bridgeMin = 139 * BLOCK_SIZE;
    const bridgeMax = 151 * BLOCK_SIZE;
    
    // Resolve basic floor colls
    const bFloorY = 12 * BLOCK_SIZE - 28; // Bowser height is 60px
    if (bState.bowserY >= bFloorY) {
      bState.bowserY = bFloorY;
      bState.bowserVy = 0;
    }

    if (bState.bowserX <= bridgeMin) {
      bState.bowserX = bridgeMin;
      bState.bowserVx = 0.8;
      bState.bowserFacing = 'right';
    } else if (bState.bowserX >= bridgeMax) {
      bState.bowserX = bridgeMax;
      bState.bowserVx = -0.8;
      bState.bowserFacing = 'left';
    }

    // Periodic jumps
    bState.bowserJumpTimer += dt;
    if (bState.bowserJumpTimer > 2500) {
      bState.bowserJumpTimer = 0;
      if (bState.bowserY === bFloorY) {
        bState.bowserVy = -6.5; // jump up
      }
      
      // Randomly shoot flame breath!
      if (Math.random() < 0.7 && bState.bowserFireballs.length < 3) {
        audio.playFireball();
        bState.bowserFireballs.push({
          id: `bflame-${Date.now()}-${Math.random()}`,
          x: bState.bowserX - 10,
          y: bState.bowserY + 15,
          vx: -3.5,
          vy: (Math.random() - 0.5) * 1.5, // slight vertical curve
        });
      }
    }

    // Move Bowser Fireballs
    for (let i = bState.bowserFireballs.length - 1; i >= 0; i--) {
      const bf = bState.bowserFireballs[i];
      bf.x += bf.vx;
      bf.y += bf.vy;

      // Damage player collision
      if (!player.isDead && !player.isFlashing) {
        const plRect = { x: player.x, y: player.y, w: player.width, h: player.height };
        const bfRect = { x: bf.x, y: bf.y, w: 24, h: 16 };
        if (checkOverlap(plRect, bfRect)) {
          damagePlayer();
        }
      }

      // Remove out of camera bounds
      if (bf.x < bState.cameraX - 100 || bf.x > bState.cameraX + VIEW_WIDTH + 100) {
        bState.bowserFireballs.splice(i, 1);
      }
    }

    // Player fireballs hitting bowser
    const bRect = { x: bState.bowserX, y: bState.bowserY, w: 56, h: 60 };
    bState.fireballs.forEach((fb, idx) => {
      const fbRect = { x: fb.x, y: fb.y, w: 8, h: 8 };
      if (checkOverlap(fbRect, bRect)) {
        bState.bowserHp--;
        bState.fireballs.splice(idx, 1);
        audio.playStomp();

        // flash effect
        for (let k = 0; k < 10; k++) {
          particles.push({
            id: `bspark-${Date.now()}-${Math.random()}`,
            x: bState.bowserX + 28,
            y: bState.bowserY + 30,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#ef4444',
            size: 4,
            life: 0,
            maxLife: 20,
            rotation: 0,
            rotationSpeed: 0,
          });
        }

        if (bState.bowserHp <= 0) {
          triggerBowserDefeat();
        }
      }
    });

    // Check direct collision with player
    if (!player.isDead && !player.isFlashing) {
      const plRect = { x: player.x, y: player.y, w: player.width, h: player.height };
      if (checkOverlap(plRect, bRect)) {
        if (player.isInvincible) {
          triggerBowserDefeat();
        } else {
          damagePlayer();
        }
      }
    }

    // --- Bridge collapsing active animation ---
    if (bState.bridgeCollapseActive) {
      bState.bridgeCollapseProgress += dt;
      if (bState.bridgeCollapseProgress > 150) {
        bState.bridgeCollapseProgress = 0;
        
        // Find leftmost solid bridge block and destroy it!
        const bridgeBlocks = bState.blocks.filter(b => b.gridX >= 138 && b.gridX <= 153 && b.type === 'brick');
        if (bridgeBlocks.length > 0) {
          // Find the rightmost block of the bridge to collapse it backward from the axe
          bridgeBlocks.sort((a, b) => b.gridX - a.gridX);
          const target = bridgeBlocks[0];
          
          // shatter block visually
          shatterBrickBlock(target);
          bState.blocks = bState.blocks.filter(b => b.id !== target.id);
          audio.playStomp(); // crunch sound
        } else {
          // No bridge blocks left! Bowser falls into lava!
          bState.bridgeCollapseActive = false;
          bState.bowserDefeated = true;
          bState.bowserVx = 0;
          bState.bowserVy = -2; // slight upward bounce then falls
          audio.playDeath();
          
          // Player starts walking automatically towards Peach
          player.victoryWalk = true;
        }
      }
    }
  };

  const triggerBowserDefeat = () => {
    let bState = stateRef.current;
    if (bState.bowserDefeated) return;
    bState.bowserDefeated = true;
    bState.bowserVx = 1.5;
    bState.bowserVy = -4; // bounce back
    bState.screenShakeTimer = 20;
    audio.playDeath();

    // Trigger walk
    bState.player.victoryWalk = true;
  };

  const triggerCastleAxeCollpse = () => {
    let bState = stateRef.current;
    if (bState.bridgeCollapseActive || bState.bowserDefeated) return;

    audio.playPowerUp();
    
    // Remove Axe Block immediately
    bState.blocks = bState.blocks.filter(b => b.gridX !== 155 || b.gridY !== 11);

    // Trigger bridge collapse sequence!
    bState.bridgeCollapseActive = true;
    bState.bridgeCollapseProgress = 0;
  };

  // --- Player-Environment Collision Resolvers ---
  const resolvePlayerVerticalCollisions = () => {
    const { player, blocks } = stateRef.current;
    const plRect = { x: player.x, y: player.y, w: player.width, h: player.height };

    player.isGrounded = false;

    blocks.forEach((b) => {
      if (!isSolidBlock(b.type)) return;

      const bRect = { x: b.x, y: b.y, w: BLOCK_SIZE, h: BLOCK_SIZE };
      if (checkOverlap(plRect, bRect)) {
        // Collided, resolve vertically
        if (player.vy > 0) {
          // Landing on floor
          player.y = b.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
        } else if (player.vy < 0) {
          // Hitting ceiling block
          player.y = b.y + BLOCK_SIZE;
          player.vy = 0;
          hitBlock(b);
        }
      }
    });
  };

  const resolvePlayerHorizontalCollisions = () => {
    const { player, blocks } = stateRef.current;
    const plRect = { x: player.x, y: player.y, w: player.width, h: player.height };

    blocks.forEach((b) => {
      if (!isSolidBlock(b.type)) return;

      const bRect = { x: b.x, y: b.y, w: BLOCK_SIZE, h: BLOCK_SIZE };
      if (checkOverlap(plRect, bRect)) {
        // Resolve horizontally
        if (player.vx > 0) {
          // Colliding right
          player.x = b.x - player.width;
          player.vx = 0;
        } else if (player.vx < 0) {
          // Colliding left
          player.x = b.x + BLOCK_SIZE;
          player.vx = 0;
        }
      }
    });
  };

  // --- Entity Collisions (Enemies, Powerups, Flagpole) ---
  const resolveCollisions = () => {
    const { player, enemies, powerups, blocks } = stateRef.current;
    if (player.isDead || player.slidingOnFlagpole || player.victoryWalk) return;

    const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };

    // 1. Flagpole/Castle Axe triggers
    if (levelId === 3) {
      // Golden Axe sits at column 155, height 11
      const axeX = 155 * BLOCK_SIZE;
      if (player.x + player.width >= axeX && player.x <= axeX + BLOCK_SIZE) {
        triggerCastleAxeCollpse();
        return;
      }
    } else {
      // Flagpole trigger at world 1-1 / 1-2
      const poleX = currentLevelConfig.flagpoleX * BLOCK_SIZE + 16; // centered
      if (player.x + player.width >= poleX && player.x <= poleX + 8) {
        // Touch flagpole! Start sliding animation
        player.slidingOnFlagpole = true;
        player.flagpoleSlideX = poleX - 10;
        player.x = poleX - 10;
        player.vx = 0;
        player.vy = 2;
        audio.playStageClear();
        return;
      }
    }

    // 2. Power-up collisions
    for (let i = powerups.length - 1; i >= 0; i--) {
      const pu = powerups[i];
      if (pu.state === 'spawning') continue;

      const puRect = { x: pu.x, y: pu.y, w: pu.width, h: pu.height };
      if (checkOverlap(pRect, puRect)) {
        // Collect Powerup!
        audio.playPowerUp();
        applyPowerUp(pu.type);
        
        // Float score indicator +1000
        stateRef.current.floatingScores.push({
          id: `score-${Date.now()}`,
          x: pu.x,
          y: pu.y - 10,
          text: '1000',
          life: 40,
        });
        player.score += 1000;
        setScoreCount(player.score);

        powerups.splice(i, 1);
      }
    }

    // 3. Enemy collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
      const en = enemies[i];
      if (en.state === 'dead' || en.state === 'flat') continue;

      if (en.type === 'piranha') {
        // Can't be stomped - only damages on touch while extended, or defeated by fire/star
        const pop = getPiranhaPop(en.deadTimer);
        if (pop < 0.2) continue; // hidden in pipe, harmless

        const piranhaRect = { x: en.x, y: en.y, w: en.width, h: en.height };
        if (checkOverlap(pRect, piranhaRect)) {
          if (player.isInvincible) {
            defeatEnemyFlyAway(en);
          } else {
            damagePlayer();
          }
        }
        continue;
      }

      const enRect = { x: en.x, y: en.y, w: en.width, h: en.height };
      if (checkOverlap(pRect, enRect)) {
        // If player is falling down on top of enemy
        const isFallingOnTop = player.vy > 0 && player.y + player.height - player.vy <= en.y + 12;

        if (isFallingOnTop) {
          // Bounce player back up
          player.vy = -6.5;
          player.y = en.y - player.height;

          // Enemy interactions
          if (en.type === 'goomba') {
            // Squish flat
            en.state = 'flat';
            en.deadTimer = 40; // show flat frame for 40 ticks
            en.vx = 0;
            audio.playStomp();
            player.score += 100;
            setScoreCount(player.score);
            stateRef.current.floatingScores.push({
              id: `score-${Date.now()}`,
              x: en.x + 4,
              y: en.y - 12,
              text: '100',
              life: 35,
            });
          } else if (en.type === 'koopa' || en.type === 'beetle') {
            if (en.state === 'walk') {
              // Stomp into Shell
              en.state = 'shell';
              en.vx = 0;
              en.width = 32;
              en.height = 24; // smaller shell dimensions
              en.y += 8; // drop slightly
              audio.playStomp();
              player.score += 200;
              setScoreCount(player.score);
            } else if (en.state === 'shell') {
              // Kick shell! Determine kick direction
              const kickRight = player.x + player.width / 2 < en.x + en.width / 2;
              en.state = 'shell-spin';
              en.vx = kickRight ? 6.5 : -6.5;
              audio.playStomp();
            } else if (en.state === 'shell-spin') {
              // Stop spinning shell
              en.state = 'shell';
              en.vx = 0;
              audio.playStomp();
            }
          }
        } else {
          // Player hit enemy sideways
          if (en.state === 'shell') {
            // Kick static shell sideways without taking damage
            const kickRight = player.x + player.width / 2 < en.x + en.width / 2;
            en.state = 'shell-spin';
            en.vx = kickRight ? 6.5 : -6.5;
            audio.playStomp();
            // brief slide away
            player.x += kickRight ? -12 : 12;
          } else {
            // Take damage
            if (player.isInvincible) {
              defeatEnemyFlyAway(en);
            } else {
              damagePlayer();
            }
          }
        }
      }

      // Shells killing other enemies
      if (en.state === 'shell-spin') {
        enemies.forEach((other) => {
          if (other.id === en.id || other.state === 'dead' || other.state === 'flat') return;
          if (other.type === 'piranha' && getPiranhaPop(other.deadTimer) < 0.2) return;

          const otherRect = { x: other.x, y: other.y, w: other.width, h: other.height };
          if (checkOverlap({ x: en.x, y: en.y, w: en.width, h: en.height }, otherRect)) {
            defeatEnemyFlyAway(other);
          }
        });
      }
    }
  };

  const defeatEnemyFlyAway = (en: Enemy) => {
    en.state = 'dead';
    en.vx = (Math.random() - 0.5) * 4;
    en.vy = -6; // launch upward
    audio.playStomp();
    
    // Add point visual
    stateRef.current.player.score += 200;
    setScoreCount(stateRef.current.player.score);
    stateRef.current.floatingScores.push({
      id: `score-${Date.now()}`,
      x: en.x,
      y: en.y - 10,
      text: '200',
      life: 35,
    });
  };

  // --- Handle Block Collisions from Bottom ---
  const hitBlock = (b: Block) => {
    if (b.type === 'ground' || b.type === 'hardblock' || b.type === 'empty-block' || b.type === 'castle-brick') return;

    // Bounce animation trigger
    b.isHitAnimated = true;
    b.hitOffset = -8;

    if (b.type === 'question') {
      // Spawn its item
      spawnPowerUp(b.gridX, b.gridY, b.contains);
      b.type = 'empty-block'; // Spent block
      b.contains = 'none';
      b.hitsLeft = 0;
    } else if (b.type === 'brick') {
      if (b.contains !== 'none') {
        // Held items inside bricks
        spawnPowerUp(b.gridX, b.gridY, b.contains);
        b.hitsLeft--;
        if (b.hitsLeft <= 0) {
          b.type = 'empty-block';
          b.contains = 'none';
        }
      } else {
        // Normal empty bricks shatter if Super Mario hits them, otherwise just bounce
        const { player } = stateRef.current;
        if (player.state !== 'small') {
          // Smash brick!
          audio.playStomp();
          shatterBrickBlock(b);
          // Remove from list
          stateRef.current.blocks = stateRef.current.blocks.filter((mb) => mb.id !== b.id);
        } else {
          audio.playStomp(); // low thud
        }
      }
    }
  };

  const shatterBrickBlock = (b: Block) => {
    const { particles } = stateRef.current;
    // Spawn 4 rotating brown fragments
    const frags = [
      { vx: -2.5, vy: -6 },
      { vx: 2.5, vy: -6 },
      { vx: -1.5, vy: -4 },
      { vx: 1.5, vy: -4 }
    ];

    frags.forEach((fr) => {
      particles.push({
        id: `brick-frag-${Date.now()}-${Math.random()}`,
        x: b.x + BLOCK_SIZE / 2,
        y: b.y + BLOCK_SIZE / 2,
        vx: fr.vx,
        vy: fr.vy,
        color: '#b45309', // brick red-brown
        size: 7,
        life: 0,
        maxLife: 30,
        rotation: 0,
        rotationSpeed: 0.15,
      });
    });
  };

  // --- Player power-up & health handlers ---
  const applyPowerUp = (type: PowerUpType) => {
    const { player } = stateRef.current;
    const wasSmall = player.state === 'small';

    if (type === 'mushroom' && wasSmall) {
      player.state = 'super';
      player.height = 46;
      player.y -= 12; // push up so they don't clip floor
    } else if (type === 'flower') {
      player.state = 'fire';
      player.height = 46;
      if (wasSmall) {
        player.y -= 12; // push up so growing from small doesn't clip floor
      }
    } else if (type === 'star') {
      player.isInvincible = true;
      player.invincibleTimer = 500; // ~10 seconds of glory
      // Trigger invincible music
      audio.startMusic('invincible');
    }
  };

  const damagePlayer = () => {
    const { player } = stateRef.current;
    if (player.isDead || player.isFlashing || player.isInvincible) return;

    stateRef.current.screenShakeTimer = 12;

    if (player.state === 'fire') {
      player.state = 'super';
      player.isFlashing = true;
      player.flashTimer = 100; // invulnerable flash ticks
      audio.playPowerDown();
    } else if (player.state === 'super') {
      player.state = 'small';
      player.height = 34;
      player.isFlashing = true;
      player.flashTimer = 100;
      audio.playPowerDown();
    } else {
      killPlayer();
    }
  };

  const killPlayer = () => {
    const { player } = stateRef.current;
    if (player.isDead) return;

    player.isDead = true;
    player.vx = 0;
    player.vy = -8.5; // fly upwards on death
    audio.playDeath();

    // Trigger full game reload or game-over
    setTimeout(() => {
      handlePlayerDeath();
    }, 2000);
  };

  // --- AABB helpers for Enemies and Power-Ups ---
  const resolvePowerUpVerticalCollisions = (pu: PowerUp) => {
    const { blocks } = stateRef.current;
    const pRect = { x: pu.x, y: pu.y, w: pu.width, h: pu.height };

    blocks.forEach((b) => {
      if (!isSolidBlock(b.type)) return;

      const bRect = { x: b.x, y: b.y, w: BLOCK_SIZE, h: BLOCK_SIZE };
      if (checkOverlap(pRect, bRect)) {
        if (pu.vy > 0) {
          pu.y = b.y - pu.height;
          
          if (pu.type === 'star') {
            pu.vy = -5.5; // Star jumps/hops!
          } else {
            pu.vy = 0;
          }
        } else if (pu.vy < 0) {
          pu.y = b.y + BLOCK_SIZE;
          pu.vy = 0;
        }
      }
    });
  };

  const resolvePowerUpHorizontalCollisions = (pu: PowerUp) => {
    const { blocks } = stateRef.current;
    const pRect = { x: pu.x, y: pu.y, w: pu.width, h: pu.height };

    blocks.forEach((b) => {
      if (!isSolidBlock(b.type)) return;

      const bRect = { x: b.x, y: b.y, w: BLOCK_SIZE, h: BLOCK_SIZE };
      if (checkOverlap(pRect, bRect)) {
        if (pu.vx > 0) {
          pu.x = b.x - pu.width;
          pu.vx = -pu.vx; // reverse
        } else if (pu.vx < 0) {
          pu.x = b.x + BLOCK_SIZE;
          pu.vx = -pu.vx;
        }
      }
    });
  };

  const resolveEnemyVerticalCollisions = (en: Enemy) => {
    const { blocks } = stateRef.current;
    const pRect = { x: en.x, y: en.y, w: en.width, h: en.height };

    en.grounded = false;

    blocks.forEach((b) => {
      if (!isSolidBlock(b.type)) return;

      const bRect = { x: b.x, y: b.y, w: BLOCK_SIZE, h: BLOCK_SIZE };
      if (checkOverlap(pRect, bRect)) {
        if (en.vy > 0) {
          en.y = b.y - en.height;
          en.vy = 0;
          en.grounded = true;
        } else if (en.vy < 0) {
          en.y = b.y + BLOCK_SIZE;
          en.vy = 0;
        }
      }
    });
  };

  const resolveEnemyHorizontalCollisions = (en: Enemy) => {
    const { blocks } = stateRef.current;
    const pRect = { x: en.x, y: en.y, w: en.width, h: en.height };

    blocks.forEach((b) => {
      if (!isSolidBlock(b.type)) return;

      const bRect = { x: b.x, y: b.y, w: BLOCK_SIZE, h: BLOCK_SIZE };
      if (checkOverlap(pRect, bRect)) {
        if (en.vx > 0) {
          en.x = b.x - en.width;
          en.vx = -en.vx;
          en.facing = 'left';
        } else if (en.vx < 0) {
          en.x = b.x + BLOCK_SIZE;
          en.vx = -en.vx;
          en.facing = 'right';
        }
      }
    });
  };

  // --- General Math Collision Helpers ---
  const isSolidBlock = (type: BlockType): boolean => {
    return ['brick', 'ground', 'empty-block', 'hardblock', 'castle-brick', 'pipe-left', 'pipe-right', 'pipe-top-left', 'pipe-top-right'].includes(type);
  };

  const checkOverlap = (
    r1: { x: number; y: number; w: number; h: number },
    r2: { x: number; y: number; w: number; h: number }
  ): boolean => {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  };

  // --- Programmatic Vector Canvas Rendering ---
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset smoothing for absolute crisp retro 8-bit visual style
    ctx.imageSmoothingEnabled = false;

    const { player, blocks, enemies, powerups, fireballs, particles, floatingScores, cameraX } = stateRef.current;

    // Screen shake effect (damage taken, Bowser defeat, etc.)
    let shakeX = 0;
    let shakeY = 0;
    if (stateRef.current.screenShakeTimer > 0) {
      const intensity = Math.min(6, stateRef.current.screenShakeTimer);
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
      stateRef.current.screenShakeTimer--;
    }
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Draw background Sky / Cave / Castle
    ctx.fillStyle = currentLevelConfig.backgroundColor;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Level themes decorations
    if (currentLevelConfig.theme === 'overworld') {
      // Draw scenic background hills & green landscape details
      ctx.fillStyle = '#4fa128';
      // Low wavy backdrop hills
      for (let i = 0; i < 4; i++) {
        const hillX = (i * 450) - (cameraX * 0.2) % 450;
        ctx.beginPath();
        ctx.arc(hillX + 100, 520, 140, 0, Math.PI, true);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hillX + 240, 520, 180, 0, Math.PI, true);
        ctx.fill();
      }
    } else if (currentLevelConfig.theme === 'underworld') {
      // draw cavern rocky stalactites in ceiling
      ctx.fillStyle = '#221133';
      for (let i = 0; i < 15; i++) {
        const rockX = (i * 90) - (cameraX * 0.4) % 90;
        ctx.beginPath();
        ctx.moveTo(rockX, 80);
        ctx.lineTo(rockX + 45, 140);
        ctx.lineTo(rockX + 90, 80);
        ctx.fill();
      }
    } else if (currentLevelConfig.theme === 'castle') {
      // Draw red glowing furnace background walls
      ctx.fillStyle = '#260000';
      ctx.fillRect(0, 500, VIEW_WIDTH, 100);
      
      // Draw decorative pillars in background
      ctx.fillStyle = '#1c1c1c';
      for (let i = 0; i < 8; i++) {
        const pillarX = (i * 180) - (cameraX * 0.1) % 180;
        ctx.fillRect(pillarX, 80, 24, 440);
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(pillarX + 4, 80, 4, 440);
        ctx.fillStyle = '#1c1c1c';
      }
    }

    // Save and apply scrolling translation
    ctx.save();
    ctx.translate(-cameraX, 0);

    // 1. Draw Static / Dynamic block tile map
    blocks.forEach((b) => {
      // Skip rendering if block is completely off screen
      if (b.x < cameraX - BLOCK_SIZE || b.x > cameraX + VIEW_WIDTH + BLOCK_SIZE) return;

      // Handle bouncing block hit animation
      let blockYOffset = 0;
      if (b.isHitAnimated) {
        b.hitOffset += 1;
        blockYOffset = b.hitOffset;
        if (b.hitOffset >= 0) {
          b.isHitAnimated = false;
          b.hitOffset = 0;
        }
      }

      const drawY = b.y + blockYOffset;

      if (b.type === 'ground') {
        // Draw dirt block with lush green grass top
        ctx.fillStyle = '#b45309'; // dirt brown
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.fillStyle = '#15803d'; // grass green
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, 8);
        ctx.fillStyle = '#22c55e'; // light grass border
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, 2);
        
        // organic dots inside dirt
        ctx.fillStyle = '#78350f';
        ctx.fillRect(b.x + 8, drawY + 16, 4, 4);
        ctx.fillRect(b.x + 24, drawY + 24, 4, 4);
      } else if (b.type === 'brick') {
        // Red Brick
        ctx.fillStyle = '#b45309';
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        // lines
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        // bricks division lines
        ctx.beginPath();
        ctx.moveTo(b.x, drawY + 13);
        ctx.lineTo(b.x + BLOCK_SIZE, drawY + 13);
        ctx.moveTo(b.x, drawY + 26);
        ctx.lineTo(b.x + BLOCK_SIZE, drawY + 26);
        // vertical splits
        ctx.moveTo(b.x + 13, drawY);
        ctx.lineTo(b.x + 13, drawY + 13);
        ctx.moveTo(b.x + 26, drawY + 13);
        ctx.lineTo(b.x + 26, drawY + 26);
        ctx.moveTo(b.x + 13, drawY + 26);
        ctx.lineTo(b.x + 13, drawY + BLOCK_SIZE);
        ctx.stroke();
      } else if (b.type === 'question') {
        // Yellow flashing question block
        const flashColors = ['#f59e0b', '#fbbf24', '#fcd34d'];
        const frame = Math.floor(Date.now() / 150) % 3;
        ctx.fillStyle = flashColors[frame];
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        
        // draw bold central "?"
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', b.x + BLOCK_SIZE / 2, drawY + BLOCK_SIZE / 2);
        
        // rivets in corner
        ctx.fillStyle = '#78350f';
        ctx.fillRect(b.x + 2, drawY + 2, 2, 2);
        ctx.fillRect(b.x + BLOCK_SIZE - 4, drawY + 2, 2, 2);
        ctx.fillRect(b.x + 2, drawY + BLOCK_SIZE - 4, 2, 2);
        ctx.fillRect(b.x + BLOCK_SIZE - 4, drawY + BLOCK_SIZE - 4, 2, 2);
      } else if (b.type === 'empty-block') {
        // Spent spent solid brown block
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        // tiny screws in corners
        ctx.fillStyle = '#451a03';
        ctx.fillRect(b.x + 3, drawY + 3, 3, 3);
        ctx.fillRect(b.x + BLOCK_SIZE - 6, drawY + 3, 3, 3);
        ctx.fillRect(b.x + 3, drawY + BLOCK_SIZE - 6, 3, 3);
        ctx.fillRect(b.x + BLOCK_SIZE - 6, drawY + BLOCK_SIZE - 6, 3, 3);
      } else if (b.type === 'hardblock') {
        // Grey hard block
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        // interior shadow line
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x + 4, drawY + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
      } else if (b.type === 'castle-brick') {
        // Dark brick for castle levels
        ctx.fillStyle = '#374151';
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        // texture
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(b.x + 4, drawY + 6, 32, 4);
        ctx.fillRect(b.x + 4, drawY + 22, 32, 4);
      } else if (b.type === 'castle-door') {
        // Dark door for victory walk
        ctx.fillStyle = '#111827';
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
      } else if (b.type.startsWith('pipe-')) {
        // Green Pipes
        ctx.fillStyle = '#15803d'; // Forest green
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        
        // Shadow gradients on side to look round
        ctx.fillStyle = '#166534';
        ctx.fillRect(b.x + 24, drawY, 16, BLOCK_SIZE);
        ctx.fillStyle = '#22c55e'; // Highlight
        ctx.fillRect(b.x + 4, drawY, 4, BLOCK_SIZE);

        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 2.5;

        if (b.type === 'pipe-top-left') {
          ctx.beginPath();
          ctx.moveTo(b.x, drawY);
          ctx.lineTo(b.x + BLOCK_SIZE, drawY);
          ctx.moveTo(b.x, drawY);
          ctx.lineTo(b.x, drawY + BLOCK_SIZE);
          ctx.stroke();
        } else if (b.type === 'pipe-top-right') {
          ctx.beginPath();
          ctx.moveTo(b.x + BLOCK_SIZE, drawY);
          ctx.lineTo(b.x, drawY);
          ctx.moveTo(b.x + BLOCK_SIZE, drawY);
          ctx.lineTo(b.x + BLOCK_SIZE, drawY + BLOCK_SIZE);
          ctx.stroke();
        } else if (b.type === 'pipe-left') {
          ctx.beginPath();
          ctx.moveTo(b.x, drawY);
          ctx.lineTo(b.x, drawY + BLOCK_SIZE);
          ctx.stroke();
        } else if (b.type === 'pipe-right') {
          ctx.beginPath();
          ctx.moveTo(b.x + BLOCK_SIZE, drawY);
          ctx.lineTo(b.x + BLOCK_SIZE, drawY + BLOCK_SIZE);
          ctx.stroke();
        }
      } else if (b.type === 'lava') {
        // Hot glowing lava
        const tick = Math.floor(Date.now() / 150) % 2;
        ctx.fillStyle = tick === 0 ? '#ef4444' : '#f97316';
        ctx.fillRect(b.x, drawY, BLOCK_SIZE, BLOCK_SIZE);
        
        // Bubbles on top
        ctx.fillStyle = '#facc15';
        ctx.fillRect(b.x + 8 + tick * 4, drawY + 4, 6, 4);
        ctx.fillRect(b.x + 24 - tick * 4, drawY + 8, 4, 4);
      } else if (b.type === 'cloud') {
        // Fluffy cloud
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x + 20, drawY + 20, 20, 0, Math.PI * 2);
        ctx.arc(b.x + 8, drawY + 24, 14, 0, Math.PI * 2);
        ctx.arc(b.x + 32, drawY + 24, 14, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'bush') {
        // Green leafy bush
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(b.x + 20, drawY + 20, 18, 0, Math.PI * 2);
        ctx.arc(b.x + 8, drawY + 24, 12, 0, Math.PI * 2);
        ctx.arc(b.x + 32, drawY + 24, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d'; // leafy shadow
        ctx.beginPath();
        ctx.arc(b.x + 20, drawY + 26, 12, 0, Math.PI);
        ctx.fill();
      }
    });

    // 2. Draw Flagpole (at world end)
    if (currentLevelConfig.id !== 3) {
      const fpX = currentLevelConfig.flagpoleX * BLOCK_SIZE + 16;
      const baseBlockY = 12 * BLOCK_SIZE;
      
      // Pole shaft (green stick with golden ball top)
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(fpX + 3, 2 * BLOCK_SIZE, 4, baseBlockY - 2 * BLOCK_SIZE);
      
      // Gold top knob
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(fpX + 5, 2 * BLOCK_SIZE - 4, 8, 0, Math.PI * 2);
      ctx.fill();

      // Sliding Flag (Green skull logo or emblem)
      let flagY = 2 * BLOCK_SIZE + 10;
      if (player.slidingOnFlagpole) {
        // Flag slides down dynamically ahead of player
        flagY = player.y - 20;
        if (flagY < 2 * BLOCK_SIZE + 10) flagY = 2 * BLOCK_SIZE + 10;
        if (flagY > baseBlockY - 40) flagY = baseBlockY - 40;
      } else if (player.victoryWalk) {
        // fully bottomed out
        flagY = baseBlockY - 40;
      }

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.fillRect(fpX - 28, flagY, 28, 20);
      ctx.strokeRect(fpX - 28, flagY, 28, 20);
      // skull emblem inside flag
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(fpX - 20, flagY + 6, 8, 8);
    } else {
      // Draw Bowser's Golden Axe in level 3 Castle
      // If bridge is NOT collapsing, draw it at its coordinates
      const hasAxe = blocks.some(b => b.gridX === 155 && b.gridY === 11);
      if (hasAxe) {
        const axeX = 155 * BLOCK_SIZE + 8;
        const axeY = 11 * BLOCK_SIZE + 4;
        
        ctx.fillStyle = '#fbbf24'; // Gold
        ctx.beginPath();
        // double blades
        ctx.arc(axeX + 12, axeY + 14, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.fillRect(axeX + 10, axeY, 4, 32); // Handle
      }
    }

    // 3. Draw Powerups
    powerups.forEach((pu) => {
      if (pu.type === 'mushroom') {
        // Red mushroom
        ctx.fillStyle = '#f87171'; // red cap
        ctx.beginPath();
        ctx.arc(pu.x + 16, pu.y + 16, 16, Math.PI, 0);
        ctx.fill();
        // white spots
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pu.x + 6, pu.y + 6, 5, 5);
        ctx.fillRect(pu.x + 22, pu.y + 6, 5, 5);
        ctx.fillRect(pu.x + 14, pu.y + 11, 4, 4);
        
        // mushroom stem
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(pu.x + 8, pu.y + 16, 16, 16);
        // tiny black eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(pu.x + 11, pu.y + 19, 2, 6);
        ctx.fillRect(pu.x + 19, pu.y + 19, 2, 6);
      } else if (pu.type === 'flower') {
        // Fire flower
        const tick = Math.floor(Date.now() / 100) % 3;
        const colors = ['#f43f5e', '#fbbf24', '#38bdf8'];
        ctx.fillStyle = colors[tick];
        ctx.beginPath();
        ctx.arc(pu.x + 16, pu.y + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff'; // white core
        ctx.beginPath();
        ctx.arc(pu.x + 16, pu.y + 12, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b'; // golden center
        ctx.beginPath();
        ctx.arc(pu.x + 16, pu.y + 12, 4, 0, Math.PI * 2);
        ctx.fill();

        // green stem
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(pu.x + 14, pu.y + 20, 4, 12);
        ctx.fillRect(pu.x + 8, pu.y + 22, 16, 3);
      } else if (pu.type === 'star') {
        // Starman
        const flashColors = ['#facc15', '#ef4444', '#3b82f6', '#22c55e'];
        const starColor = flashColors[Math.floor(Date.now() / 80) % 4];
        ctx.fillStyle = starColor;
        
        ctx.beginPath();
        // 5-point star path
        ctx.moveTo(pu.x + 16, pu.y + 2);
        ctx.lineTo(pu.x + 20, pu.y + 12);
        ctx.lineTo(pu.x + 31, pu.y + 12);
        ctx.lineTo(pu.x + 22, pu.y + 19);
        ctx.lineTo(pu.x + 26, pu.y + 30);
        ctx.lineTo(pu.x + 16, pu.y + 23);
        ctx.lineTo(pu.x + 6, pu.y + 30);
        ctx.lineTo(pu.x + 10, pu.y + 19);
        ctx.lineTo(pu.x + 1, pu.y + 12);
        ctx.lineTo(pu.x + 12, pu.y + 12);
        ctx.closePath();
        ctx.fill();

        // star eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(pu.x + 12, pu.y + 13, 2, 4);
        ctx.fillRect(pu.x + 18, pu.y + 13, 2, 4);
      }
    });

    // 4. Draw Enemies
    enemies.forEach((en) => {
      if (en.x < cameraX - BLOCK_SIZE || en.x > cameraX + VIEW_WIDTH + BLOCK_SIZE) return;

      const walkingAnim = Math.floor(Date.now() / 150) % 2;

      if (en.type === 'goomba') {
        if (en.state === 'flat') {
          // Squished brown sheet goomba
          ctx.fillStyle = '#92400e';
          ctx.fillRect(en.x, en.y + 16, en.width, 16);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(en.x + 4, en.y + 16, en.width - 8, 6);
          // squished eyes
          ctx.fillStyle = '#000000';
          ctx.fillRect(en.x + 6, en.y + 22, 6, 2);
          ctx.fillRect(en.x + 20, en.y + 22, 6, 2);
        } else {
          // Normal Goomba mushroom body
          ctx.fillStyle = '#f59e0b'; // face tan
          ctx.beginPath();
          ctx.arc(en.x + 16, en.y + 20, 12, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#92400e'; // dark brown cap
          ctx.beginPath();
          ctx.arc(en.x + 16, en.y + 14, 16, Math.PI, 0);
          ctx.fill();

          // Angry eyebrows
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(en.x + 6, en.y + 11);
          ctx.lineTo(en.x + 13, en.y + 14);
          ctx.moveTo(en.x + 26, en.y + 11);
          ctx.lineTo(en.x + 19, en.y + 14);
          ctx.stroke();

          // Black eyes
          ctx.fillStyle = '#000000';
          ctx.fillRect(en.x + 9, en.y + 15, 2.5, 6);
          ctx.fillRect(en.x + 20, en.y + 15, 2.5, 6);

          // Waddling feet
          ctx.fillStyle = '#451a03';
          if (walkingAnim === 0) {
            ctx.fillRect(en.x + 2, en.y + 26, 10, 6);
            ctx.fillRect(en.x + 18, en.y + 28, 10, 4);
          } else {
            ctx.fillRect(en.x + 4, en.y + 28, 10, 4);
            ctx.fillRect(en.x + 20, en.y + 26, 10, 6);
          }
        }
      } else if (en.type === 'koopa') {
        if (en.state === 'shell' || en.state === 'shell-spin') {
          // Green shell
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(en.x + 16, en.y + 12, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(en.x + 6, en.y + 4, 20, 16);
          ctx.fillStyle = '#fef08a'; // yellow lining
          ctx.fillRect(en.x + 4, en.y + 20, 24, 4);
        } else {
          // Walking Koopa Turtle
          const facingRight = en.vx > 0;
          ctx.fillStyle = '#facc15'; // Yellow body
          
          // Head
          const headX = facingRight ? en.x + 20 : en.x + 4;
          ctx.beginPath();
          ctx.arc(headX, en.y + 8, 6, 0, Math.PI * 2);
          ctx.fill();
          // Eye
          ctx.fillStyle = '#000000';
          ctx.fillRect(facingRight ? headX + 1 : headX - 3, en.y + 6, 2, 4);

          // Green shell
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(en.x + 16, en.y + 20, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Waddling feet
          ctx.fillStyle = '#fbbf24';
          if (walkingAnim === 0) {
            ctx.fillRect(en.x + 6, en.y + 28, 6, 5);
            ctx.fillRect(en.x + 20, en.y + 29, 6, 4);
          } else {
            ctx.fillRect(en.x + 6, en.y + 29, 6, 4);
            ctx.fillRect(en.x + 20, en.y + 28, 6, 5);
          }
        }
      } else if (en.type === 'piranha') {
        // Clip rendering so the plant only shows above the pipe opening
        const baseY = en.spawnY;
        ctx.save();
        ctx.beginPath();
        ctx.rect(en.x - 10, 0, en.width + 20, baseY);
        ctx.clip();

        // Spotted green stalk
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(en.x + en.width / 2 - 5, en.y + 16, 10, en.height);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(en.x + en.width / 2 - 5, en.y + 24, 3, 6);

        // Red head
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(en.x + en.width / 2, en.y + 12, 14, 0, Math.PI * 2);
        ctx.fill();

        // White spots on head
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(en.x + en.width / 2 - 9, en.y + 4, 4, 4);
        ctx.fillRect(en.x + en.width / 2 + 5, en.y + 8, 4, 4);

        // Menacing teeth
        ctx.fillRect(en.x + en.width / 2 - 8, en.y + 17, 4, 5);
        ctx.fillRect(en.x + en.width / 2 + 4, en.y + 17, 4, 5);

        // Angry eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(en.x + en.width / 2 - 6, en.y + 6, 3, 3);
        ctx.fillRect(en.x + en.width / 2 + 3, en.y + 6, 3, 3);

        ctx.restore();
      } else if (en.type === 'beetle') {
        // Dark blue beetle shell (immune to fireballs!)
        if (en.state === 'shell' || en.state === 'shell-spin') {
          ctx.fillStyle = '#1e3a8a'; // Deep blue
          ctx.beginPath();
          ctx.arc(en.x + 16, en.y + 12, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(en.x + 10, en.y + 6, 4, 4); // shine
        } else {
          ctx.fillStyle = '#1d4ed8'; // Bright blue shell
          ctx.beginPath();
          ctx.arc(en.x + 16, en.y + 16, 14, Math.PI, 0);
          ctx.fill();
          // stripes on beetle shell
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(en.x + 8, en.y + 6, 16, 2);
          ctx.fillRect(en.x + 4, en.y + 11, 24, 2);

          // yellow low face peaking out
          ctx.fillStyle = '#fbbf24';
          const headX = en.vx > 0 ? en.x + 24 : en.x + 4;
          ctx.fillRect(headX, en.y + 18, 4, 4);

          // crawling legs
          ctx.fillStyle = '#111827';
          if (walkingAnim === 0) {
            ctx.fillRect(en.x + 6, en.y + 24, 6, 4);
            ctx.fillRect(en.x + 20, en.y + 25, 6, 3);
          } else {
            ctx.fillRect(en.x + 6, en.y + 25, 6, 3);
            ctx.fillRect(en.x + 20, en.y + 24, 6, 4);
          }
        }
      }
    });

    // 5. Draw Fireballs
    fireballs.forEach((fb) => {
      // Rotating orange fire ball
      const rTick = (Date.now() / 40) % 4;
      ctx.fillStyle = '#f97316'; // orange
      ctx.beginPath();
      ctx.arc(fb.x + 4, fb.y + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a'; // yellow core
      ctx.beginPath();
      ctx.arc(fb.x + 4, fb.y + 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Draw Bowser (if level 3)
    if (levelId === 3) {
      let bState = stateRef.current;
      const bowserFrame = Math.floor(Date.now() / 200) % 2;

      // Skip render if off screen
      if (bState.bowserX >= cameraX - 100 && bState.bowserX <= cameraX + VIEW_WIDTH + 100) {
        // Draw green spike shell
        ctx.fillStyle = '#15803d';
        ctx.fillRect(bState.bowserX + 16, bState.bowserY + 12, 34, 42);
        // Spikes on shell
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bState.bowserX + 22, bState.bowserY + 18, 4, 4);
        ctx.fillRect(bState.bowserX + 38, bState.bowserY + 22, 4, 4);
        ctx.fillRect(bState.bowserX + 30, bState.bowserY + 34, 4, 4);

        // Huge orange face & yellow horns
        ctx.fillStyle = '#fbbf24'; // orange skin
        const faceX = bState.bowserFacing === 'left' ? bState.bowserX + 2 : bState.bowserX + 44;
        ctx.fillRect(faceX, bState.bowserY + 14, 14, 28);
        
        // Horns
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(faceX + 4, bState.bowserY + 6, 4, 8);

        // Angry red hair
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bState.bowserX + 18, bState.bowserY + 2, 20, 10);

        // Clawed boots
        ctx.fillStyle = '#d97706';
        if (bowserFrame === 0) {
          ctx.fillRect(bState.bowserX + 12, bState.bowserY + 52, 12, 8);
          ctx.fillRect(bState.bowserX + 36, bState.bowserY + 54, 12, 6);
        } else {
          ctx.fillRect(bState.bowserX + 12, bState.bowserY + 54, 12, 6);
          ctx.fillRect(bState.bowserX + 36, bState.bowserY + 52, 12, 8);
        }

        // Draw Bowser Fireballs
        bState.bowserFireballs.forEach((bf) => {
          ctx.fillStyle = '#ef4444'; // Red hot flame
          ctx.fillRect(bf.x, bf.y, 24, 12);
          ctx.fillStyle = '#f97316'; // orange glow
          ctx.fillRect(bf.x + 4, bf.y + 2, 16, 8);
          ctx.fillStyle = '#fbbf24'; // yellow core
          ctx.fillRect(bf.x + 10, bf.y + 4, 8, 4);
        });
      }
    }

    // 7. Draw Player (Super Pixel Mario)
    if (!player.isFlashing || Math.floor(Date.now() / 40) % 2 === 0) {
      ctx.save();

      // Horizontal flipping based on direction
      const pCenterX = player.x + player.width / 2;
      const pCenterY = player.y + player.height / 2;

      ctx.translate(pCenterX, pCenterY);
      if (player.facing === 'left') {
        ctx.scale(-1, 1);
      }

      // Draw relative to transformed center
      const dX = -player.width / 2;
      const dY = -player.height / 2;

      // Invincible star colors
      let overallsColor = '#b91c1c'; // Red
      let shirtColor = '#d97706';    // Brown-orange
      let skinColor = '#fed7aa';     // Tan skin

      if (player.isInvincible) {
        const starThemes = [
          { over: '#fbbf24', sh: '#3b82f6' }, // Gold / Blue
          { over: '#ef4444', sh: '#10b981' }, // Red / Green
          { over: '#a855f7', sh: '#f43f5e' }, // Pink / Cyan
          { over: '#06b6d4', sh: '#facc15' }  // Cyan / Yellow
        ];
        const colorIdx = Math.floor(Date.now() / 60) % 4;
        overallsColor = starThemes[colorIdx].over;
        shirtColor = starThemes[colorIdx].sh;
      } else if (player.state === 'fire') {
        overallsColor = '#dc2626'; // Bright Red
        shirtColor = '#ffffff';    // White shirt!
      } else if (player.state === 'super') {
        overallsColor = '#1d4ed8'; // Classic Blue overalls
        shirtColor = '#dc2626';    // Red shirt
      } else {
        // small
        overallsColor = '#b91c1c'; // Red overalls
        shirtColor = '#d97706';    // Brown shirt
      }

      if (player.isDead) {
        overallsColor = '#374151'; // greyed out death overalls
        shirtColor = '#111827';
      }

      if (player.state === 'small') {
        // --- Render Small Mario (34px tall) ---
        // Brown boots
        ctx.fillStyle = '#451a03';
        ctx.fillRect(dX + 2, dY + 28, 8, 6);
        ctx.fillRect(dX + 16, dY + 28, 8, 6);

        // Overalls
        ctx.fillStyle = overallsColor;
        ctx.fillRect(dX + 6, dY + 16, 14, 12);
        // shoulders straps
        ctx.fillRect(dX + 4, dY + 14, 4, 6);
        ctx.fillRect(dX + 18, dY + 14, 4, 6);

        // Sleeves/Shirt
        ctx.fillStyle = shirtColor;
        // running arms animation
        const isRunning = Math.abs(player.vx) > 0.2 && player.isGrounded;
        const armsAnim = isRunning ? Math.floor(Date.now() / 100) % 2 : 0;
        
        if (armsAnim === 0) {
          ctx.fillRect(dX + 2, dY + 14, 4, 8);
          ctx.fillRect(dX + 20, dY + 14, 4, 8);
        } else {
          ctx.fillRect(dX + 2, dY + 10, 4, 8);
          ctx.fillRect(dX + 20, dY + 18, 4, 8);
        }

        // Face & moustache
        ctx.fillStyle = skinColor;
        ctx.fillRect(dX + 6, dY + 4, 14, 10);
        // nose
        ctx.fillRect(dX + 18, dY + 6, 4, 4);
        
        // mustache
        ctx.fillStyle = '#451a03';
        ctx.fillRect(dX + 14, dY + 10, 6, 2);
        // eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(dX + 14, dY + 6, 2, 4);

        // Cap
        ctx.fillStyle = shirtColor; // red/white cap
        ctx.fillRect(dX + 4, dY, 14, 4);
        ctx.fillRect(dX + 6, dY - 2, 10, 2); // rounded cap top
        ctx.fillRect(dX + 16, dY + 2, 4, 2);  // visor
      } else {
        // --- Render Super/Fire Mario (46px tall) ---
        // Crouching shortens height visually
        let renderHeightOffset = 0;
        if (player.crouching) {
          renderHeightOffset = 12;
        }

        // Boots
        ctx.fillStyle = '#451a03';
        ctx.fillRect(dX + 3, dY + 38 + renderHeightOffset, 9, 8);
        ctx.fillRect(dX + 16, dY + 38 + renderHeightOffset, 9, 8);

        // Overalls
        ctx.fillStyle = overallsColor;
        ctx.fillRect(dX + 6, dY + 22 + renderHeightOffset, 16, 16);
        ctx.fillRect(dX + 4, dY + 20 + renderHeightOffset, 4, 10);
        ctx.fillRect(dX + 20, dY + 20 + renderHeightOffset, 4, 10);

        // Sleeves
        ctx.fillStyle = shirtColor;
        const isRunning = Math.abs(player.vx) > 0.2 && player.isGrounded;
        const armsAnim = isRunning ? Math.floor(Date.now() / 100) % 2 : 0;
        
        if (armsAnim === 0) {
          ctx.fillRect(dX, dY + 18, 5, 14);
          ctx.fillRect(dX + 23, dY + 18, 5, 14);
        } else {
          ctx.fillRect(dX, dY + 12, 5, 14);
          ctx.fillRect(dX + 23, dY + 22, 5, 14);
        }

        // Face & Head
        ctx.fillStyle = skinColor;
        ctx.fillRect(dX + 6, dY + 6, 16, 14);
        ctx.fillRect(dX + 20, dY + 9, 5, 5); // nose

        // Hair/Mustache
        ctx.fillStyle = '#451a03';
        ctx.fillRect(dX + 16, dY + 14, 8, 3); // Mustache
        ctx.fillRect(dX + 4, dY + 8, 4, 10);  // Back hair

        // Eye
        ctx.fillStyle = '#000000';
        ctx.fillRect(dX + 16, dY + 8, 3, 5);

        // Cap
        ctx.fillStyle = shirtColor;
        ctx.fillRect(dX + 4, dY + 2, 18, 5);
        ctx.fillRect(dX + 6, dY - 1, 14, 3);
        ctx.fillRect(dX + 20, dY + 5, 4, 2); // visor
      }

      ctx.restore();
    }

    // 8. Draw Particles (Shattering bricks, coin sparks, fire smoke)
    particles.forEach((pt) => {
      ctx.fillStyle = pt.color;
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.rotation);
      ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
      ctx.restore();
    });

    // 9. Draw Floating Point Scores
    floatingScores.forEach((fs) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = 'bold 12px monospace';
      ctx.strokeText(fs.text, fs.x, fs.y);
      ctx.fillText(fs.text, fs.x, fs.y);
    });

    // Restore camera scrolling translation
    ctx.restore();

    // Restore screen shake translation
    ctx.restore();
  };

  return (
    <div
      className="relative border-4 border-amber-600 rounded-2xl bg-black overflow-hidden shadow-2xl mx-auto"
      style={{ width: '100%', maxWidth: VIEW_WIDTH, aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
    >
      <canvas
        ref={canvasRef}
        width={VIEW_WIDTH}
        height={VIEW_HEIGHT}
        className="block w-full h-full"
      />
      {/* CRT-style scanline overlay for retro arcade authenticity */}
      <div className="absolute inset-0 pointer-events-none scanline-overlay" />
    </div>
  );
};
