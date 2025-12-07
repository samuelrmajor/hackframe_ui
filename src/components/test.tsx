// FIX: Add global JSX typing for TS projects without react-jsx runtime
import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
import React from "react";
import { motion } from "framer-motion";

// Framed Info Panel - TypeScript + React single-file component using Tailwind CSS
// Replace mock data with real APIs and wire up as needed.

// -------------------------- Types --------------------------
interface TopBarProps {
  date: string;
  time: string;
  weather: { text: string; temp: number };
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

type DiscordStatus = "online" | "offline" | "idle" | "dnd";

interface DiscordUser {
  avatar: string;
  name: string;
  activity: string;
  status: DiscordStatus;
}

interface FantasyTeam {
  name: string;
  score: number;
}

interface FantasyMatchup {
  league: string;
  weekLabel: string;
  projected: number;
  winProb: number; // 0-100
  home: FantasyTeam;
  away: FantasyTeam;
}

interface SportsGameTeam {
  team: string;
  score: number;
}

interface SportsGame {
  league: string;
  home: SportsGameTeam;
  away: SportsGameTeam;
  status: string;
}

interface WeaponStats {
  name: string;
  stattrak: number;
  trend: "up" | "down";
}

interface MiscData {
  quote: string;
  author: string;
}

interface CalendarEvent {
  title: string;
  time: string;
}

// -------------------------- Small components --------------------------
const TopBar: React.FC<TopBarProps> = ({ date, time, weather }) => {
  return (
    <div className="w-full flex items-center justify-between px-6 py-3 bg-black/30 backdrop-blur-md rounded-2xl">
      <div className="flex items-baseline gap-3">
        <div className="text-sm text-gray-300">{date}</div>
        <div className="text-2xl font-semibold text-white">{time}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-300">{weather.text}</div>
        <div className="text-lg font-medium text-white">{weather.temp}°</div>
      </div>
    </div>
  );
};

const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28 }}
    className={`rounded-2xl p-4 bg-gray-900/60 border border-white/4 shadow-md ${className}`}
  >
    {children}
  </motion.div>
);

// -------------------------- Widgets --------------------------
const DiscordWidget: React.FC<{ user: DiscordUser }> = ({ user }) => (
  <Card>
    <div className="flex items-center gap-4">
      <img src={user.avatar} alt="avatar" className="w-14 h-14 rounded-full ring-2 ring-indigo-500 object-cover" />
      <div>
        <div className="text-white font-semibold truncate">{user.name}</div>
        <div className="text-sm text-gray-400 truncate">{user.activity}</div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span
          className={`w-3 h-3 rounded-full ${
            user.status === "online" ? "bg-green-400" : user.status === "idle" ? "bg-yellow-400" : user.status === "dnd" ? "bg-rose-500" : "bg-gray-500"
          }`}
          title={user.status}
        />
        <div className="text-xs text-gray-400">Discord</div>
      </div>
    </div>
  </Card>
);

const FantasyWidget: React.FC<{ matchup: FantasyMatchup }> = ({ matchup }) => (
  <Card>
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400">{matchup.league}</div>
          <div className="text-sm text-gray-300">{matchup.weekLabel}</div>
        </div>
        <div className="text-sm text-gray-400">Proj: {matchup.projected}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="text-xs text-gray-400">{matchup.home.name}</div>
          <div className="text-3xl font-bold text-white">{matchup.home.score}</div>
        </div>

        <div className="text-sm text-gray-400">vs</div>

        <div className="flex-1 text-right">
          <div className="text-xs text-gray-400">{matchup.away.name}</div>
          <div className="text-3xl font-bold text-white">{matchup.away.score}</div>
        </div>
      </div>

      <div className="w-full h-2 bg-white/6 rounded-full mt-3 overflow-hidden">
        <div style={{ width: `${matchup.winProb}%` }} className="h-2 rounded-full bg-indigo-500 transition-all" />
      </div>
    </div>
  </Card>
);

const SportsScoreWidget: React.FC<{ games: SportsGame[] }> = ({ games }) => (
  <Card>
    <div className="flex flex-col gap-2">
      {games.slice(0, 3).map((g, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-300">{g.league}</div>
            <div className="text-sm truncate">{g.home.team}</div>
          </div>
          <div className="text-lg font-semibold text-white">
            {g.home.score} - {g.away.score}
          </div>
          <div className="text-sm text-gray-400">{g.status}</div>
        </div>
      ))}
    </div>
  </Card>
);

const CS2StatTrakWidget: React.FC<{ weapon: WeaponStats }> = ({ weapon }) => (
  <Card>
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 bg-white/5 rounded-lg flex items-center justify-center">
        {/* Placeholder weapon icon */}
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 12h20" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 6l3 12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-400">{weapon.name}</div>
        <div className="text-4xl font-bold text-white">StatTrak: {weapon.stattrak}</div>
        <div className={`text-sm mt-1 ${weapon.trend === "up" ? "text-green-400" : "text-rose-400"}`}>
          {weapon.trend === "up" ? "↑ Increasing" : "↓ Decreasing"}
        </div>
      </div>
    </div>
  </Card>
);

const MiscWidget: React.FC<{ data: MiscData }> = ({ data }) => (
  <Card>
    <div className="flex flex-col gap-2">
      <div className="text-sm text-gray-400">Daily Quote</div>
      <div className="text-lg font-medium text-white">“{data.quote}”</div>
      <div className="text-xs text-gray-500">— {data.author}</div>
    </div>
  </Card>
);

const MiniCalendar: React.FC<{ events: CalendarEvent[] }> = ({ events }) => {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const today = new Date().getDate();
  return (
    <Card>
      <div className="flex gap-3 flex-col">
        <div className="grid grid-cols-7 gap-1 w-full">
          {days.map((d) => (
            <div key={d} className={`text-xs p-1 rounded ${d === today ? "bg-indigo-600 text-white" : "text-gray-300"}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm text-gray-400">
          <div className="font-medium text-white">Upcoming</div>
          <ul className="mt-2 text-xs space-y-1">
            {events.slice(0, 3).map((e, i) => (
              <li key={i} className="flex justify-between">
                <span className="truncate">{e.title}</span>
                <span className="text-gray-500">{e.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};

// -------------------------- Main Component --------------------------
export default function FramedInfoPanel(): JSX.Element {
  // Mock data: replace with real data or props
  const mock = {
    date: new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    weather: { text: "Clear", temp: 68 },
    discord: {
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=60",
      name: "samuel#1234",
      activity: "Playing CS2",
      status: "online" as DiscordStatus,
    } as DiscordUser,
    fantasy: {
      league: "Fantasy Football",
      weekLabel: "Week 10",
      projected: 124,
      winProb: 67,
      home: { name: "Sam", score: 78 },
      away: { name: "Rival", score: 64 },
    } as FantasyMatchup,
    games: [
      { league: "NBA", home: { team: "LAL", score: 102 }, away: { team: "GSW", score: 99 }, status: "Q4 02:34" },
      { league: "NFL", home: { team: "NE", score: 21 }, away: { team: "MIA", score: 28 }, status: "4th" },
      { league: "EPL", home: { team: "MUN", score: 1 }, away: { team: "CHE", score: 2 }, status: "FT" },
    ] as SportsGame[],
    weapon: { name: "AK-47 | Redline", stattrak: 124, trend: "up" } as WeaponStats,
    misc: { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" } as MiscData,
    events: [
      { title: "Meeting", time: "10:00" },
      { title: "Gym", time: "18:30" },
      { title: "Dinner", time: "20:00" },
    ] as CalendarEvent[],
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-gray-800 p-6">
      <div className="w-[1200px] max-w-full aspect-[16/10] bg-[#0F0F10] rounded-3xl p-6 shadow-2xl border border-white/6">
        {/* Top bar */}
        <div className="mb-4">
          <TopBar date={mock.date} time={mock.time} weather={mock.weather} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-4 h-[calc(100%-76px)]">
          {/* Column 1 */}
          <div className="col-span-1 flex flex-col gap-4">
            <DiscordWidget user={mock.discord} />
            <CS2StatTrakWidget weapon={mock.weapon} />
          </div>

          {/* Column 2 */}
          <div className="col-span-1 flex flex-col gap-4">
            <FantasyWidget matchup={mock.fantasy} />
            <MiscWidget data={mock.misc} />
          </div>

          {/* Column 3 */}
          <div className="col-span-1 flex flex-col gap-4">
            <SportsScoreWidget games={mock.games} />
            <MiniCalendar events={mock.events} />
          </div>
        </div>
      </div>
    </div>
  );
}
