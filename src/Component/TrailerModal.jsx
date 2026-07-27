import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function TrailerModal({
  isOpen,
  title,
  embedUrl,
  onClose,
}) {
  const previousFocus = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousFocus.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      data-testid="trailer-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${title} trailer`}
        className="relative w-full max-w-6xl overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl shadow-black/60"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close trailer"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/75 text-white transition-colors hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-[#8f9af0]"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="aspect-video w-full">
          {embedUrl ? (
            <iframe
              className="h-full w-full"
              src={embedUrl}
              title={`${title} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-white">
              Trailer unavailable
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
