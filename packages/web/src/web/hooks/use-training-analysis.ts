import { useEffect, useState } from "react";
import type { Game } from "../lib/kropki";
import type { PositionAnalysis } from "../lib/training-analysis";

export function useTrainingAnalysis(game: Game, enabled: boolean) {
  const [state, setState] = useState<{
    game: Game;
    data?: PositionAnalysis;
    error?: string;
  } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let worker: Worker;
    try {
      worker = new Worker(new URL("../lib/training-analysis.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      setState({ game, error: "L’analyse ne peut pas démarrer dans ce navigateur." });
      return;
    }
    worker.onmessage = (event) => {
      if (event.data.ok) setState({ game, data: event.data.analysis });
      else setState({ game, error: "L’analyse a échoué. Le plateau reste jouable." });
      worker.terminate();
    };
    worker.onerror = () => {
      setState({ game, error: "L’analyse a échoué. Le plateau reste jouable." });
      worker.terminate();
    };
    worker.postMessage(game);
    return () => worker.terminate();
  }, [game, enabled]);
  const current = enabled && state?.game === game ? state : null;
  return { data: current?.data, error: current?.error, loading: enabled && !current };
}
