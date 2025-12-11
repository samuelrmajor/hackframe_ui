import { useRef } from "react";
// import { motion } from "framer-motion";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import DiscordWidget from "./widgets/DiscordWidget";
import StattrakWidget from "./widgets/StattrakWidget";
// import MiscWidget from "./widgets/MiscWidget";
import CalendarWidget from "./widgets/CalenderWidget";
import TopBar from "./widgets/TopBar";
import { MultiLeagueManager } from "./widgets/FantasyWidget/MultiLeagueManager";
import LocalPhotoWidget from "./widgets/UploadedPhotosWidget";
import HockeyScoreWidget from "./widgets/HockeyScoreWidget";


interface FramedInfoPanelProps {
  session: Session;
  supabase: SupabaseClient;
  onLogout: () => void;
}

export default function LoggedInHomePage({ session, supabase, onLogout }: FramedInfoPanelProps) {
  const clickTimesRef = useRef<number[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    // Check if click is in top-left corner (within 100px of top and left)
    if (e.clientX < 100 && e.clientY < 100) {
      const now = Date.now();
      clickTimesRef.current.push(now);
      
      // Keep only clicks from the last 5 seconds
      clickTimesRef.current = clickTimesRef.current.filter(time => now - time < 5000);
      
      // If 5 clicks within 5 seconds, trigger logout
      if (clickTimesRef.current.length >= 5) {
        clickTimesRef.current = [];
        onLogout();
      }
    }
  };

  return (
    <div 
      className="w-screen h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col p-4"
      onClick={handleClick}
    >
        <TopBar zipcode="12210"/>
      <main className="grid grid-cols-3 gap-4 flex-1 auto-rows-fr min-h-0">
        <CalendarWidget 
          timezone="Pacific/Honolulu"
          birthdays={[
          { name: "Beanie", month: 1, day: 15 },
          { name: "Evan", month: 2, day: 20 },
          { name: "Kevin", month: 5, day: 9 },
          { name: "Gus", month: 5, day: 30 },
          { name: "Sam M", month: 6, day: 12 },
          { name: "Harry", month: 7, day: 1 },
          { name: "Niko", month: 8, day: 20 },
          { name: "Taylor", month: 9, day: 27 },
          { name: "Chase", month: 9, day: 30 },
          { name: "Jackson", month: 1, day: 18 },
          { name: "Sam P", month: 2, day: 2 },
          { name: "Michael", month: 2, day: 20 },
          { name: "Ido", month: 3, day: 16 },
          { name: "Bibble", month: 3, day: 20 },
          { name: "Dave", month: 5, day: 12 },
          { name: "Mark", month: 10, day: 20 },
        ]} />
        <LocalPhotoWidget session={session} supabase={supabase} />
        <StattrakWidget session={session} supabase={supabase} widgetId={1} />
        <HockeyScoreWidget />
        <DiscordWidget session={session} supabase={supabase} widgetId={1}/>
        <MultiLeagueManager userId = {"997726544653021184"} leagueIds={["1264635784598663168", "1208435206395011072", "1200542341140578304"]} />
      </main>
    </div>
  );
}
