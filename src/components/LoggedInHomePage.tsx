import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import DiscordWidget from "./widgets/DiscordWidget";
import StattrakWidget from "./widgets/StattrakWidget";
import MiscWidget from "./widgets/MiscWidget";
import CalendarWidget from "./widgets/CalenderWidget";
import TopBar from "./widgets/TopBar";
import { MultiLeagueManager } from "./widgets/FantasyWidget/MultiLeagueManager";
import ChristmasWidget from "./widgets/ChristmasWidget";
import GooglePhotoWidget from "./widgets/GooglePhotoWidget";


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
        <CalendarWidget />
        <DiscordWidget session={session} supabase={supabase} widgetId={1}/>
        <StattrakWidget session={session} supabase={supabase} widgetId={1} />
        <ChristmasWidget />
        <GooglePhotoWidget albumUrl="https://photos.app.goo.gl/M7LFkN9ie8Nx7Doy7" />
        <MultiLeagueManager userId = {"997726544653021184"} leagueIds={["1264635784598663168", "1208435206395011072", "1200542341140578304"]} />
      </main>
    </div>
  );
}
