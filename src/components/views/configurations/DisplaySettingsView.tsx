import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface DisplaySettingsViewProps {
  onBack: () => void;
  supabase: SupabaseClient;
  userId: string;
}

type LayoutType = "six_tile_grid";

type DisplaySettingsDraft = {
  layout: {
    type: LayoutType;
  };
};

type UserWidgetRow = {
  id: number;
  widget_title: string | null;
  widget_type: string | null;
  widget_configuration: any | null;
  requires_config: boolean | null;
};

const LAYOUT_OPTIONS = [{ label: "6 Card", value: "six_tile_grid" as const, widgets: 6 }];

const SENTINEL_EMPTY = -1;

const normalizeWidgetIds = (raw: unknown): number[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === "string" ? Number(x) : (x as any)))
    .filter((x) => typeof x === "number" && Number.isFinite(x));
};

export default function DisplaySettingsView({ onBack, supabase, userId }: DisplaySettingsViewProps) {
  const [draft, setDraft] = useState<DisplaySettingsDraft>({
    layout: { type: "six_tile_grid" },
  });

  const [allWidgets, setAllWidgets] = useState<UserWidgetRow[]>([]);
  const [panelWidgetIds, setPanelWidgetIds] = useState<number[]>([]);
  const [userDisplayId, setUserDisplayId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const layoutOptions = useMemo(() => LAYOUT_OPTIONS, []);
  const currentLayout = useMemo(
    () => layoutOptions.find((o) => o.value === draft.layout.type) ?? layoutOptions[0],
    [draft.layout.type, layoutOptions]
  );
  const maxPanels = currentLayout.widgets;

  const widgetById = useMemo(() => {
    const m = new Map<number, UserWidgetRow>();
    for (const w of allWidgets) m.set(w.id, w);
    return m;
  }, [allWidgets]);

  const panelWidgets = useMemo(() => {
    return panelWidgetIds.map((id) => widgetById.get(id)).filter(Boolean) as UserWidgetRow[];
  }, [panelWidgetIds, widgetById]);

  const availableToAdd = useMemo(() => {
    const selected = new Set(panelWidgetIds);
    return allWidgets.filter((w) => !selected.has(w.id));
  }, [allWidgets, panelWidgetIds]);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [displayRes, widgetsRes] = await Promise.all([
        supabase
          .from("user_display")
          .select("id,layout_setting,widget_ids")
          .eq("user_id", userId)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_widget")
          .select("id,widget_title,widget_type,widget_configuration,requires_config")
          .eq("user_id", userId)
          .order("id", { ascending: true }),
      ]);

      if (displayRes.error) throw displayRes.error;
      if (widgetsRes.error) throw widgetsRes.error;

      setUserDisplayId((displayRes.data as any)?.id ?? null);

      const widgets = (widgetsRes.data ?? []) as UserWidgetRow[];
      setAllWidgets(widgets);

      const savedIds = normalizeWidgetIds(displayRes.data?.widget_ids);

      // If user explicitly saved "empty", represent it as [-1]
      let idsToApply: number[];
      if (savedIds.length === 1 && savedIds[0] === SENTINEL_EMPTY) {
        idsToApply = [SENTINEL_EMPTY];
      } else {
        // keep only ids that still exist
        const existingIds = new Set(widgets.map((w) => w.id));
        const filteredIds = Array.from(new Set(savedIds)).filter((id) => existingIds.has(id));

        // if no saved config yet, default to first N widgets
        idsToApply =
          filteredIds.length > 0
            ? filteredIds.slice(0, maxPanels)
            : widgets.slice(0, maxPanels).map((w) => w.id);
      }

      setPanelWidgetIds(idsToApply);

      // Best-effort hydrate layout selection from layout_setting (if present and compatible)
      const layoutSetting = (displayRes.data?.layout_setting ?? null) as any;
      const layoutType = layoutSetting?.widget_settings?.layout?.type;
      if (layoutType === "six_tile_grid") {
        setDraft({ layout: { type: layoutType } });
      }

      console.log("[DisplaySettingsView] loaded panel widgets:", idsToApply);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Enforce maxPanels when layout changes
  useEffect(() => {
    setPanelWidgetIds((cur) => cur.slice(0, maxPanels));
  }, [maxPanels]);

  const persist = async () => {
    setSaving(true);
    setSaveError(null);

    const cleaned = (panelWidgetIds ?? []).filter((id) => id !== SENTINEL_EMPTY);
    const paddedToSave = Array.from({ length: maxPanels }, (_, i) => cleaned[i] ?? SENTINEL_EMPTY);

    const payload = {
      user_id: userId,
      widget_ids: paddedToSave.map(String),
      layout_setting: {
        widget_settings: {
          layout: {
            type: draft.layout.type,
          },
        },
      },
    };

    try {
      console.log("[DisplaySettingsView] saving user_display", {
        userDisplayId,
        payload,
      });

      if (userDisplayId != null) {
        // Update exactly one row, by id.
        const updateByIdRes = await supabase
          .from("user_display")
          .update({
            widget_ids: payload.widget_ids,
            layout_setting: payload.layout_setting,
          })
          .eq("id", userDisplayId)
          .select("id")
          .maybeSingle();

        console.log("[DisplaySettingsView] user_display update-by-id response", {
          data: updateByIdRes.data,
          error: updateByIdRes.error,
          status: (updateByIdRes as any).status,
          statusText: (updateByIdRes as any).statusText,
        });

        if (updateByIdRes.error) throw updateByIdRes.error;
      } else {
        // No row found in load(). Before inserting, check if multiple rows exist.
        const checkRes = await supabase
          .from("user_display")
          .select("id")
          .eq("user_id", userId)
          .order("id", { ascending: false });

        if (checkRes.error) throw checkRes.error;

        const rows = (checkRes.data ?? []) as Array<{ id: number }>;
        if (rows.length >= 1) {
          // If there are rows, update the newest one instead of inserting another duplicate.
          const targetId = rows[0].id;
          setUserDisplayId(targetId);

          const updateNewestRes = await supabase
            .from("user_display")
            .update({
              widget_ids: payload.widget_ids,
              layout_setting: payload.layout_setting,
            })
            .eq("id", targetId)
            .select("id")
            .maybeSingle();

          console.log("[DisplaySettingsView] user_display update-newest response", {
            targetId,
            data: updateNewestRes.data,
            error: updateNewestRes.error,
            status: (updateNewestRes as any).status,
          });

          if (updateNewestRes.error) throw updateNewestRes.error;
        } else {
          // Truly no row exists -> insert
          const insertRes = await supabase.from("user_display").insert(payload).select("id").maybeSingle();

          console.log("[DisplaySettingsView] user_display insert response", {
            data: insertRes.data,
            error: insertRes.error,
            status: (insertRes as any).status,
            statusText: (insertRes as any).statusText,
          });

          if (insertRes.error) throw insertRes.error;
          setUserDisplayId((insertRes.data as any)?.id ?? null);
        }
      }

      // Refresh local view of which row we're editing.
      await load();
    } catch (e) {
      console.error("[DisplaySettingsView] save failed", {
        userDisplayId,
        payload,
        error: e,
      });
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    setPanelWidgetIds((cur) => {
      const next = [...cur];
      const j = index + dir;
      if (j < 0 || j >= next.length) return cur;
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return next;
    });
  };

  const removeAt = (index: number) => {
    setPanelWidgetIds((cur) => cur.filter((_, i) => i !== index));
  };

  const addWidget = (id: number) => {
    setPanelWidgetIds((cur) => {
      const base = cur.length === 1 && cur[0] === SENTINEL_EMPTY ? [] : cur;
      if (base.includes(id)) return base;
      if (base.length >= maxPanels) return base;
      return [...base, id];
    });
  };

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

        {loading && <div className="text-sm text-gray-300">Loading...</div>}
        {error && <div className="text-sm text-red-300">{error}</div>}

        {!loading && !error && (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">Layout</h3>
              <select
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                value={draft.layout.type}
                onChange={(e) =>
                  setDraft({
                    layout: {
                      type: e.target.value as LayoutType,
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

              <div className="mt-2 text-xs text-gray-400">Max widgets for this layout: {maxPanels}</div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Panels</h3>
                <button
                  type="button"
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 hover:bg-white/10 disabled:opacity-50"
                  disabled={saving}
                  onClick={persist}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              {saveError && <div className="mb-2 text-sm text-red-300">{saveError}</div>}

              <div className="text-sm text-gray-300 mb-3">
                Showing {panelWidgets.length}/{maxPanels}
              </div>

              <div className="space-y-2">
                {panelWidgetIds.length === 1 && panelWidgetIds[0] === SENTINEL_EMPTY ? (
                  <div className="text-sm text-gray-400">No widgets selected (will show MiscWidget).</div>
                ) : panelWidgets.length === 0 ? (
                  <div className="text-sm text-gray-400">No widgets selected.</div>
                ) : (
                  panelWidgets.map((w, idx) => (
                    <div
                      key={w.id}
                      className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{w.widget_title ?? "(untitled)"}</div>
                        <div className="text-xs text-gray-400 truncate">{w.widget_type ?? "(unknown type)"} • id {w.id}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 hover:bg-white/10 disabled:opacity-50"
                          disabled={idx === 0}
                          onClick={() => move(idx, -1)}
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 hover:bg-white/10 disabled:opacity-50"
                          disabled={idx === panelWidgets.length - 1}
                          onClick={() => move(idx, 1)}
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 hover:bg-white/10"
                          onClick={() => removeAt(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 rounded-xl border border-white/20 bg-white/5 p-3">
                <div className="text-sm font-semibold mb-2">Add widget</div>
                {panelWidgetIds.length >= maxPanels && !(panelWidgetIds.length === 1 && panelWidgetIds[0] === SENTINEL_EMPTY) ? (
                  <div className="text-xs text-gray-400">Layout is full. Remove a widget to add another.</div>
                ) : availableToAdd.length === 0 ? (
                  <div className="text-xs text-gray-400">No additional widgets available.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {availableToAdd.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        className="text-left rounded-lg border border-white/20 bg-white/5 px-3 py-2 hover:bg-white/10 disabled:opacity-50"
                        disabled={(panelWidgetIds.length === 1 && panelWidgetIds[0] === SENTINEL_EMPTY)
                          ? false
                          : panelWidgetIds.length >= maxPanels}
                        onClick={() => addWidget(w.id)}
                      >
                        <div className="font-semibold">{w.widget_title ?? "(untitled)"}</div>
                        <div className="text-xs text-gray-400">{w.widget_type} • id {w.id}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Temporary debug */}
              <div className="mt-3 text-xs text-gray-400">
                Pending ids: {JSON.stringify(panelWidgetIds)}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
