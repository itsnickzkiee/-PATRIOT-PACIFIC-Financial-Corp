import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  KeyRound,
  LogOut,
  Trash2,
  X,
} from "lucide-react";

type ConfirmationVariant =
  | "delete"
  | "reset"
  | "signout";

type ConfirmationModalProps = {
  open: boolean;
  variant: ConfirmationVariant;
  title: string;
  message: string;
  details?: string;
  confirmText: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const styles = {
  delete: {
    icon: Trash2,
    iconBox: "bg-rose-100 text-rose-700",
    button:
      "bg-gradient-to-r from-rose-700 to-rose-600 shadow-rose-700/25",
  },
  reset: {
    icon: KeyRound,
    iconBox: "bg-violet-100 text-violet-700",
    button:
      "bg-gradient-to-r from-violet-700 to-violet-600 shadow-violet-700/25",
  },
  signout: {
    icon: LogOut,
    iconBox: "bg-amber-100 text-amber-700",
    button:
      "bg-gradient-to-r from-amber-600 to-orange-600 shadow-orange-700/25",
  },
};

export default function ConfirmationModal({
  open,
  variant,
  title,
  message,
  details,
  confirmText,
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const currentStyle = styles[variant];
  const Icon = currentStyle.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close confirmation dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!loading) onCancel();
            }}
            className="fixed inset-0 z-[90] cursor-default bg-[#1c050d]/60 backdrop-blur-sm"
          />

          <div className="pointer-events-none fixed inset-0 z-[100] grid place-items-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirmation-title"
              initial={{ opacity: 0, y: 18, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto w-[min(440px,94vw)] overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl"
            >
              <div className="relative p-6">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onCancel}
                  disabled={loading}
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>

                <div
                  className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${currentStyle.iconBox}`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <h2
                  id="confirmation-title"
                  className="font-display text-xl font-bold text-foreground"
                >
                  {title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {message}
                </p>

                {details && (
                  <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{details}</span>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="rounded-full border border-input bg-white px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancelText}
                  </button>

                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={loading}
                    className={`rounded-full px-5 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${currentStyle.button}`}
                  >
                    {loading ? "Please wait..." : confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}