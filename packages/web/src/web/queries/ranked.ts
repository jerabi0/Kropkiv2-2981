import { orpc } from "../lib/api";
export const rankedStatus = () => ({
  ...orpc.ranked.status.queryOptions(),
  refetchInterval: 3000,
  refetchOnWindowFocus: true,
  refetchOnMount: "always" as const,
});
export const rankedStats = () => ({
  ...orpc.ranked.stats.queryOptions(),
  refetchOnWindowFocus: true,
  refetchOnMount: "always" as const,
});
export const startSearch = () => orpc.ranked.search.mutationOptions();
export const cancelSearch = () => orpc.ranked.cancel.mutationOptions();
