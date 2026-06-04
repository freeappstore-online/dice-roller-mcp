import { useState, useCallback, useEffect } from "react";
import { Shell } from "./components/Shell";

const STORAGE_KEY = "dice_roller_history";
const MAX_HISTORY = 20;

const DIE_FACES: Record<number, string> = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

interface RollEntry {
  value: number;
  timestamp: number;
}

function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function App() {
  const [current, setCurrent] = useState<number | null>(null);
  const [history, setHistory] = useState<RollEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [rolling, setRolling] = useState(false);
  const [animValue, setAnimValue] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const roll = useCallback(() => {
    if (rolling) return;
    setRolling(true);

    // Quick shuffle animation
    let ticks = 0;
    const maxTicks = 10;
    const interval = setInterval(() => {
      setAnimValue(rollD6());
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const final = rollD6();
        setAnimValue(null);
        setCurrent(final);
        setHistory((prev) => {
          const next = [{ value: final, timestamp: Date.now() }, ...prev].slice(0, MAX_HISTORY);
          return next;
        });
        setRolling(false);
      }
    }, 60);
  }, [rolling]);

  // Keyboard support: press Space or Enter to roll
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        roll();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [roll]);

  const displayValue = animValue ?? current;

  const clearHistory = () => {
    setHistory([]);
    setCurrent(null);
  };

  return (
    <Shell>
      <div className="flex flex-col items-center gap-8 max-w-md mx-auto pt-4 md:pt-8">
        {/* Title */}
        <div className="text-center">
          <h1
            className="text-4xl font-bold mb-1"
            style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
          >
            Dice Roller
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Press the button — or hit Space / Enter
          </p>
        </div>

        {/* Die display */}
        <div
          className="flex items-center justify-center rounded-[1.25rem] select-none"
          style={{
            width: "10rem",
            height: "10rem",
            background: "var(--panel)",
            border: "2px solid var(--line)",
            fontSize: "7rem",
            lineHeight: 1,
            transition: "transform 0.05s",
            transform: rolling ? `rotate(${Math.random() * 20 - 10}deg)` : "rotate(0deg)",
            boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
          }}
          aria-label={displayValue ? `Rolled a ${displayValue}` : "No roll yet"}
          aria-live="polite"
        >
          {displayValue ? (
            DIE_FACES[displayValue]
          ) : (
            <span style={{ fontSize: "3rem", color: "var(--muted)" }}>?</span>
          )}
        </div>

        {/* Current result label */}
        <div className="text-center" style={{ minHeight: "2.5rem" }}>
          {displayValue ? (
            <span
              className="text-5xl font-bold"
              style={{ fontFamily: "Fraunces, serif", color: "var(--accent)" }}
            >
              {animValue ? "..." : displayValue}
            </span>
          ) : (
            <span className="text-lg" style={{ color: "var(--muted)" }}>
              Roll to get started
            </span>
          )}
        </div>

        {/* Roll button */}
        <button
          onClick={roll}
          disabled={rolling}
          className="font-bold text-xl px-12 py-4 rounded-[0.75rem] transition-all active:scale-95"
          style={{
            background: rolling ? "var(--muted)" : "var(--accent)",
            color: "#fff",
            cursor: rolling ? "not-allowed" : "pointer",
            border: "none",
            boxShadow: rolling ? "none" : "0 4px 16px 0 rgba(0,0,0,0.15)",
            fontFamily: "Manrope, sans-serif",
            letterSpacing: "0.02em",
            minWidth: "14rem",
          }}
          aria-label="Roll the die"
        >
          {rolling ? "Rolling…" : "🎲 Roll"}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div
            className="w-full rounded-[1.25rem] overflow-hidden"
            style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: "var(--line)" }}
            >
              <span
                className="font-semibold text-sm"
                style={{ color: "var(--ink)", fontFamily: "Fraunces, serif" }}
              >
                Recent Rolls
              </span>
              <button
                onClick={clearHistory}
                className="text-xs rounded-[0.5rem] px-3 py-1 transition-opacity hover:opacity-70"
                style={{
                  color: "var(--muted)",
                  background: "transparent",
                  border: "1px solid var(--line)",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
            <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
              {history.map((entry, i) => (
                <li
                  key={entry.timestamp}
                  className="flex items-center justify-between px-5 py-2"
                  style={{
                    opacity: i === 0 ? 1 : Math.max(0.35, 1 - i * 0.04),
                    background: i === 0 ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "transparent",
                  }}
                >
                  <span
                    className="text-2xl"
                    aria-label={`Die showing ${entry.value}`}
                  >
                    {DIE_FACES[entry.value]}
                  </span>
                  <span
                    className="font-bold text-lg"
                    style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
                  >
                    {entry.value}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {formatTime(entry.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats */}
        {history.length >= 3 && (
          <div
            className="w-full grid grid-cols-3 gap-3 text-center"
          >
            {[
              {
                label: "Total Rolls",
                value: history.length,
              },
              {
                label: "Average",
                value: (history.reduce((s, e) => s + e.value, 0) / history.length).toFixed(1),
              },
              {
                label: "Last Roll",
                value: history[0]?.value ?? "—",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1rem] px-3 py-3"
                style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
              >
                <div
                  className="text-xl font-bold"
                  style={{ fontFamily: "Fraunces, serif", color: "var(--accent)" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
