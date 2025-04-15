
import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";
import { Play, Pause, RefreshCw, Zap } from "lucide-react";

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
  const { players, isMultiplayer } = useGameStore();
  
  // Check if game is over (any player won or lost)
  const isGameOver = players.some(player => player.isWinner || player.isLoser);
  
  // Handle keyboard shortcut for pausing/resuming
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Use 'p' key as pause/play toggle
      if (e.key === 'p') {
        if (isRunning) {
          onStart();
        } else if (!isGameOver) {
          onPause();
        }
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isRunning, isGameOver, onStart, onPause]);
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
      {!isRunning ? (
        <Button
          onClick={onStart}
          className="bg-game-energy text-black hover:bg-game-energy/80 gap-1"
          disabled={isGameOver}
        >
          <Play size={16} />
          {isGameOver ? "Game Over" : "Start"}
        </Button>
      ) : (
        <Button
          onClick={onPause}
          variant="secondary"
          className="gap-1"
        >
          <Pause size={16} />
          Pause
        </Button>
      )}
      <Button onClick={onReset} variant="destructive" className="gap-1">
        <RefreshCw size={16} />
        New
      </Button>
      <Button onClick={onSpawnOrb} className="bg-game-ufo hover:bg-game-ufo/80 gap-1">
        <Zap size={16} />
        Orb
      </Button>
    </div>
  );
};
