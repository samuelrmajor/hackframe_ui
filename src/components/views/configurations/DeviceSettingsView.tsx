export interface DeviceSettingsViewProps {
  onBack: () => void;
}

export default function DeviceSettingsView({ onBack }: DeviceSettingsViewProps) {
  return (
    <main className="flex-1 min-h-0">
      <div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Device Settings</h2>
          <button
            type="button"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
            onClick={onBack}
          >
            Back
          </button>
        </div>
        <p className="text-gray-300">(Placeholder)</p>
      </div>
    </main>
  );
}
