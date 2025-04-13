
import React from "react";
import { Base as BaseType } from "@/store/gameStore";

interface BaseProps {
  base: BaseType;
}

export const Base: React.FC<BaseProps> = ({ base }) => {
  return (
    <div
      className="absolute base-glow"
      style={{
        left: base.position.x - base.size / 2,
        top: base.position.y - base.size / 2,
        width: base.size,
        height: base.size,
        borderRadius: "50%",
        zIndex: 15,
      }}
    >
      <div
        className="w-full h-full rounded-full animate-rotate-slow relative"
        style={{
          background: `conic-gradient(
            theme('colors.game.base') 0%,
            rgba(51, 204, 153, 0.8) 25%,
            theme('colors.game.base') 50%,
            rgba(51, 204, 153, 0.8) 75%,
            theme('colors.game.base') 100%
          )`,
        }}
      >
        {/* Energy indicator in middle of base */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full w-2/3 h-2/3 flex flex-col items-center justify-center text-game-energy">
            <div className="text-xl font-bold">{base.storedEnergy}</div>
            <div className="text-xs opacity-70">ENERGY</div>
            <div className="text-sm mt-1">Level {base.level}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
