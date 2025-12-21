export type LoggedInHomeRoute = "widgets" | "configurations" | "menu";

export interface MenuScreenProps {
  onSelect: (route: LoggedInHomeRoute) => void;
  allowConfigurations: boolean;
}

export default function MenuScreen({ onSelect, allowConfigurations }: MenuScreenProps) {
  return (
    <main className="flex-1 min-h-0 flex items-start">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Menu</h2>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="w-full text-left rounded-xl border border-white/20 bg-white/5 px-4 py-3 hover:bg-white/10"
            onClick={() => onSelect("widgets")}
          >
            Display Widgets
          </button>

          {allowConfigurations && (
            <button
              type="button"
              className="w-full text-left rounded-xl border border-white/20 bg-white/5 px-4 py-3 hover:bg-white/10"
              onClick={() => onSelect("configurations")}
            >
              Configurations
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
