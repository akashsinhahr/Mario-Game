/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelConfig, BlockType, BlockItem, EnemyType } from './types';

// Let's design 3 highly polished levels
export const levels: LevelConfig[] = [
  {
    id: 1,
    name: "World 1-1: Grassland Hills",
    theme: 'overworld',
    width: 220, // 220 blocks wide * 40px = 8800px level
    height: 15, // 15 blocks high * 40px = 600px canvas height
    backgroundColor: '#5c94fc', // Sky blue
    groundColor: '#73bf36', // Rich grass green
    skyColor: '#bde6ff',
    groundY: 13, // Rows 13 and 14 are ground
    startX: 3,
    startY: 11,
    flagpoleX: 200,
    piranhaPipes: [
      { gridX: 38, gridY: 11 },
      { gridX: 78, gridY: 11 },
    ],
    blocks: [
      // Early tutorials: some question blocks and bricks
      { gridX: 16, gridY: 9, type: 'question', contains: 'coin' },
      { gridX: 20, gridY: 9, type: 'brick', contains: 'none' },
      { gridX: 21, gridY: 9, type: 'question', contains: 'mushroom' },
      { gridX: 22, gridY: 9, type: 'brick', contains: 'none' },
      { gridX: 23, gridY: 9, type: 'question', contains: 'coin' },
      { gridX: 24, gridY: 9, type: 'brick', contains: 'none' },
      
      // A couple of decorative clouds high up
      { gridX: 8, gridY: 3, type: 'cloud' },
      { gridX: 9, gridY: 3, type: 'cloud' },
      { gridX: 28, gridY: 4, type: 'cloud' },
      { gridX: 29, gridY: 4, type: 'cloud' },
      
      // Green pipes acting as physical barriers
      { gridX: 28, gridY: 12, type: 'pipe-top-left' },
      { gridX: 29, gridY: 12, type: 'pipe-top-right' },
      { gridX: 28, gridY: 13, type: 'pipe-left' },
      { gridX: 29, gridY: 13, type: 'pipe-right' },

      { gridX: 38, gridY: 11, type: 'pipe-top-left' },
      { gridX: 39, gridY: 11, type: 'pipe-top-right' },
      { gridX: 38, gridY: 12, type: 'pipe-left' },
      { gridX: 39, gridY: 12, type: 'pipe-right' },
      { gridX: 38, gridY: 13, type: 'pipe-left' },
      { gridX: 39, gridY: 13, type: 'pipe-right' },

      // High floating brick/question section with Fire Flower
      { gridX: 47, gridY: 9, type: 'brick', contains: 'none' },
      { gridX: 48, gridY: 9, type: 'question', contains: 'flower' },
      { gridX: 49, gridY: 9, type: 'brick', contains: 'none' },
      { gridX: 50, gridY: 9, type: 'brick', contains: 'coin' }, // multi-coin brick
      { gridX: 51, gridY: 9, type: 'brick', contains: 'none' },

      // First Pit at 60-63 (Gaps are implemented by simply not having ground tiles at these columns)
      
      // Platform on the other side of the pit
      { gridX: 66, gridY: 9, type: 'question', contains: 'star' }, // Invincibility Star!
      { gridX: 70, gridY: 12, type: 'hardblock' },
      { gridX: 71, gridY: 12, type: 'hardblock' },
      { gridX: 72, gridY: 12, type: 'hardblock' },
      
      // Double pipe barrier
      { gridX: 78, gridY: 11, type: 'pipe-top-left' },
      { gridX: 79, gridY: 11, type: 'pipe-top-right' },
      { gridX: 78, gridY: 12, type: 'pipe-left' },
      { gridX: 79, gridY: 12, type: 'pipe-right' },
      { gridX: 78, gridY: 13, type: 'pipe-left' },
      { gridX: 79, gridY: 13, type: 'pipe-right' },

      // Pit at 86-88
      
      // Steps leading to a high challenge
      { gridX: 92, gridY: 12, type: 'hardblock' },
      { gridX: 93, gridY: 11, type: 'hardblock' },
      { gridX: 94, gridY: 10, type: 'hardblock' },
      { gridX: 95, gridY: 9, type: 'hardblock' },
      
      { gridX: 100, gridY: 9, type: 'brick', contains: 'none' },
      { gridX: 101, gridY: 9, type: 'brick', contains: 'coin' },
      { gridX: 102, gridY: 9, type: 'brick', contains: 'none' },
      
      // High cloud level coins
      { gridX: 100, gridY: 5, type: 'cloud' },
      { gridX: 101, gridY: 5, type: 'cloud' },

      // Pit 110-114 (wide)
      { gridX: 108, gridY: 12, type: 'hardblock' },
      { gridX: 109, gridY: 11, type: 'hardblock' },
      
      // Safe platform in the middle of wide pit
      { gridX: 112, gridY: 9, type: 'brick', contains: 'coin' },
      
      { gridX: 115, gridY: 11, type: 'hardblock' },
      { gridX: 116, gridY: 12, type: 'hardblock' },

      // Multi-tier blocks
      { gridX: 124, gridY: 9, type: 'brick', contains: 'none' },
      { gridX: 125, gridY: 9, type: 'question', contains: 'coin' },
      { gridX: 126, gridY: 9, type: 'brick', contains: 'none' },
      { gridX: 125, gridY: 5, type: 'question', contains: 'mushroom' },

      // Bush decorations
      { gridX: 5, gridY: 12, type: 'bush' },
      { gridX: 12, gridY: 12, type: 'bush' },
      { gridX: 35, gridY: 12, type: 'bush' },
      { gridX: 55, gridY: 12, type: 'bush' },
      { gridX: 135, gridY: 12, type: 'bush' },

      // Pyramid stairs leading to the flagpole
      { gridX: 184, gridY: 12, type: 'hardblock' },
      { gridX: 185, gridY: 11, type: 'hardblock' },
      { gridX: 185, gridY: 12, type: 'hardblock' },
      { gridX: 186, gridY: 10, type: 'hardblock' },
      { gridX: 186, gridY: 11, type: 'hardblock' },
      { gridX: 186, gridY: 12, type: 'hardblock' },
      { gridX: 187, gridY: 9, type: 'hardblock' },
      { gridX: 187, gridY: 10, type: 'hardblock' },
      { gridX: 187, gridY: 11, type: 'hardblock' },
      { gridX: 187, gridY: 12, type: 'hardblock' },

      // Flagpole base block
      { gridX: 200, gridY: 12, type: 'hardblock' },
      
      // Castle at the end (columns 206 to 211)
      { gridX: 206, gridY: 12, type: 'castle-brick' },
      { gridX: 206, gridY: 11, type: 'castle-brick' },
      { gridX: 206, gridY: 10, type: 'castle-brick' },
      { gridX: 207, gridY: 10, type: 'castle-brick' },
      { gridX: 208, gridY: 10, type: 'castle-brick' },
      { gridX: 208, gridY: 11, type: 'castle-brick' },
      { gridX: 208, gridY: 12, type: 'castle-door' }, // Dark door
      { gridX: 209, gridY: 10, type: 'castle-brick' },
      { gridX: 210, gridY: 10, type: 'castle-brick' },
      { gridX: 210, gridY: 11, type: 'castle-brick' },
      { gridX: 210, gridY: 12, type: 'castle-brick' },
    ],
    enemies: [
      { gridX: 14, type: 'goomba' },
      { gridX: 25, type: 'goomba' },
      { gridX: 34, type: 'goomba' },
      { gridX: 43, type: 'koopa' }, // Koopa Troopa!
      { gridX: 52, type: 'goomba' },
      { gridX: 54, type: 'goomba' },
      { gridX: 73, type: 'koopa' },
      { gridX: 82, type: 'goomba' },
      { gridX: 103, type: 'goomba' },
      { gridX: 122, type: 'koopa' },
      { gridX: 130, type: 'goomba' },
      { gridX: 132, type: 'goomba' },
      { gridX: 145, type: 'koopa' },
      { gridX: 160, type: 'goomba' },
      { gridX: 175, type: 'goomba' }
    ]
  },
  {
    id: 2,
    name: "World 1-2: Cavern Lava Pits",
    theme: 'underworld',
    width: 200,
    height: 15,
    backgroundColor: '#0c001a', // Deep dark purple
    groundColor: '#301800', // Dark earthy brown
    skyColor: '#120024',
    groundY: 13,
    startX: 3,
    startY: 11,
    flagpoleX: 180,
    piranhaPipes: [
      { gridX: 114, gridY: 10 },
    ],
    blocks: [
      // Underground ceiling
      ...Array.from({ length: 200 }, (_, i) => ({ gridX: i, gridY: 0, type: 'hardblock' as BlockType })),
      ...Array.from({ length: 200 }, (_, i) => ({ gridX: i, gridY: 1, type: 'hardblock' as BlockType })),

      // Underground brick challenges
      { gridX: 10, gridY: 9, type: 'brick', contains: 'coin' },
      { gridX: 11, gridY: 9, type: 'brick', contains: 'coin' },
      { gridX: 12, gridY: 9, type: 'question', contains: 'mushroom' },
      { gridX: 13, gridY: 9, type: 'brick', contains: 'none' },

      // Hard block structure
      { gridX: 18, gridY: 12, type: 'hardblock' },
      { gridX: 19, gridY: 12, type: 'hardblock' },
      { gridX: 20, gridY: 12, type: 'hardblock' },
      
      // Floating platforms above lava pits
      // Pit 1: columns 25 to 32 (wide lava pool!)
      { gridX: 28, gridY: 9, type: 'brick', contains: 'coin' },
      { gridX: 29, gridY: 9, type: 'brick', contains: 'coin' },
      
      // Pits will have lava blocks at the bottom row (row 13 and 14)
      ...Array.from({ length: 8 }, (_, i) => ({ gridX: 25 + i, gridY: 13, type: 'lava' as BlockType })),
      ...Array.from({ length: 8 }, (_, i) => ({ gridX: 25 + i, gridY: 14, type: 'lava' as BlockType })),

      // Buzzy Beetle introduction
      { gridX: 42, gridY: 9, type: 'question', contains: 'flower' },
      { gridX: 46, gridY: 12, type: 'hardblock' },
      { gridX: 47, gridY: 11, type: 'hardblock' },

      // Pit 2: columns 52 to 60 (lava)
      ...Array.from({ length: 9 }, (_, i) => ({ gridX: 52 + i, gridY: 13, type: 'lava' as BlockType })),
      ...Array.from({ length: 9 }, (_, i) => ({ gridX: 52 + i, gridY: 14, type: 'lava' as BlockType })),
      // Suspended stepping blocks
      { gridX: 54, gridY: 9, type: 'hardblock' },
      { gridX: 57, gridY: 9, type: 'hardblock' },

      // Maze-like cavern passage
      { gridX: 68, gridY: 8, type: 'hardblock' },
      { gridX: 69, gridY: 8, type: 'hardblock' },
      { gridX: 70, gridY: 8, type: 'hardblock' },
      { gridX: 71, gridY: 8, type: 'hardblock' },
      { gridX: 72, gridY: 8, type: 'hardblock' },
      { gridX: 73, gridY: 8, type: 'hardblock' },

      { gridX: 70, gridY: 12, type: 'hardblock' },
      { gridX: 71, gridY: 12, type: 'hardblock' },
      { gridX: 72, gridY: 12, type: 'hardblock' },

      // Question blocks with Star
      { gridX: 85, gridY: 8, type: 'question', contains: 'star' },
      { gridX: 89, gridY: 9, type: 'brick', contains: 'none' },

      // Pit 3: columns 94 to 105 (very wide lava pit!)
      ...Array.from({ length: 12 }, (_, i) => ({ gridX: 94 + i, gridY: 13, type: 'lava' as BlockType })),
      ...Array.from({ length: 12 }, (_, i) => ({ gridX: 94 + i, gridY: 14, type: 'lava' as BlockType })),
      // Thin brick stepping stones
      { gridX: 96, gridY: 10, type: 'brick', contains: 'none' },
      { gridX: 99, gridY: 8, type: 'brick', contains: 'coin' },
      { gridX: 102, gridY: 10, type: 'brick', contains: 'none' },

      // High pipes
      { gridX: 114, gridY: 10, type: 'pipe-top-left' },
      { gridX: 115, gridY: 10, type: 'pipe-top-right' },
      { gridX: 114, gridY: 11, type: 'pipe-left' },
      { gridX: 115, gridY: 11, type: 'pipe-right' },
      { gridX: 114, gridY: 12, type: 'pipe-left' },
      { gridX: 115, gridY: 12, type: 'pipe-right' },
      { gridX: 114, gridY: 13, type: 'pipe-left' },
      { gridX: 115, gridY: 13, type: 'pipe-right' },

      // Final staircase
      { gridX: 165, gridY: 12, type: 'hardblock' },
      { gridX: 166, gridY: 11, type: 'hardblock' },
      { gridX: 167, gridY: 10, type: 'hardblock' },
      { gridX: 168, gridY: 9, type: 'hardblock' },

      { gridX: 180, gridY: 12, type: 'hardblock' },

      // End Castle
      { gridX: 186, gridY: 12, type: 'castle-brick' },
      { gridX: 186, gridY: 11, type: 'castle-brick' },
      { gridX: 186, gridY: 10, type: 'castle-brick' },
      { gridX: 187, gridY: 10, type: 'castle-brick' },
      { gridX: 188, gridY: 10, type: 'castle-brick' },
      { gridX: 188, gridY: 11, type: 'castle-brick' },
      { gridX: 188, gridY: 12, type: 'castle-door' },
      { gridX: 189, gridY: 10, type: 'castle-brick' },
      { gridX: 190, gridY: 10, type: 'castle-brick' },
      { gridX: 190, gridY: 11, type: 'castle-brick' },
      { gridX: 190, gridY: 12, type: 'castle-brick' },
    ],
    enemies: [
      { gridX: 15, type: 'beetle' }, // Beetle is immune to fireballs!
      { gridX: 22, type: 'goomba' },
      { gridX: 38, type: 'beetle' },
      { gridX: 48, type: 'koopa' },
      { gridX: 65, type: 'goomba' },
      { gridX: 74, type: 'goomba' },
      { gridX: 80, type: 'beetle' },
      { gridX: 91, type: 'koopa' },
      { gridX: 110, type: 'goomba' },
      { gridX: 122, type: 'beetle' },
      { gridX: 135, type: 'koopa' },
      { gridX: 150, type: 'goomba' }
    ]
  },
  {
    id: 3,
    name: "World 1-3: Bowser's Castle",
    theme: 'castle',
    width: 180,
    height: 15,
    backgroundColor: '#110000', // Deep red/black
    groundColor: '#3d3d3d', // Dark stone grey
    skyColor: '#1a0000',
    groundY: 13,
    startX: 3,
    startY: 11,
    flagpoleX: 155, // In Castle, this represents the Bowser Bridge Axe position!
    blocks: [
      // Castle ceiling
      ...Array.from({ length: 180 }, (_, i) => ({ gridX: i, gridY: 0, type: 'hardblock' as BlockType })),
      ...Array.from({ length: 180 }, (_, i) => ({ gridX: i, gridY: 1, type: 'hardblock' as BlockType })),

      // Castle brick decors and lava pits
      // Huge lava pits! Castle has a lot of lava
      ...Array.from({ length: 15 }, (_, i) => ({ gridX: 20 + i, gridY: 13, type: 'lava' as BlockType })),
      ...Array.from({ length: 15 }, (_, i) => ({ gridX: 20 + i, gridY: 14, type: 'lava' as BlockType })),

      // Floating castle steps over first lava pit
      { gridX: 22, gridY: 10, type: 'castle-brick' },
      { gridX: 25, gridY: 8, type: 'castle-brick' },
      { gridX: 28, gridY: 8, type: 'castle-brick' },
      { gridX: 31, gridY: 10, type: 'castle-brick' },

      // Hard blocks inside castle
      { gridX: 42, gridY: 12, type: 'hardblock' },
      { gridX: 43, gridY: 11, type: 'hardblock' },
      { gridX: 44, gridY: 10, type: 'hardblock' },
      { gridX: 45, gridY: 10, type: 'question', contains: 'mushroom' },
      { gridX: 46, gridY: 10, type: 'hardblock' },

      // Second Lava Pit (columns 54 to 68)
      ...Array.from({ length: 15 }, (_, i) => ({ gridX: 54 + i, gridY: 13, type: 'lava' as BlockType })),
      ...Array.from({ length: 15 }, (_, i) => ({ gridX: 54 + i, gridY: 14, type: 'lava' as BlockType })),
      // Small castle brick steps with fire flower
      { gridX: 56, gridY: 9, type: 'castle-brick' },
      { gridX: 61, gridY: 7, type: 'question', contains: 'flower' },
      { gridX: 66, gridY: 9, type: 'castle-brick' },

      // Tricky beetle patrol on blocks
      { gridX: 74, gridY: 9, type: 'castle-brick' },
      { gridX: 75, gridY: 9, type: 'castle-brick' },
      { gridX: 76, gridY: 9, type: 'castle-brick' },
      { gridX: 77, gridY: 9, type: 'castle-brick' },
      { gridX: 78, gridY: 9, type: 'castle-brick' },

      // Third Lava Pit (columns 88 to 100)
      ...Array.from({ length: 13 }, (_, i) => ({ gridX: 88 + i, gridY: 13, type: 'lava' as BlockType })),
      ...Array.from({ length: 13 }, (_, i) => ({ gridX: 88 + i, gridY: 14, type: 'lava' as BlockType })),
      { gridX: 90, gridY: 10, type: 'castle-brick' },
      { gridX: 93, gridY: 10, type: 'castle-brick' },
      { gridX: 94, gridY: 10, type: 'question', contains: 'star' },
      { gridX: 95, gridY: 10, type: 'castle-brick' },
      { gridX: 98, gridY: 10, type: 'castle-brick' },

      // Bowser's Hallway (starts from column 120)
      // High barrier
      { gridX: 115, gridY: 12, type: 'hardblock' },
      { gridX: 115, gridY: 11, type: 'hardblock' },
      { gridX: 115, gridY: 10, type: 'hardblock' },
      { gridX: 115, gridY: 9, type: 'hardblock' },

      // Bowser's Bridge (columns 138 to 153)
      // This is a bridge made of bricks that can be destroyed!
      ...Array.from({ length: 16 }, (_, i) => ({ gridX: 138 + i, gridY: 12, type: 'brick' as BlockType, contains: 'none' as BlockItem })),
      // Lava below the bridge
      ...Array.from({ length: 16 }, (_, i) => ({ gridX: 138 + i, gridY: 13, type: 'lava' as BlockType })),
      ...Array.from({ length: 16 }, (_, i) => ({ gridX: 138 + i, gridY: 14, type: 'lava' as BlockType })),

      // The golden AXE is at column 155
      // To represent the axe, we place a custom block type at column 155
      { gridX: 155, gridY: 11, type: 'question', contains: 'none' }, // will render as Golden Axe!

      // Toad/Princess Chamber (columns 160 to 170)
      { gridX: 160, gridY: 12, type: 'hardblock' },
      { gridX: 161, gridY: 12, type: 'hardblock' },
      { gridX: 162, gridY: 12, type: 'hardblock' },
    ],
    enemies: [
      { gridX: 12, type: 'beetle' },
      { gridX: 18, type: 'koopa' },
      { gridX: 40, type: 'beetle' },
      { gridX: 48, type: 'goomba' },
      { gridX: 75, type: 'beetle' },
      { gridX: 82, type: 'koopa' },
      { gridX: 104, type: 'beetle' },
      { gridX: 110, type: 'goomba' },
      { gridX: 125, type: 'koopa' }, // Bowser's guardian
      { gridX: 144, type: 'goomba' }, // Bowser's minion on the bridge!
    ]
  }
];
