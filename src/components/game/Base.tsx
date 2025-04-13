
import React from "react";
import { Base as BaseType, Player } from "@/store/gameStore";

interface BaseProps {
  base: BaseType;
  player: Player;
}

export const Base: React.FC<BaseProps> = ({ base, player }) => {
  const baseColor = player.id === "player1" 
    ? "theme('colors.game.base')" 
    : "#14B8A6"; // Teal for player 2

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
            ${baseColor} 0%,
            ${player.id === "player1" ? "rgba(51, 204, 153, 0.8)" : "rgba(20, 184, 166, 0.8)"} 25%,
            ${baseColor} 50%,
            ${player.id === "player1" ? "rgba(51, 204, 153, 0.8)" : "rgba(20, 184, 166, 0.8)"} 75%,
            ${baseColor} 100%
          )`,
        }}
      >
        {/* Energy indicator in middle of base */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full w-2/3 h-2/3 flex flex-col items-center justify-center text-game-energy">
            <div className="text-xl font-bold">{player.storedEnergy}</div>
            <div className="text-xs opacity-70">ENERGY</div>
            {player.isWinner && (
              <div className="text-sm mt-1 text-green-400">WINNER!</div>
            )}
            {player.isLoser && (
              <div className="text-sm mt-1 text-red-400">DEFEATED</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
