// src/helpers.tsx

import React from 'react';
import type { MatchupPair } from './FantasyTypes';

// --- Helper: Avatar Component (Tiny Version) ---
export const TinyAvatar = ({ id }: { id: string }) => (
  <img 
    src={id ? `https://sleepercdn.com/avatars/thumbs/${id}` : "https://sleepercdn.com/images/v2/icons/player_default.webp"} 
    alt="av" 
    className="w-6 h-6 rounded-full bg-gray-800 border border-white/10 shrink-0"
  />
);

// --- Helper: Single Compact Row ---
export function CompactMatchupRow({ match }: { match: MatchupPair }) {
  const { team1, team2 } = match;

  if (!team2) return null; // Skip bye weeks 

  // Calculate Win Probability / Progress
  const totalPoints = (team1.points + team2.points) || 1;
  const t1Ratio = Math.min(100, Math.max(0, (team1.points / totalPoints) * 100));
  
  const t1Winning = team1.points > team2.points;
  const t2Winning = team2.points > team1.points;

  return (
    <div className="relative w-full h-12 border-b border-white/5 last:border-0 flex items-center justify-between px-2 overflow-hidden group hover:bg-white/5 transition-colors">
      
      {/* Background "Tug of War" Bar (Subtle) */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-rose-500/30">
        <div 
          className="h-full bg-emerald-500/50 transition-all duration-1000" 
          style={{ width: `${t1Ratio}%` }} 
        />
      </div>

      {/* Team 1 (Left) */}
      <div className="flex items-center gap-2 w-[40%] overflow-hidden">
        <TinyAvatar id={team1.manager.avatar} />
        <div className="flex flex-col min-w-0">
            <span className={`text-[10px] font-bold truncate leading-tight ${t1Winning ? 'text-white' : 'text-gray-400'}`}>
                {team1.manager.name}
            </span>
            <span className={`text-xs font-mono leading-none ${t1Winning ? 'text-emerald-400' : 'text-gray-500'}`}>
                {team1.points.toFixed(1)}
            </span>
        </div>
      </div>

      {/* VS / Divider */}
      <div className="text-[9px] text-white/20 font-bold uppercase tracking-widest shrink-0">
        VS
      </div>

      {/* Team 2 (Right) */}
      <div className="flex items-center gap-2 w-[40%] justify-end overflow-hidden text-right">
        <div className="flex flex-col min-w-0 items-end">
            <span className={`text-[10px] font-bold truncate leading-tight ${t2Winning ? 'text-white' : 'text-gray-400'}`}>
                {team2.manager.name}
            </span>
            <span className={`text-xs font-mono leading-none ${t2Winning ? 'text-emerald-400' : 'text-gray-500'}`}>
                {team2.points.toFixed(1)}
            </span>
        </div>
        <TinyAvatar id={team2.manager.avatar} />
      </div>
    </div>
  );
}