
import React from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Target } from "lucide-react";

interface OnScreenControlsProps {
  onMove: (direction: "up" | "down" | "left" | "right") => void;
  onStopMove: () => void;
  onFire: () => void;
  onCollect: () => void;
}

export const OnScreenControls: React.FC<OnScreenControlsProps> = ({
  onMove,
  onStopMove,
  onFire,
  onCollect,
}) => {
  // Handle button press and release with faster response
  const handleTouchStart = (direction: "up" | "down" | "left" | "right") => {
    onMove(direction);
  };

  const handleTouchEnd = () => {
    onStopMove();
  };

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      {/* Directional controls */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-start-2">
          <button
            className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center text-white active:bg-black/60 active:scale-95 transition-all duration-100"
            onTouchStart={() => handleTouchStart("up")}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart("up")}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            <ArrowUp size={28} />
          </button>
        </div>
        <div className="col-start-1 row-start-2">
          <button
            className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center text-white active:bg-black/60 active:scale-95 transition-all duration-100"
            onTouchStart={() => handleTouchStart("left")}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart("left")}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            <ArrowLeft size={28} />
          </button>
        </div>
        <div className="col-start-3 row-start-2">
          <button
            className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center text-white active:bg-black/60 active:scale-95 transition-all duration-100"
            onTouchStart={() => handleTouchStart("right")}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart("right")}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            <ArrowRight size={28} />
          </button>
        </div>
        <div className="col-start-2 row-start-2">
          <div className="w-16 h-16 flex items-center justify-center text-white/50">
            <div className="w-4 h-4 rounded-full bg-white/20"></div>
          </div>
        </div>
        <div className="col-start-2 row-start-3">
          <button
            className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center text-white active:bg-black/60 active:scale-95 transition-all duration-100"
            onTouchStart={() => handleTouchStart("down")}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart("down")}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            <ArrowDown size={28} />
          </button>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          className="w-16 h-16 rounded-full bg-game-energy/80 flex items-center justify-center text-black font-bold active:bg-game-energy active:scale-95 transition-all duration-100"
          onTouchStart={onCollect}
          onClick={onCollect}
        >
          GRAB
        </button>
        <button
          className="w-16 h-16 rounded-full bg-game-ufo/80 flex items-center justify-center text-white active:bg-game-ufo active:scale-95 transition-all duration-100"
          onTouchStart={onFire}
          onClick={onFire}
        >
          <Target size={28} />
        </button>
      </div>
    </div>
  );
};
