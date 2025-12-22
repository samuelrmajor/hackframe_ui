import { useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import AccountSettingsView from "./configurations/AccountSettingsView";
import DeviceSettingsView from "./configurations/DeviceSettingsView";
import DisplaySettingsView from "./configurations/DisplaySettingsView";
import WidgetSettingsView from "./configurations/WidgetSettingsView";

type ConfigurationsView = "menu" | "account" | "display" | "widgets" | "device";

export interface ConfigurationsScreenProps {
  session: Session;
  supabase: SupabaseClient;
  onBack?: () => void;
}

export default function ConfigurationsScreen({ session, supabase, onBack }: ConfigurationsScreenProps) {
  const [view, setView] = useState<ConfigurationsView>("menu");

  const userId = session?.user?.id;

  if (view === "account") {
    return (
      <AccountSettingsView
        onBack={() => setView("menu")}
        session={session}
        supabase={supabase}
      />
    );
  }

  if (view === "display") {
    return <DisplaySettingsView onBack={() => setView("menu")} />;
  }

  if (view === "widgets") {
    if (!userId) {
      return (
        <main className="flex-1 min-h-0">
          <div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Widgets</h2>
              <button
                type="button"
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
                onClick={() => setView("menu")}
              >
                Back
              </button>
            </div>
            <div className="text-sm text-red-300">You must be logged in.</div>
          </div>
        </main>
      );
    }

    return (
      <WidgetSettingsView
        onBack={() => setView("menu")}
        supabase={supabase}
        userId={userId}
      />
    );
  }

  if (view === "device") {
    return <DeviceSettingsView onBack={() => setView("menu")} />;
  }

  return (
    <main className="flex-1 min-h-0">
      <div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Configurations</h2>
          {onBack && (
            <button
              type="button"
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
              onClick={onBack}
            >
              Back
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="w-full text-left rounded-xl border border-white/20 bg-white/5 px-4 py-3 hover:bg-white/10"
            onClick={() => setView("account")}
          >
            Account Settings
          </button>
          <button
            type="button"
            className="w-full text-left rounded-xl border border-white/20 bg-white/5 px-4 py-3 hover:bg-white/10"
            onClick={() => setView("display")}
          >
            Display Settings
          </button>
          <button
            type="button"
            className="w-full text-left rounded-xl border border-white/20 bg-white/5 px-4 py-3 hover:bg-white/10"
            onClick={() => setView("widgets")}
          >
            Widgets
          </button>
          <button
            type="button"
            className="w-full text-left rounded-xl border border-white/20 bg-white/5 px-4 py-3 hover:bg-white/10"
            onClick={() => setView("device")}
          >
            Device Settings
          </button>
        </div>
      </div>
    </main>
  );
}
