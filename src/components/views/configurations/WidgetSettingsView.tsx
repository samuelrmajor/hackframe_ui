import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface WidgetSettingsViewProps {
  onBack: () => void;
  supabase: SupabaseClient;
  userId: string;
}

type UserWidgetRow = {
  id: number;
  widget_title: string | null;
  widget_type: string | null;
  widget_configuration: any | null;
  requires_config: boolean | null;
};

type WidgetId =
  | "discord_live"
  | "fantasy_football_matchups"
  | "calendar"
  | "hockey_scoreboard"
  | "stattrak_tracker"
  | "picture_scroller";

type WidgetDefinition<TConfig = unknown> = {
  id: WidgetId;
  title: string;
  description?: string;
  requiresConfiguration: boolean;
  defaultConfigurations: TConfig;
};

type ConfigFieldType = "text" | "string_array" | "calendar_events";

type ConfigFieldDef = {
  key: string;
  label: string;
  type: ConfigFieldType;
  required?: boolean;
  placeholder?: string;
};

type WidgetDefinitionWithSchema<TConfig = unknown> = WidgetDefinition<TConfig> & {
  configSchema: ConfigFieldDef[];
};

const WIDGET_DEFINITIONS: Record<WidgetId, WidgetDefinitionWithSchema> = {
  discord_live: {
    id: "discord_live",
    title: "Discord Server Live Status",
    description: "",
    requiresConfiguration: true,
    defaultConfigurations: {
      discord_server_id: "your_discord_server_id_here",
    },
    configSchema: [
      {
        key: "discord_server_id",
        label: "Discord Server ID",
        type: "text",
        required: true,
        placeholder: "your_discord_server_id_here",
      },
    ],
  },
  fantasy_football_matchups: {
    id: "fantasy_football_matchups",
    title: "Fantasy Football Matchups",
    description: "",
    requiresConfiguration: true,
    defaultConfigurations: {
      sleeper_user_id: "your_sleeper_user_id_here",
      sleeper_league_ids: ["your_sleeper_league_id_here"],
    },
    configSchema: [
      {
        key: "sleeper_user_id",
        label: "Sleeper User ID",
        type: "text",
        required: true,
        placeholder: "your_sleeper_user_id_here",
      },
      {
        key: "sleeper_league_ids",
        label: "Sleeper League IDs",
        type: "string_array",
        required: true,
        placeholder: "comma separated league ids",
      },
    ],
  },
  calendar: {
    id: "calendar",
    title: "Calendar",
    description: "",
    requiresConfiguration: true,
    defaultConfigurations: {
      events: [
        { name: "Beanie", month: 1, day: 15, type: "birthday" },
        { name: "Evan", month: 2, day: 20, type: "birthday" },
      ],
    },
    configSchema: [
      {
        key: "events",
        label: "Events (JSON)",
        type: "calendar_events",
        required: true,
        placeholder: "[{...}]",
      },
    ],
  },
  hockey_scoreboard: {
    id: "hockey_scoreboard",
    title: "NHL Scoreboard",
    description: "",
    requiresConfiguration: false,
    defaultConfigurations: {},
    configSchema: [],
  },
  stattrak_tracker: {
    id: "stattrak_tracker",
    title: "StatTrak Tracker",
    description: "",
    requiresConfiguration: true,
    defaultConfigurations: {
      steam_user_id: "your_steam_user_id_here",
      csgo_item_id: "your_csgo_item_id_here",
    },
    configSchema: [
      {
        key: "steam_user_id",
        label: "Steam User ID",
        type: "text",
        required: true,
        placeholder: "your_steam_user_id_here",
      },
      {
        key: "csgo_item_id",
        label: "CSGO Item ID",
        type: "text",
        required: true,
        placeholder: "your_csgo_item_id_here",
      },
    ],
  },
  picture_scroller: {
    id: "picture_scroller",
    title: "Picture Scroller",
    description: "",
    requiresConfiguration: true,
    defaultConfigurations: {},
    configSchema: [],
  },
};

const AVAILABLE_WIDGETS = Object.values(WIDGET_DEFINITIONS);

type WidgetFormMode =
  | { mode: "create"; widget: WidgetDefinitionWithSchema }
  | { mode: "edit"; widget: WidgetDefinitionWithSchema; row: UserWidgetRow };

export default function WidgetSettingsView({ onBack, supabase, userId }: WidgetSettingsViewProps) {
  const [userWidgets, setUserWidgets] = useState<UserWidgetRow[] | null>(null);
  const [userWidgetsError, setUserWidgetsError] = useState<string | null>(null);
  const [userWidgetsLoading, setUserWidgetsLoading] = useState(false);
  const [deletingWidgetId, setDeletingWidgetId] = useState<number | null>(null);

  const [configureNewStep, setConfigureNewStep] = useState<"closed" | "pick" | "form">(
    "closed"
  );
  const [selectedWidget, setSelectedWidget] = useState<WidgetDefinitionWithSchema | null>(null);
  const [newWidgetTitle, setNewWidgetTitle] = useState<string>("");
  const [creatingWidget, setCreatingWidget] = useState(false);
  const [createWidgetError, setCreateWidgetError] = useState<string | null>(null);
  const [widgetForm, setWidgetForm] = useState<WidgetFormMode | null>(null);
  const [widgetConfigDraft, setWidgetConfigDraft] = useState<Record<string, any>>({});
  const [widgetConfigJsonDraft, setWidgetConfigJsonDraft] = useState<string>("");
  const [savingWidgetConfig, setSavingWidgetConfig] = useState(false);
  const [saveWidgetConfigError, setSaveWidgetConfigError] = useState<string | null>(null);

  const resetNewWidgetFlow = () => {
    setConfigureNewStep("closed");
    setSelectedWidget(null);
    setNewWidgetTitle("");
    setCreateWidgetError(null);
    setCreatingWidget(false);
    setWidgetForm(null);
    setWidgetConfigDraft({});
    setWidgetConfigJsonDraft("");
    setSaveWidgetConfigError(null);
    setSavingWidgetConfig(false);
  };

  const loadUserWidgets = async () => {
    setUserWidgetsLoading(true);
    setUserWidgetsError(null);
    try {
      const res = await supabase
        .from("user_widget")
        .select("id,widget_title,widget_type,widget_configuration,requires_config")
        .eq("user_id", userId)
        .order("id", { ascending: true });

      if (res.error) {
        setUserWidgets(null);
        setUserWidgetsError(res.error.message);
      } else {
        setUserWidgets((res.data ?? []) as UserWidgetRow[]);
      }
    } catch (e) {
      setUserWidgets(null);
      setUserWidgetsError(e instanceof Error ? e.message : String(e));
    } finally {
      setUserWidgetsLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await loadUserWidgets();
    };

    run();
  }, [userId]);

  const onClickConfigureNew = () => {
    setCreateWidgetError(null);
    setSelectedWidget(null);
    setNewWidgetTitle("");
    setConfigureNewStep((prev) => (prev === "closed" ? "pick" : "closed"));
  };

  const openCreateForm = (w: WidgetDefinitionWithSchema) => {
    setSelectedWidget(w);
    setNewWidgetTitle(w.title);
    setWidgetForm({ mode: "create", widget: w });
    setWidgetConfigDraft({ ...(w.defaultConfigurations as any) });
    setWidgetConfigJsonDraft(
      w.configSchema.some((f) => f.type === "calendar_events")
        ? JSON.stringify((w.defaultConfigurations as any)?.events ?? [], null, 2)
        : ""
    );
    setSaveWidgetConfigError(null);
    setConfigureNewStep("form");
  };

  const openEditForm = (row: UserWidgetRow) => {
    const id = row.widget_type as WidgetId;
    const def = WIDGET_DEFINITIONS[id];
    if (!def) {
      setUserWidgetsError(`Unknown widget_type: ${row.widget_type}`);
      return;
    }

    setWidgetForm({ mode: "edit", widget: def, row });
    setSelectedWidget(def);
    setNewWidgetTitle(row.widget_title ?? def.title);
    const existingCfg = (row.widget_configuration ?? def.defaultConfigurations ?? {}) as any;
    setWidgetConfigDraft({ ...existingCfg });
    setWidgetConfigJsonDraft(
      def.configSchema.some((f) => f.type === "calendar_events")
        ? JSON.stringify(existingCfg?.events ?? [], null, 2)
        : ""
    );
    setSaveWidgetConfigError(null);
    setConfigureNewStep("form");
  };

  const parseAndValidateConfig = (def: WidgetDefinitionWithSchema): { ok: true; cfg: any } | { ok: false; error: string } => {
    const cfg: any = { ...widgetConfigDraft };

    for (const field of def.configSchema) {
      if (field.type === "string_array") {
        const raw = cfg[field.key];
        if (Array.isArray(raw)) {
          // ok
        } else if (typeof raw === "string") {
          cfg[field.key] = raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          cfg[field.key] = [];
        }
      }

      if (field.type === "calendar_events") {
        try {
          const parsed = JSON.parse(widgetConfigJsonDraft || "[]");
          cfg[field.key] = parsed;
        } catch {
          return { ok: false, error: "Events must be valid JSON." };
        }
      }

      if (field.required) {
        const v = cfg[field.key];
        const empty =
          v == null ||
          (typeof v === "string" && v.trim() === "") ||
          (Array.isArray(v) && v.length === 0);
        if (empty) return { ok: false, error: `${field.label} is required.` };
      }
    }

    return { ok: true, cfg };
  };

  const saveWidgetForm = async () => {
    if (!widgetForm) return;

    setSavingWidgetConfig(true);
    setSaveWidgetConfigError(null);

    const parsed = parseAndValidateConfig(widgetForm.widget);
    if (!parsed.ok) {
      setSaveWidgetConfigError(parsed.error);
      setSavingWidgetConfig(false);
      return;
    }

    const payloadBase = {
      widget_title: newWidgetTitle.trim(),
      widget_type: widgetForm.widget.id,
      widget_configuration: parsed.cfg,
      requires_config: widgetForm.widget.requiresConfiguration,
    };

    try {
      if (widgetForm.mode === "create") {
        if (!payloadBase.widget_title) {
          setSaveWidgetConfigError("Widget Title is required.");
          return;
        }

        const res = await supabase.from("user_widget").insert({
          user_id: userId,
          ...payloadBase,
        });
        if (res.error) {
          setSaveWidgetConfigError(res.error.message);
          return;
        }
      } else {
        const res = await supabase
          .from("user_widget")
          .update(payloadBase)
          .eq("id", widgetForm.row.id)
          .eq("user_id", userId);
        if (res.error) {
          setSaveWidgetConfigError(res.error.message);
          return;
        }
      }

      setWidgetForm(null);
      setConfigureNewStep("closed");
      await loadUserWidgets();
    } catch (e) {
      setSaveWidgetConfigError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingWidgetConfig(false);
    }
  };

  const deleteWidget = async (id: number) => {
    const ok = window.confirm("Delete this widget? This cannot be undone.");
    if (!ok) return;

    setDeletingWidgetId(id);
    setUserWidgetsError(null);

    try {
      const res = await supabase
        .from("user_widget")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (res.error) {
        setUserWidgetsError(res.error.message);
        return;
      }

      await loadUserWidgets();
    } catch (e) {
      setUserWidgetsError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingWidgetId((cur) => (cur === id ? null : cur));
    }
  };

  return (
    <main className="flex-1 min-h-0">
      <div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Widgets</h2>
          <button
            type="button"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
            onClick={() => {
              resetNewWidgetFlow();
              onBack();
            }}
          >
            Back
          </button>
        </div>

        <div className="mb-4 space-y-3">
          <button
            type="button"
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 hover:bg-white/10"
            onClick={onClickConfigureNew}
          >
            Configure new widget
          </button>

          {configureNewStep === "pick" && (
            <div className="rounded-xl border border-white/20 bg-white/5 p-3">
              <div className="text-sm font-semibold mb-2">Select a widget</div>
              <div className="grid grid-cols-1 gap-2">
                {AVAILABLE_WIDGETS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className="text-left rounded-lg border border-white/20 bg-white/5 px-3 py-2 hover:bg-white/10"
                    onClick={() => openCreateForm(w)}
                  >
                    <div className="font-semibold">{w.title}</div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-gray-400">{w.id}</div>
                      {w.requiresConfiguration && (
                        <div className="text-xs text-red-300">Requires config</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {configureNewStep === "form" && selectedWidget && (
            <div className="rounded-xl border border-white/20 bg-white/5 p-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {widgetForm?.mode === "edit" ? "Configure widget" : "New widget"}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {selectedWidget.title} ({selectedWidget.id})
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10 shrink-0"
                  onClick={resetNewWidgetFlow}
                >
                  Cancel
                </button>
              </div>

              <label className="block">
                <div className="text-xs text-gray-300 mb-1">Widget Title</div>
                <input
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                  value={newWidgetTitle}
                  onChange={(e) => setNewWidgetTitle(e.target.value)}
                  placeholder="e.g. My Discord"
                />
              </label>

              {/* Widget-specific configuration fields */}
              {selectedWidget.configSchema.length > 0 && (
                <div className="space-y-3">
                  {selectedWidget.configSchema.map((field) => {
                    if (field.type === "calendar_events") {
                      return (
                        <label key={field.key} className="block">
                          <div className="text-xs text-gray-300 mb-1">{field.label}</div>
                          <textarea
                            className="w-full min-h-28 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                            value={widgetConfigJsonDraft}
                            onChange={(e) => setWidgetConfigJsonDraft(e.target.value)}
                            placeholder={field.placeholder}
                          />
                          <div className="mt-1 text-[11px] text-gray-400">
                            Paste valid JSON array of events.
                          </div>
                        </label>
                      );
                    }

                    if (field.type === "string_array") {
                      const v = widgetConfigDraft[field.key];
                      const str = Array.isArray(v) ? v.join(",") : (v ?? "");
                      return (
                        <label key={field.key} className="block">
                          <div className="text-xs text-gray-300 mb-1">{field.label}</div>
                          <input
                            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                            value={str}
                            onChange={(e) =>
                              setWidgetConfigDraft((cur) => ({
                                ...cur,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={field.placeholder}
                          />
                          <div className="mt-1 text-[11px] text-gray-400">Comma-separated.</div>
                        </label>
                      );
                    }

                    // text
                    return (
                      <label key={field.key} className="block">
                        <div className="text-xs text-gray-300 mb-1">{field.label}</div>
                        <input
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                          value={(widgetConfigDraft[field.key] ?? "") as string}
                          onChange={(e) =>
                            setWidgetConfigDraft((cur) => ({
                              ...cur,
                              [field.key]: e.target.value,
                            }))
                          }
                          placeholder={field.placeholder}
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {(createWidgetError || saveWidgetConfigError) && (
                <div className="text-sm text-red-300">{saveWidgetConfigError ?? createWidgetError}</div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 hover:bg-white/10 disabled:opacity-50"
                  disabled={creatingWidget || savingWidgetConfig}
                  onClick={saveWidgetForm}
                >
                  {savingWidgetConfig ? "Saving..." : widgetForm?.mode === "edit" ? "Save" : "Create widget"}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 hover:bg-white/10"
                  onClick={() => {
                    setWidgetForm(null);
                    setSelectedWidget(null);
                    setNewWidgetTitle("");
                    setConfigureNewStep("pick");
                    setCreateWidgetError(null);
                    setSaveWidgetConfigError(null);
                    setWidgetConfigDraft({});
                    setWidgetConfigJsonDraft("");
                  }}
                >
                  Back to list
                </button>
              </div>
            </div>
          )}
        </div>

        {userWidgetsLoading && <div className="text-sm text-gray-300">Loading...</div>}

        {userWidgetsError && <div className="text-sm text-red-300">{userWidgetsError}</div>}

        {!userWidgetsLoading && !userWidgetsError && (
          <div className="space-y-3">
            {(userWidgets ?? []).length === 0 ? (
              <div className="text-sm text-gray-300">No widgets found.</div>
            ) : (
              (userWidgets ?? []).map((w) => {
                const needsConfig = w.widget_configuration == null && w.requires_config === true;

                return (
                  <div
                    key={w.id}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{w.widget_title ?? "(untitled)"}</div>
                      <div className="text-xs text-gray-400 truncate">{w.widget_type ?? "(unknown type)"}</div>
                      {needsConfig && (
                        <div className="mt-1 text-xs text-red-300">Required configuration missing</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
                        onClick={() => openEditForm(w)}
                      >
                        Configure
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10 disabled:opacity-50"
                        disabled={deletingWidgetId === w.id}
                        onClick={() => deleteWidget(w.id)}
                      >
                        {deletingWidgetId === w.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}
