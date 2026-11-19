import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { auth } from "../auth";
export const authed = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session)
    throw new ORPCError("UNAUTHORIZED", { message: "Connecte-toi pour jouer en ligne." });
  return next({ context: { user: session.user } });
});
