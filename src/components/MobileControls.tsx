/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

interface MobileControlsProps {
  onPress: (key: string, isPressed: boolean) => void;
  canShoot: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onPress, canShoot }) => {
  // Prevent default zoom/scrolling behavior for touch actions inside the controller buttons
  const handleTouch = (key: string, isPressed: boolean, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onPress(key, isPressed);
  };

  return (
    <div className="absolute bottom-3 left-0 w-full px-5 flex justify-between items-end pointer-events-none select-none z-30 md:hidden pb-2">
      {/* Left side: Navigation D-Pad */}
      <div className="flex gap-2 pointer-events-auto">
        {/* Left Arrow */}
        <button
          onTouchStart={(e) => handleTouch('ArrowLeft', true, e)}
          onTouchEnd={(e) => handleTouch('ArrowLeft', false, e)}
          onMouseDown={(e) => handleTouch('ArrowLeft', true, e)}
          onMouseUp={(e) => handleTouch('ArrowLeft', false, e)}
          onMouseLeave={(e) => handleTouch('ArrowLeft', false, e)}
          className="w-14 h-14 bg-black/60 border-2 border-white/40 active:bg-red-500/80 active:border-red-400 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition transform"
        >
          <ArrowLeft className="w-7 h-7" />
        </button>

        {/* Crouch Arrow */}
        <button
          onTouchStart={(e) => handleTouch('ArrowDown', true, e)}
          onTouchEnd={(e) => handleTouch('ArrowDown', false, e)}
          onMouseDown={(e) => handleTouch('ArrowDown', true, e)}
          onMouseUp={(e) => handleTouch('ArrowDown', false, e)}
          onMouseLeave={(e) => handleTouch('ArrowDown', false, e)}
          className="w-14 h-14 bg-black/60 border-2 border-white/40 active:bg-red-500/80 active:border-red-400 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition transform"
        >
          <ArrowDown className="w-7 h-7" />
        </button>

        {/* Right Arrow */}
        <button
          onTouchStart={(e) => handleTouch('ArrowRight', true, e)}
          onTouchEnd={(e) => handleTouch('ArrowRight', false, e)}
          onMouseDown={(e) => handleTouch('ArrowRight', true, e)}
          onMouseUp={(e) => handleTouch('ArrowRight', false, e)}
          onMouseLeave={(e) => handleTouch('ArrowRight', false, e)}
          className="w-14 h-14 bg-black/60 border-2 border-white/40 active:bg-red-500/80 active:border-red-400 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition transform"
        >
          <ArrowRight className="w-7 h-7" />
        </button>
      </div>

      {/* Right side: Action Buttons (A & B) */}
      <div className="flex gap-3 pointer-events-auto items-center">
        {/* Fire/Run Button (B) */}
        {canShoot && (
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-neutral-300 uppercase mb-0.5 font-black">Fire</span>
            <button
              onTouchStart={(e) => handleTouch('KeyX', true, e)}
              onTouchEnd={(e) => handleTouch('KeyX', false, e)}
              onMouseDown={(e) => handleTouch('KeyX', true, e)}
              onMouseUp={(e) => handleTouch('KeyX', false, e)}
              onMouseLeave={(e) => handleTouch('KeyX', false, e)}
              className="w-14 h-14 bg-rose-700/80 border-2 border-rose-500 active:bg-rose-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg active:scale-90 transition transform"
            >
              B
            </button>
          </div>
        )}

        {/* Jump Button (A) */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-mono text-neutral-300 uppercase mb-0.5 font-black">Jump</span>
          <button
            onTouchStart={(e) => handleTouch('Space', true, e)}
            onTouchEnd={(e) => handleTouch('Space', false, e)}
            onMouseDown={(e) => handleTouch('Space', true, e)}
            onMouseUp={(e) => handleTouch('Space', false, e)}
            onMouseLeave={(e) => handleTouch('Space', false, e)}
            className="w-16 h-16 bg-amber-500/80 border-2 border-amber-400 active:bg-amber-400 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg active:scale-90 transition transform"
          >
            A
          </button>
        </div>
      </div>
    </div>
  );
};
