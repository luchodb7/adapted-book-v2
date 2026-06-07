"use client";

import * as React from "react";
import { Contrast, Moon, Sun, TextIcon, Settings2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type TextSize = "default" | "large" | "x-large";

const STORAGE_HC = "ab.hc";
const STORAGE_TS = "ab.textSize";

/**
 * Accessibility quick-toolbar.
 *
 * Persists user choices in localStorage and applies them to <html> via data
 * attributes / classes. Designed to be unobtrusive yet always reachable via
 * keyboard.
 */
export function A11yToolbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [hc, setHc] = React.useState(false);
  const [textSize, setTextSize] = React.useState<TextSize>("default");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const storedHc = window.localStorage.getItem(STORAGE_HC) === "1";
    const storedTs = (window.localStorage.getItem(STORAGE_TS) as TextSize | null) ?? "default";
    setHc(storedHc);
    setTextSize(storedTs);
    document.documentElement.classList.toggle("hc", storedHc);
    document.documentElement.setAttribute("data-text-size", storedTs);
  }, []);

  const toggleHc = () => {
    const next = !hc;
    setHc(next);
    document.documentElement.classList.toggle("hc", next);
    window.localStorage.setItem(STORAGE_HC, next ? "1" : "0");
  };

  const cycleTextSize = () => {
    const order: TextSize[] = ["default", "large", "x-large"];
    const next = order[(order.indexOf(textSize) + 1) % order.length]!;
    setTextSize(next);
    document.documentElement.setAttribute("data-text-size", next);
    window.localStorage.setItem(STORAGE_TS, next);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border bg-background p-1 shadow-lg transition-all",
          open ? "pr-2" : "",
        )}
        role="toolbar"
        aria-label="Accessibility preferences"
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label={open ? "Close accessibility toolbar" : "Open accessibility toolbar"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Settings2 className="size-5" />
        </Button>

        {open && (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <Button
              variant={hc ? "default" : "ghost"}
              size="icon"
              aria-label={hc ? "Disable high contrast" : "Enable high contrast"}
              aria-pressed={hc}
              onClick={toggleHc}
            >
              <Contrast className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Text size: ${textSize}. Click to change.`}
              onClick={cycleTextSize}
            >
              <TextIcon className="size-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
