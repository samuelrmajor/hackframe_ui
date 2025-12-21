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

export default function LoggedInHomePage({
  session,
  supabase,
  onLogout,
}: FramedInfoPanelProps) {
  const clickTimesRef = useRef<number[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    // Check if click is in top-left corner (within 100px of top and left)
    if (e.clientX < 100 && e.clientY < 100) {
      const now = Date.now();
      clickTimesRef.current.push(now);

      // Keep only clicks from the last 5 seconds
      clickTimesRef.current = clickTimesRef.current.filter(
        (time) => now - time < 5000
      );

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
      <TopBar zipcode="12210" />
      <main className="grid grid-cols-3 gap-4 flex-1 auto-rows-fr min-h-0">
        <CalendarWidget
          events={[
            { name: "Beanie", month: 1, day: 15, type: "birthday" },
            { name: "Evan", month: 2, day: 20, type: "birthday" },
            { name: "Kevin", month: 5, day: 9, type: "birthday" },
            { name: "Gus", month: 5, day: 30, type: "birthday" },
            { name: "Sam M", month: 6, day: 12, type: "birthday" },
            { name: "Harry", month: 7, day: 1, type: "birthday" },
            { name: "Niko", month: 8, day: 20, type: "birthday" },
            { name: "Taylor", month: 9, day: 27, type: "birthday" },
            { name: "Chase", month: 9, day: 30, type: "birthday" },
            { name: "Jackson", month: 1, day: 18, type: "birthday" },
            { name: "Sam P", month: 2, day: 2, type: "birthday" },
            { name: "Michael", month: 2, day: 20, type: "birthday" },
            { name: "Ido", month: 3, day: 16, type: "birthday" },
            { name: "Bibble", month: 3, day: 20, type: "birthday" },
            { name: "Dave", month: 5, day: 12, type: "birthday" },
            { name: "Mark", month: 10, day: 20, type: "birthday" },
            { name: "Christmas", month: 11, day: 25, type: "holiday" },
            { name: "New Year's Eve", month: 11, day: 31, type: "holiday" },
            { name: "New Year's Day", month: 0, day: 1, type: "holiday" },
            { name: "Valentine's Day", month: 1, day: 14, type: "holiday" },
            { name: "Halloween", month: 9, day: 31, type: "holiday" },
          ]}
        />
        <LocalPhotoWidget session={session} supabase={supabase} />
        <StattrakWidget session={session} supabase={supabase} widgetId={1} />
        <HockeyScoreWidget />
        <DiscordWidget session={session} supabase={supabase} widgetId={1} />
        <MultiLeagueManager
          userId={"997726544653021184"}
          leagueIds={[
            "1264635784598663168",
            "1208435206395011072",
            "1200542341140578304",
          ]}
          disableAnimation={true}
        />
      </main>
    </div>
  );
}
