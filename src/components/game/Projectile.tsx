
import React from "react";
import { ProjectileType } from "@/store/gameStore";

interface ProjectileProps {
  projectile: ProjectileType;
}

export const Projectile: React.FC<ProjectileProps> = ({ projectile }) => {
  const size = 8; // Size of projectile
  
  return (
    <div
      className="absolute projectile-glow"
      style={{
        left: projectile.position.x - size / 2,
        top: projectile.position.y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: projectile.playerOwnerId === "player1" 
          ? "#9b87f5" 
          : "#E879F9",
        boxShadow: projectile.playerOwnerId === "player1"
          ? "0 0 10px 2px #9b87f5"
          : "0 0 10px 2px #E879F9",
        zIndex: 15,
        transform: `rotate(${projectile.direction}deg)`,
      }}
    />
  );
};
