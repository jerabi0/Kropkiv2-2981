import { orpc } from "../lib/api";
export const gameList = () => orpc.privateGames.list.queryOptions();
export const roomQuery = (id: string) => ({
  ...orpc.privateGames.get.queryOptions({ input: { id } }),
  refetchInterval: 1000,
  refetchOnWindowFocus: true,
});
export const createPrivate = () => orpc.privateGames.create.mutationOptions();
export const joinPrivate = () => orpc.privateGames.join.mutationOptions();
export const actionPrivate = () => orpc.privateGames.action.mutationOptions();
