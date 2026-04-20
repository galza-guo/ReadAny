import * as Dialog from "@radix-ui/react-dialog";
import {
  SettingsDialogContent,
  type SettingsDialogContentProps,
} from "./SettingsDialogContent";

type SettingsDialogProps = {
  open: boolean;
  onDone: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  saveDisabled: boolean;
  contentProps: SettingsDialogContentProps;
};

export function SettingsDialog({
  open,
  onDone,
  onOpenChange,
  saveDisabled,
  contentProps,
}: SettingsDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content dialog-content-settings"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const target = event.currentTarget as HTMLElement | null;
            target?.focus();
          }}
          tabIndex={-1}
        >
          <div className="settings-dialog-header">
            <div className="settings-dialog-title-row">
              <Dialog.Title className="dialog-title type-title-large">Settings</Dialog.Title>
            </div>
            <button
              aria-label="Done"
              className="btn btn-ghost btn-icon-only settings-dialog-done-button"
              disabled={saveDisabled}
              onClick={() => {
                void Promise.resolve(onDone())
                  .then(() => onOpenChange(false))
                  .catch(() => {});
              }}
              title={saveDisabled ? "Saving..." : "Done"}
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m5 13 4 4L19 7" />
              </svg>
            </button>
          </div>
          <div className="settings-dialog-body">
            <SettingsDialogContent {...contentProps} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
