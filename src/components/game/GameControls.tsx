
import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";

interface GameControlsProps {
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpawnOrb: () => void;
  isRunning: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onStart,
  onPause,
  onReset,
  onSpawnOrb,
  isRunning,
}) => {
  const { players } = useGameStore();
  
  // Check if game is over (any player won or lost)
  const isGameOver = players.some(player => player.isWinner || player.isLoser);
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
      {!isRunning ? (
        <Button
          onClick={onStart}
          className="bg-game-energy text-black hover:bg-game-energy/80"
          disabled={isGameOver}
        >
          {isGameOver ? "Game Over" : "Start Game"}
        </Button>
      ) : (
        <Button
          onClick={onPause}
          variant="secondary"
        >
          Pause
        </Button>
      )}
      <Button onClick={onReset} variant="destructive">
        New Game
      </Button>
      <Button onClick={onSpawnOrb} className="bg-game-ufo hover:bg-game-ufo/80">
        Spawn Orb
      </Button>
    </div>
  );
};
