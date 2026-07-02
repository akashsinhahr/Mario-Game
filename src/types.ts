/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PowerUpType = 'mushroom' | 'flower' | 'star';

export type EnemyType = 'goomba' | 'koopa' | 'piranha' | 'beetle';
export type EnemyState = 'walk' | 'shell' | 'shell-spin' | 'flat' | 'dead';

export type BlockType = 'brick' | 'question' | 'ground' | 'pipe-left' | 'pipe-right' | 'pipe-top-left' | 'pipe-top-right' | 'hardblock' | 'empty-block' | 'lava' | 'cloud' | 'bush' | 'castle-brick' | 'castle-door';
export type BlockItem = 'coin' | 'mushroom' | 'flower' | 'star' | 'none';

export interface Block {
  id: string;
  x: number; // grid coordinate X * block size
  y: number; // grid coordinate Y * block size
  gridX: number;
  gridY: number;
  type: BlockType;
  contains: BlockItem;
  hitsLeft: number;
  isHitAnimated: boolean;
  hitOffset: number; // for physical jump animation
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  state: 'small' | 'super' | 'fire'; // small, mushroom-super, flower-fire
  isDead: boolean;
  isInvincible: boolean; // flag for star power
  invincibleTimer: number; // star power timer
  isFlashing: boolean; // post-damage flash
  flashTimer: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  crouching: boolean;
  slidingOnFlagpole: boolean;
  flagpoleSlideX: number;
  victoryWalk: boolean;
  score: number;
  coins: number;
  lives: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: EnemyType;
  state: EnemyState;
  facing: 'left' | 'right';
  deadTimer: number; // For flat goomba or dead fly-away
  grounded: boolean;
  spawnX: number;
  spawnY: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: PowerUpType;
  state: 'spawning' | 'active';
  spawnProgress: number; // 0 to 1
}

export interface Fireball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

export interface FloatingScore {
  id: string;
  x: number;
  y: number;
  text: string;
  life: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  theme: 'overworld' | 'underworld' | 'castle';
  width: number; // level width in blocks
  height: number; // level height in blocks
  backgroundColor: string;
  groundColor: string;
  skyColor: string;
  groundY: number; // block row for main ground
  startX: number; // player start block X
  startY: number; // player start block Y
  flagpoleX: number; // block X of flagpole
  blocks: { gridX: number; gridY: number; type: BlockType; contains?: BlockItem }[];
  enemies: { gridX: number; type: EnemyType }[];
  piranhaPipes?: { gridX: number; gridY: number }[]; // gridX = left column of a 2-wide pipe, gridY = its top row
}

export interface HighScore {
  name: string;
  score: number;
  coins: number;
  date: string;
}
