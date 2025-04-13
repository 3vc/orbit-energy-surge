
import React from "react";
import { EnergyOrb as EnergyOrbType } from "@/store/gameStore";

interface EnergyOrbProps {
  orb: EnergyOrbType;
  onClick: (id: string) => void;
}

export const EnergyOrb: React.FC<EnergyOrbProps> = ({ orb, onClick }) => {
  return (
    <div
      className="absolute orb-glow animate-float"
      style={{
        left: orb.position.x - orb.size / 2,
        top: orb.position.y - orb.size / 2,
        width: orb.size,
        height: orb.size,
        borderRadius: "50%",
        zIndex: 10,
        cursor: "pointer",
      }}
      onClick={() => onClick(orb.id)}
    >
      <div
        className="w-full h-full animate-glow"
        style={{
          background: `radial-gradient(circle, theme('colors.game.energy') 30%, rgba(255, 215, 0, 0.3) 100%)`,
          borderRadius: "50%",
        }}
      />
    </div>
  );
};
