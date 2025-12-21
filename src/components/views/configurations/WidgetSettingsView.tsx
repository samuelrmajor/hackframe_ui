import { useMemo, useState } from "react";

export interface WidgetSettingsViewProps {
  onBack: () => void;
}

type LayoutType = "six_tile_grid";

type WidgetSettingsDraft = {
  widget_settings: {
    layout: {
      type: LayoutType;
    };
  };
};

export default function WidgetSettingsView({ onBack }: WidgetSettingsViewProps) {
  const [draft, setDraft] = useState<WidgetSettingsDraft>({
    widget_settings: {
      layout: {
        type: "six_tile_grid",
      },
    },
  });

  const layoutOptions = useMemo(
    () => [{ label: "6 Card", value: "six_tile_grid" as const }],
    []
  );

  return (
    <main className="flex-1 min-h-0">
      <div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Display Settings</h2>
          <button
            type="button"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
            onClick={onBack}
          >
            Back
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">Layout</h3>
            <select
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
              value={draft.widget_settings.layout.type}
              onChange={(e) =>
                setDraft({
                  widget_settings: {
                    layout: {
                      type: e.target.value as LayoutType,
                    },
                  },
                })
              }
            >
              {layoutOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Temporary debug until persistence is wired */}
            <div className="mt-3 text-xs text-gray-400">
              Pending config: {JSON.stringify(draft)}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
