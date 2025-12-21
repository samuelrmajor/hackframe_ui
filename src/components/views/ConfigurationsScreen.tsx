import { useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import AccountSettingsView from "./configurations/AccountSettingsView";
import DeviceSettingsView from "./configurations/DeviceSettingsView";
import WidgetSettingsView from "./configurations/WidgetSettingsView";

type ConfigurationsView = "menu" | "account" | "widgets" | "device";

export interface ConfigurationsScreenProps {
  session: Session;
  supabase: SupabaseClient;
  onBack?: () => void;
}

export default function ConfigurationsScreen({ session, supabase, onBack }: ConfigurationsScreenProps) {
  const [view, setView] = useState<ConfigurationsView>("menu");

  if (view === "account") {
    return (
      <AccountSettingsView
        onBack={() => setView("menu")}
        session={session}
        supabase={supabase}
      />
    );
  }

  if (view === "widgets") {
    return <WidgetSettingsView onBack={() => setView("menu")} />;
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
            onClick={() => setView("widgets")}
          >
            Display Settings
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
