import { analyzePosition } from "./training-analysis";
import type { Game } from "./kropki";

self.onmessage = (event: MessageEvent<Game>) => {
  try {
    self.postMessage({ ok: true, analysis: analyzePosition(event.data) });
  } catch {
    self.postMessage({ ok: false });
  }
};
