// src/CompactLeagueDisplay.tsx

import { motion } from 'framer-motion';
import type { LeagueData } from './FantasyTypes';
import { CompactMatchupRow } from './FantasyHelpers';

// HELPER: League Avatar Component
const LeagueAvatar = ({ id }: { id: string | null }) => {
    const src = id ? `https://sleepercdn.com/avatars/thumbs/${id}` : "https://sleepercdn.com/images/v2/icons/default_league_avatar.png";

    return (
        <img 
            src={src} 
            alt="League Icon" 
            className="w-5 h-5 rounded-full border border-white/10 shrink-0"
        />
    );
};


// --- Display Component (Receives processed data) ---
interface CompactLeagueDisplayProps {
    data: LeagueData;
}

export function CompactLeagueDisplay({ data }: CompactLeagueDisplayProps) {
    const { name, week, matches, loading, error, avatar } = data;
    
    const statusColor = loading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-red-500' : 'bg-emerald-500';
    const statusText = loading ? 'SYNCING' : error ? 'ERROR' : 'LIVE';

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full bg-slate-900 border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl"
        >
            {/* Sticky Header - includes League Icon */}
            <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex justify-between items-center backdrop-blur-md z-10">
                
                {/* LEAGUE NAME AND ICON */}
                <div className="flex items-center gap-2 max-w-[65%]">
                    {avatar && <LeagueAvatar id={avatar} />}
                    <span className="text-sm font-bold text-white truncate">
                        {name}
                    </span>
                </div>
                
                <div className="flex items-center gap-1">
                    {/* Week Display */}
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider mr-2">
                        Wk {week || '...'}
                    </span>
                    {/* Live Indicator */}
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}/>
                    <span className="text-[10px] text-emerald-400 font-medium">{statusText}</span>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {loading ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-500 animate-pulse">
                        Loading Matchups...
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center text-sm text-red-400 p-4 text-center">
                        {error}
                    </div>
                ) : (
                    matches.map(m => <CompactMatchupRow key={m.matchupId} match={m} />)
                )}
            </div>
        </motion.div>
    );
}