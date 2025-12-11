import { useEffect, useState } from "react";
import Card from "./Card";

interface Team {
    name: string;
    abbrev: string;
    score: number;
    logo: {
        light: string;
        dark: string;
    };
}

interface Game {
    id: number;
    status: string; // "LIVE" | "PRE" | "FINAL" | "OFF"
    home: Team;
    away: Team;
    liveInfo: {
        period: number;
        periodType: string;
        timeRemaining: string | null;
    } | null;
    preInfo: {
        startTimeUTC: string;
    } | null;
    finalInfo: any | null;
}

interface NHLResponse {
    success: boolean;
    games: Game[];
}

interface HockeyScoreWidgetProps {
    timezone?: string;
}

export default function HockeyScoreWidget({ timezone = "America/New_York" }: HockeyScoreWidgetProps) {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch('https://imlubkzdbhfxtuzbjvni.supabase.co/functions/v1/nhl-widget', {
                    headers: {
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                    }
                });
                const data: NHLResponse = await response.json();
                console.log("NHL Data:", data);
                if (data.success) {
                    setGames(data.games);
                }
            } catch (error) {
                console.error("Failed to fetch NHL games", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
        // Refresh every minute
        const interval = setInterval(fetchGames, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Card>
                <div className="flex items-center justify-center h-full w-full">
                    <span className="text-white/50 text-sm animate-pulse">Loading scores...</span>
                </div>
            </Card>
        );
    }

    return (
        <Card centered={false}>
            <div className="flex flex-col gap-1 w-full h-full">
                <div className="flex items-center justify-between sticky top-0 bg-transparent backdrop-blur-sm py-0.5 z-10">
                    <h3 className="text-white/90 text-[10px] font-bold uppercase tracking-wider">NHL</h3>
                    <span className="text-[9px] text-white/40">{new Date().toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span>
                </div>
                
                <div className="flex flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
                    {games.length === 0 ? (
                        <div className="text-white/50 text-[10px] text-center py-4">No games</div>
                    ) : (
                        games.map((game) => (
                            <GameItem key={game.id} game={game} timezone={timezone} />
                        ))
                    )}
                </div>
            </div>
        </Card>
    );
}

function GameItem({ game, timezone }: { game: Game; timezone: string }) {
    const isLive = game.status === "LIVE" || game.status === "CRIT";
    const isPre = game.status === "PRE" || game.status === "FUT";
    const isFinal = game.status === "FINAL" || game.status === "OFF";

    const formatTime = (utcTime: string) => {
        return new Date(utcTime).toLocaleTimeString("en-US", { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZone: timezone 
        });
    };

    return (
        <div className="flex items-center justify-between bg-white/5 rounded-md py-1 px-1.5 hover:bg-white/10 transition-colors border border-white/5">
            {/* Away Team */}
            <div className="flex flex-col items-center w-8">
                <img src={game.away.logo.dark} alt={game.away.abbrev} className="w-5 h-5 object-contain drop-shadow-sm" />
                <span className="text-[8px] text-white/70 font-bold leading-none mt-0.5">{game.away.abbrev}</span>
            </div>

            {/* Score / Info */}
            <div className="flex flex-col items-center justify-center flex-1 px-0.5">
                {isPre ? (
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-white/80 font-bold bg-white/10 px-1.5 py-px rounded-full">
                            {game.preInfo ? formatTime(game.preInfo.startTimeUTC) : "TBD"}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 mb-px">
                        <span className={`text-base font-bold ${game.away.score > game.home.score ? 'text-white' : 'text-white/60'}`}>
                            {game.away.score}
                        </span>
                        <span className="text-white/20 text-[9px]">-</span>
                        <span className={`text-base font-bold ${game.home.score > game.away.score ? 'text-white' : 'text-white/60'}`}>
                            {game.home.score}
                        </span>
                    </div>
                )}
                
                {isLive && (
                    <div 
                        className="text-[8px] font-bold animate-pulse flex items-center gap-1 leading-none"
                        style={{ color: '#f87171' }}
                    >
                        <div 
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: '#ef4444', minWidth: '4px', minHeight: '4px' }}
                        />
                        {game.liveInfo?.periodType === 'REG' ? `P${game.liveInfo?.period}` : game.liveInfo?.periodType} {game.liveInfo?.timeRemaining || ""}
                    </div>
                )}
                {isFinal && (
                    <span className="text-[8px] text-white/40 font-medium uppercase tracking-wide leading-none">Final</span>
                )}
            </div>

            {/* Home Team */}
            <div className="flex flex-col items-center w-8">
                <img src={game.home.logo.dark} alt={game.home.abbrev} className="w-5 h-5 object-contain drop-shadow-sm" />
                <span className="text-[8px] text-white/70 font-bold leading-none mt-0.5">{game.home.abbrev}</span>
            </div>
        </div>
    );
}

