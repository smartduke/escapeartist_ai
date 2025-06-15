import { cn } from '@/lib/utils';
import { Switch } from '@headlessui/react';

const CopilotToggle = ({
  copilotEnabled,
  setCopilotEnabled,
}: {
  copilotEnabled: boolean;
  setCopilotEnabled: (enabled: boolean) => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => setCopilotEnabled(!copilotEnabled)}
      className="group relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-200"
      title={copilotEnabled ? "Copilot enabled" : "Copilot disabled"}
    >
      <Switch
        checked={copilotEnabled}
        onChange={setCopilotEnabled}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200",
          copilotEnabled
            ? "bg-blue-600"
            : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <span className="sr-only">Copilot</span>
        <span
          className={cn(
            "inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-all duration-200",
            copilotEnabled ? "translate-x-5" : "translate-x-1"
          )}
        />
      </Switch>
    </button>
  );
};

export default CopilotToggle;
