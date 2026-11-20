import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { ping } from "./routes/ping";
import { privateGames } from "./routes/private-games";
import { ranked } from "./routes/ranked";
import { auth } from "./auth";
import { isTrustedOrigin } from "./trusted-origins";

// API features are oRPC procedures, one file per feature in ./routes/,
// composed into this router — typed end-to-end via the clients
// (web: src/web/lib/api.ts, mobile: lib/api.ts).
// Keep each routes/ file under 500 lines (`bun run lint` enforces this);
// split into more feature files as they grow.
// Patterns and examples: skills/app/references/api.md
export const router = {
  ping,
  privateGames,
  ranked,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
// Rare plain-HTTP endpoints (webhooks, streaming, the Better Auth handler)
// register here with full paths, e.g. app.post("/api/webhooks/example", ...)

export default {
  async fetch(request: Request) {
    const response = await app.fetch(request);
    const origin = request.headers.get("origin");
    const headers = new Headers(response.headers);

    // The template's CORS layer reflects request origins. Remove those headers
    // for unconfigured sites so browser credentials stay limited to trusted origins.
    if (origin && isTrustedOrigin(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Credentials", "true");
      const vary = headers.get("Vary")?.split(",").map((value) => value.trim()) ?? [];
      if (!vary.some((value) => value.toLowerCase() === "origin")) vary.push("Origin");
      headers.set("Vary", vary.join(", "));
    } else {
      headers.delete("Access-Control-Allow-Origin");
      headers.delete("Access-Control-Allow-Credentials");
      headers.delete("Access-Control-Allow-Headers");
      headers.delete("Access-Control-Allow-Methods");
      headers.delete("Access-Control-Expose-Headers");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
