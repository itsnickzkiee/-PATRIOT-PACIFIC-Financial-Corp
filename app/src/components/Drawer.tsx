import React, {
  useEffect,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
  header: React.ReactNode;
}

export default function Drawer({
  open,
  onClose,
  width = 1100,
  children,
  header,
}: DrawerProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            onClick={onClose}
            className="
              fixed
              inset-0
              z-40
              bg-[#1c050d]/55
              backdrop-blur-[3px]
            "
          />

          <div
            className="
              pointer-events-none
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              p-3
              sm:p-5
            "
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 18,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 18,
              }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 310,
              }}
              style={{
                width: `min(${width}px, 96vw)`,
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
              className="
                card-shadow-lg
                pointer-events-auto
                flex
                h-[82vh]
                min-h-[560px]
                max-h-[860px]
                flex-col
                overflow-hidden
                rounded-2xl
                bg-white
                ring-1
                ring-black/10
              "
            >
              <div
                className="
                  sidebar-gradient
                  relative
                  flex
                  shrink-0
                  items-center
                  gap-3
                  px-5
                  py-4
                  sm:px-6
                "
              >
                <div
                  className="
                    flex
                    min-w-0
                    flex-1
                    items-center
                    gap-3
                  "
                >
                  {header}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close window"
                  className="
                    grid
                    h-9
                    w-9
                    shrink-0
                    place-items-center
                    rounded-full
                    text-white/60
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div
                className="
                  flex
                  min-h-0
                  flex-1
                  flex-col
                  overflow-hidden
                "
              >
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}