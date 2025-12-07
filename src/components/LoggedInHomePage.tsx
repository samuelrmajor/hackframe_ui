import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import DiscordWidget from "./widgets/DiscordWidget";
import FantasyWidget from "./widgets/FantasyWidget";
import SportsWidget from "./widgets/SportsWidget";
import StattrakWidget from "./widgets/StattrakWidget";
import MiscWidget from "./widgets/MiscWidget";
import CalendarWidget from "./widgets/CalenderWidget";
import TopBar from "./widgets/TopBar";


interface FramedInfoPanelProps {
  session: Session;
  supabase: SupabaseClient;
  onLogout: () => void;
}

export default function LoggedInHomePage({ session, supabase, onLogout }: FramedInfoPanelProps) {


  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col p-4">
        <TopBar/>
      <main className="grid grid-cols-3 gap-4 flex-1 auto-rows-fr min-h-0">
        <DiscordWidget supabase={supabase} widgetId={1}/>
        <FantasyWidget />
        <SportsWidget />
        <StattrakWidget supabase={supabase} widgetId={1} />
        <MiscWidget />
        <CalendarWidget />
      </main>
    </div>
  );
}
