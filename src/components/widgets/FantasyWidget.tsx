import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// --- Types (Remaining the same for brevity) ---
interface TeamMatchup {
  rosterId: number;
  matchupId: number;
  points: number;
  manager: {
    name: string;
    avatar: string;
  };
}

interface MatchupPair {
  matchupId: number;
  team1: TeamMatchup;
  team2: TeamMatchup | null;
}

// --- Helper: Avatar Component (Tiny Version) ---
const TinyAvatar = ({ id }: { id: string }) => (
  <img 
    src={id ? `https://sleepercdn.com/avatars/thumbs/${id}` : "https://sleepercdn.com/images/v2/icons/player_default.webp"} 
    alt="av" 
    className="w-6 h-6 rounded-full bg-gray-800 border border-white/10 shrink-0"
  />
);

// --- Helper: Single Compact Row ---
function CompactMatchupRow({ match }: { match: MatchupPair }) {
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

// --- Main Component ---
export default function CompactLeagueWidget({ leagueId }: { leagueId: string }) {
  const [matches, setMatches] = useState<MatchupPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState(0);
  // NEW STATE FOR LEAGUE NAME
  const [leagueName, setLeagueName] = useState("League"); 

  useEffect(() => {
    if (!leagueId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Get League Details and Week
        const [stateData, leagueDetails] = await Promise.all([
             fetch("https://api.sleeper.app/v1/state/nfl").then(r => r.json()),
             fetch(`https://api.sleeper.app/v1/league/${leagueId}`).then(r => r.json()),
        ]);
        
        setWeek(stateData.week);
        // SET LEAGUE NAME
        setLeagueName(leagueDetails.name || "Fantasy League");

        // 2. Fetch Users, Rosters, Matchups Parallel
        const [users, rosters, matchups] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`).then(r => r.json()),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`).then(r => r.json()),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${stateData.week}`).then(r => r.json())
        ]);

        // 3. Map Data (Roster ID -> Name/Avatar)
        const rosterMap = new Map();
        rosters.forEach((r: any) => {
          const user = users.find((u: any) => u.user_id === r.owner_id);
          rosterMap.set(r.roster_id, {
            name: user?.metadata?.team_name || user?.display_name || "Team",
            avatar: user?.avatar
          });
        });

        // 4. Group Matchups by Matchup ID
        const grouped = new Map<number, TeamMatchup[]>();
        matchups.forEach((m: any) => {
          grouped.set(m.matchup_id, [...(grouped.get(m.matchup_id) || []), {
            rosterId: m.roster_id,
            matchupId: m.matchup_id,
            points: m.points,
            manager: rosterMap.get(m.roster_id)
          }]);
        });

        // 5. Flatten to pairs
        const pairs: MatchupPair[] = [];
        grouped.forEach((teams, mId) => pairs.push({ matchupId: mId, team1: teams[0], team2: teams[1] || null }));
        
        setMatches(pairs.sort((a, b) => a.matchupId - b.matchupId));
      } catch (e) {
        console.error("Error fetching league data:", e);
        setLeagueName("Error Loading");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [leagueId]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="w-full h-full bg-slate-900 border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl"
    >
      {/* Sticky Header - League Name Included */}
      <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex justify-between items-center backdrop-blur-md z-10">
        
        {/* LEAGUE NAME */}
        <span className="text-sm font-bold text-white truncate max-w-[60%]">
            {leagueName}
        </span>
        
        <div className="flex items-center gap-1">
             <span className="text-xs font-bold text-gray-300 uppercase tracking-wider mr-2">
                Wk {week}
            </span>
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
             <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {loading ? (
           <div className="flex h-full items-center justify-center text-xs text-gray-500 animate-pulse">
             Loading Matchups...
           </div>
        ) : (
          matches.map(m => <CompactMatchupRow key={m.matchupId} match={m} />)
        )}
      </div>
    </motion.div>
  );
}