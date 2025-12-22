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

type UserWidgetRow = {
  id: number;
  widget_title: string | null;
  widget_type: string | null;
  widget_configuration: any | null;
  requires_config: boolean | null;
};

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

  const [widgets, setWidgets] = useState<UserWidgetRow[]>([]);
  const [widgetIds, setWidgetIds] = useState<number[]>([]);
  const [widgetsLoading, setWidgetsLoading] = useState(false);
  const [widgetsError, setWidgetsError] = useState<string | null>(null);
  const [userZip, setUserZip] = useState<string | null>(null);

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
      setWidgetsLoading(true);
      setWidgetsError(null);

      try {
        const [displayRes, widgetsRes] = await Promise.all([
          supabase
            .from("user_display")
            .select("layout_setting,widget_ids,user_zip")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("user_widget")
            .select("id,widget_title,widget_type,widget_configuration,requires_config")
            .eq("user_id", userId),
        ]);

        if (cancelled) return;

        if (displayRes.error) {
          console.error("[supabase] user_display error", displayRes.error);
          setWidgetsError(displayRes.error.message);
          return;
        }

        if (widgetsRes.error) {
          console.error("[supabase] user_widget error", widgetsRes.error);
          setWidgetsError(widgetsRes.error.message);
          return;
        }

        const rawWidgetIds = (displayRes.data?.widget_ids ?? []) as unknown;
        const normalizedWidgetIds: number[] = Array.isArray(rawWidgetIds)
          ? rawWidgetIds
              .map((x) => (typeof x === "string" ? Number(x) : (x as any)))
              .filter((x) => typeof x === "number" && Number.isFinite(x))
          : [];

        setUserZip(displayRes.data?.user_zip ?? null);

        // Sentinel -1 means "intentionally empty"
        const widgetIdsUnique = Array.from(new Set(normalizedWidgetIds));
        const isAllEmpty =
          widgetIdsUnique.length === 1 && widgetIdsUnique[0] === -1;

        if (isAllEmpty) {
          setWidgetIds([]);
          setWidgets([]);
          return;
        }

        const widgetRows = (widgetsRes.data ?? []) as UserWidgetRow[];
        const widgetById = new Map<number, UserWidgetRow>();
        for (const w of widgetRows) widgetById.set(w.id, w);

        const orderedWidgets = widgetIdsUnique
          .map((id) => widgetById.get(id))
          .filter(Boolean) as UserWidgetRow[];

        setWidgetIds(widgetIdsUnique);
        setWidgets(orderedWidgets);
      } catch (err) {
        if (!cancelled) {
          console.error("[supabase] loadUserConfig unexpected error", err);
          setWidgetsError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setWidgetsLoading(false);
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
            widgetIds={widgetIds}
            onBack={() => setRoute("menu")}
          />
        );
      case "widgets":
      default:
        return (
          <WidgetDisplayScreen
            session={session}
            supabase={supabase}
            widgets={widgets}
            widgetsLoading={widgetsLoading}
            widgetsError={widgetsError}
          />
        );
    }
  };

  return (
    <div
      className="w-screen h-screen bg-linear-to-br from-gray-900 to-black text-white flex flex-col p-4"
      onClick={handleClick}
    >
      <TopBar
        zipcode={userZip ?? ""}
        showSettingsButton={showSettingsButton}
        onSettingsClick={() => setRoute("menu")}
        onTopBarClick={revealSettingsTemporarily}
      />
      {renderRoute()}
    </div>
  );
}
