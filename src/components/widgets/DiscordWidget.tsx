import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import Card from "./Card";
import DiscordMuteIcon from "./DiscordWidget/DiscordMuteIcon";
import DiscordDeafenIcon from "./DiscordWidget/DiscordDeafenIcon";
import DiscordVideoIcon from "./DiscordWidget/DiscordVideoIcon";
import DiscordLiveIcon from "./DiscordWidget/DiscordLiveIcon";

// Types
interface DiscordUser {
  username: string;
  avatar_url: string;
  muted: boolean;
  deafened: boolean;
  streaming: boolean;
  videoOn: boolean;
}

interface DiscordServer {
  name: string;
  users: DiscordUser[];
}

interface DiscordWidgetProps {
  session: Session;
  supabase: SupabaseClient;
  widgetId?: number;
}

export default function DiscordWidget({ session,supabase, widgetId }: DiscordWidgetProps) {
  const [discord_data, setDiscordData] = useState<DiscordServer[] | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupRealtime = async () => {
      // Fetch initial row from table `widget_discord`
      try {
        const { data, error } = await supabase
          .from("widget_discord")
          .select("*")
          .eq("id", widgetId)
          .maybeSingle();

        if (error) {
          console.error("Failed to fetch widget_discord row:", error);
        } else {
          setDiscordData(data?.discord_details ?? null);
        }
      } catch (err) {
        console.error("Error fetching widget_discord row:", err);
      }

      // then set up realtime
      try {
        await supabase.realtime.setAuth(session.access_token); // Needed for Realtime Authorization
        const channel = supabase
          .channel(`widget_discord:${widgetId}:update`, {
            config: { private: true },
          })
          .on("broadcast", { event: "discord_update" }, (payload) => {
            if (payload.payload?.record?.discord_details) {
              setDiscordData(payload.payload.record.discord_details);
            }
          })
          .subscribe();

        cleanup = () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error("DiscordWidget realtime setup failed:", err);
      }
    };

    setupRealtime();

    return () => {
      if (cleanup) cleanup();
    };
  }, [supabase, widgetId]);

  return (
    <Card centered={false}>
      {/* Render voice channel style UI */}
      {discord_data && discord_data.length > 0 ? (
        <div className="flex flex-col">
          {discord_data.map((server) => (
            <div key={server.name} className="p-2">
              <div className="text-xs text-gray-400 font-semibold mb-1">{server.name}</div>
              <div>
                {server.users.map((user) => (
                  <div key={user.username} className="flex items-center gap-3 py-1">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex flex-col">
                      <div className="text-sm">{user.username}</div>
                    </div>

                    {/* Status indicators */}
                    <div className="ml-auto flex gap-2 items-center">
                      {user.muted && (
                        <div title="Muted">
                          <DiscordMuteIcon />
                        </div>
                      )}
                      {user.deafened && (
                        <div title="Deafened">
                          <DiscordDeafenIcon />
                        </div>
                      )}
                      {user.videoOn && (
                        <div title="Video">
                          <DiscordVideoIcon />
                        </div>
                      )}
                      {user.streaming && (
                        <DiscordLiveIcon />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2 text-sm text-gray-400">No users in voice channels</div>
      )}
    </Card>
  );
}

