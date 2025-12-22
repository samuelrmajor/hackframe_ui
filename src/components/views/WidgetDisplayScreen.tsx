import type { Session, SupabaseClient } from "@supabase/supabase-js";
import DiscordWidget from "../widgets/DiscordWidget";
import StattrakWidget from "../widgets/StattrakWidget";
import CalendarWidget from "../widgets/CalenderWidget";
import { MultiLeagueManager } from "../widgets/FantasyWidget/MultiLeagueManager";
import LocalPhotoWidget from "../widgets/UploadedPhotosWidget";
import HockeyScoreWidget from "../widgets/HockeyScoreWidget";
import MiscWidget from "../widgets/MiscWidget";

type UserWidgetRow = {
  id: number;
  widget_title: string | null;
  widget_type: string | null;
  widget_configuration: any | null;
  requires_config?: boolean | null;
};

export interface WidgetDisplayScreenProps {
  session: Session;
  supabase: SupabaseClient;
  widgets: UserWidgetRow[];
  widgetsLoading?: boolean;
  widgetsError?: string | null;
}

export default function WidgetDisplayScreen({
  session,
  supabase,
  widgets,
  widgetsLoading,
  widgetsError,
}: WidgetDisplayScreenProps) {
  const renderWidget = (w: UserWidgetRow) => {
    const type = (w.widget_type ?? "").toString();
    const cfg = (w.widget_configuration ?? {}) as any;

    switch (type) {
      case "calendar":
        return <CalendarWidget events={Array.isArray(cfg.events) ? cfg.events : []} />;
      case "picture_scroller":
        return <LocalPhotoWidget session={session} supabase={supabase} />;
      case "stattrak_tracker":
        return (
          <StattrakWidget
            session={session}
            supabase={supabase}
            steam_asset_id={String(cfg.csgo_item_id ?? "")}
            steam_user_id={String(cfg.steam_user_id ?? "")}
          />
        );
      case "hockey_scoreboard":
        return <HockeyScoreWidget />;
      case "discord_live":
        return (
          <DiscordWidget
            session={session}
            supabase={supabase}
            discord_server_id={String(cfg.discord_server_id ?? "")}
          />
        );
      case "fantasy_football_matchups":
        return (
          <MultiLeagueManager
            userId={String(cfg.sleeper_user_id ?? "")}
            leagueIds={Array.isArray(cfg.sleeper_league_ids) ? cfg.sleeper_league_ids : []}
            disableAnimation={true}
          />
        );
      default:
        return null;
    }
  };

  const hasResolvedWidgets = Array.isArray(widgets) && widgets.length > 0;

  return (
    <main className="grid grid-cols-3 gap-4 flex-1 auto-rows-fr min-h-0">
      {widgetsLoading && <div className="col-span-3 text-sm text-gray-300">Loading widgets...</div>}
      {widgetsError && <div className="col-span-3 text-sm text-red-300">{widgetsError}</div>}

      {!widgetsLoading && !widgetsError && Array.isArray(widgets) && widgets.length === 0 ? (
        <div className="col-span-3">
          <MiscWidget />
        </div>
      ) : hasResolvedWidgets ? (
        widgets.map((w) => {
          const node = renderWidget(w);
          if (!node) return null;
          return <div key={w.id}>{node}</div>;
        })
      ) : (
        <>
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
          <StattrakWidget
            session={session}
            supabase={supabase}
            steam_asset_id={"45575185939"}
            steam_user_id={"76561198084337727"}
          />
          <HockeyScoreWidget />
          <DiscordWidget
            session={session}
            supabase={supabase}
            discord_server_id="434555040997441537"
          />
          <MultiLeagueManager
            userId={"997726544653021184"}
            leagueIds={[
              "1264635784598663168",
              "1208435206395011072",
              "1200542341140578304",
            ]}
            disableAnimation={true}
          />
        </>
      )}
    </main>
  );
}
