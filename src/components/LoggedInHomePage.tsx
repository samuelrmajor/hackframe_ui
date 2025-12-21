import { useRef, useState, useEffect } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import TopBar from "./widgets/TopBar";
import WidgetDisplayScreen from "./views/WidgetDisplayScreen";
import MenuScreen, { type LoggedInHomeRoute } from "./views/MenuScreen";
import ConfigurationsScreen from "./views/ConfigurationsScreen";

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
  const [route, setRoute] = useState<LoggedInHomeRoute>("widgets");
  const [isDesktopLike, setIsDesktopLike] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia?.("(min-width: 1300px)")?.matches ?? true;
  });

  const [settingsTemporarilyVisible, setSettingsTemporarilyVisible] = useState(false);
  const settingsRevealTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1300px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktopLike(e.matches);

    // Init + subscribe
    setIsDesktopLike(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    return () => {
      if (settingsRevealTimeoutRef.current !== null) {
        window.clearTimeout(settingsRevealTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const userId = session?.user?.id;
    if (!userId) return;

    const loadUserConfig = async () => {
      try {
        const [displayRes, widgetsRes] = await Promise.all([
          supabase
            .from("user_display")
            .select("layout_setting,widget_ids")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("user_widget")
            .select("id,widget_title,widget_configuration")
            .eq("user_id", userId),
        ]);

        if (cancelled) return;

        if (displayRes.error) {
          console.error("[supabase] user_display error", displayRes.error);
        } else {
          console.log("[supabase] user_display", displayRes.data);
        }

        if (widgetsRes.error) {
          console.error("[supabase] user_widget error", widgetsRes.error);
        } else {
          console.log("[supabase] user_widget", widgetsRes.data);
        }
      } catch (err) {
        if (!cancelled) console.error("[supabase] loadUserConfig unexpected error", err);
      }
    };

    loadUserConfig();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, supabase]);

  const revealSettingsTemporarily = () => {
    setSettingsTemporarilyVisible(true);
    if (settingsRevealTimeoutRef.current !== null) {
      window.clearTimeout(settingsRevealTimeoutRef.current);
    }
    settingsRevealTimeoutRef.current = window.setTimeout(() => {
      setSettingsTemporarilyVisible(false);
      settingsRevealTimeoutRef.current = null;
    }, 7000);
  };

  const showSettingsButton = isDesktopLike || settingsTemporarilyVisible;

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

  const renderRoute = () => {
    switch (route) {
      case "menu":
        return <MenuScreen onSelect={setRoute} allowConfigurations={true} />;
      case "configurations":
        return (
          <ConfigurationsScreen
            session={session}
            supabase={supabase}
            onBack={() => setRoute("menu")}
          />
        );
      case "widgets":
      default:
        return <WidgetDisplayScreen session={session} supabase={supabase} />;
    }
  };

  return (
    <div
      className="w-screen h-screen bg-linear-to-br from-gray-900 to-black text-white flex flex-col p-4"
      onClick={handleClick}
    >
      <TopBar
        zipcode="12210"
        showSettingsButton={showSettingsButton}
        onSettingsClick={() => setRoute("menu")}
        onTopBarClick={revealSettingsTemporarily}
      />
      {renderRoute()}
    </div>
  );
}
