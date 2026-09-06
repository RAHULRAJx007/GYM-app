"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

type FeedbackState = "idle" | "saving" | "saved";

export function FormFeedback() {
  const [state, setState] = useState<FeedbackState>("idle");

  useEffect(() => {
    let savedTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    function handleSubmit(event: Event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.dataset.feedback === "off") return;

      setState("saving");
      savedTimer = setTimeout(() => setState("saved"), 350);
      hideTimer = setTimeout(() => setState("idle"), 1850);
    }

    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("submit", handleSubmit, true);
      if (savedTimer) clearTimeout(savedTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (state === "idle") return null;

  return (
    <div
      className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-3 duration-200"
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-[132px] items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
        {state === "saving" ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white animate-in zoom-in duration-200">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
        <span>{state === "saving" ? "Saving..." : "Saved"}</span>
      </div>
    </div>
  );
}
