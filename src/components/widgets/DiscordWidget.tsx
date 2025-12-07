import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import Card from "./Card";

// Types
interface DiscordUser {
  username: string;
  avatar_url: string;
  muted: boolean;
  deafened: boolean;
  streaming: boolean;
}

interface DiscordServer {
  name: string;
  users: DiscordUser[];
}

interface DiscordWidgetProps {
  supabase: SupabaseClient;
  widgetId?: number;
}

export default function DiscordWidget({ supabase, widgetId = 1 }: DiscordWidgetProps) {
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
        await supabase.realtime.setAuth(); // Needed for Realtime Authorization
        const channel = supabase
          .channel(`id:${widgetId}`, {
            config: { private: true },
          })
          .on("broadcast", { event: "UPDATE" }, (payload) => {
            console.log("Discord UPDATE", payload);
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
    <Card>
      {/* Render voice channel style UI */}
      {discord_data && discord_data.length > 0 ? (
        discord_data.map((server) => (
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
                    {user.streaming && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-600 rounded text-white text-xs font-semibold" title="Streaming">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M2 0L0 4v11h5v1h11v-1h-1V4L13 0H2zm11 14H3V5h10v9zM8 6l-4 3h2v3l4-3h-2V6z"/>
                        </svg>
                        LIVE
                      </div>
                    )}
                    {user.muted && (
                      <div title="Muted">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                          <path d="M6.7 11H5C5 12.19 5.34 13.3 5.9 14.28L7.13 13.05C6.86 12.43 6.7 11.74 6.7 11Z"/>
                          <path d="M9.01 11.085c0 .163.013.325.038.486L12 8.62V5c0-1.66-1.34-3-3-3S6 3.34 6 5v.34l3.01 3.01v2.735z"/>
                          <path d="M11.7237 16.0927L10.9632 16.8531L10.2533 17.563C10.4978 17.5878 10.7461 17.6 11 17.6C13.67 17.6 15.84 15.51 15.98 12.88L15.99 12.69V11H17.7C17.7 14.42 14.92 17.19 11.5 17.19C11.2412 17.19 10.9844 17.1784 10.7299 17.1555L11.7237 16.0927Z"/>
                          <path d="M21 21.07L3 3.07L1.93 4.14L6.7 8.91V11c0 2.76 2.24 5 5 5 .34 0 .67-.05 1-.13l1.49 1.49c-.84.28-1.73.43-2.64.43-4.42 0-8-3.58-8-8h1.7c0 3.47 2.83 6.3 6.3 6.3.6 0 1.17-.09 1.72-.24L19.86 22.07 21 21.07Z"/>
                        </svg>
                      </div>
                    )}
                    {user.deafened && (
                      <div title="Deafened">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                          <path d="M6.16204 15.0065C6.10859 15.0022 6.05455 15 6 15H4V12C4 7.588 7.589 4 12 4C13.4809 4 14.8691 4.40439 16.0599 5.10859L17.5102 3.65835C15.9292 2.61064 14.0346 2 12 2C6.486 2 2 6.485 2 12V19.1685L6.16204 15.0065Z"/>
                          <path d="M19.725 9.91686C19.9043 10.5813 20 11.2796 20 12V15H18C16.896 15 16 15.896 16 17V20C16 21.104 16.896 22 18 22H20C21.105 22 22 21.104 22 20V12C22 10.7075 21.7536 9.47149 21.3053 8.33658L19.725 9.91686Z"/>
                          <path d="M3.70711 2.29289L2.29289 3.70711L21.2929 22.7071L22.7071 21.2929L3.70711 2.29289Z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="p-2 text-sm text-gray-400">No users in voice channels</div>
      )}
    </Card>
  );
}

