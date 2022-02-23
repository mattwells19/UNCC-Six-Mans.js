import { PlayerInActiveMatch } from "../repositories/ActiveMatchRepository/types";

export default function inActiveMatch(
  activeMatchPlayers: Readonly<PlayerInActiveMatch[]>,
  playerToCheck: string
): boolean {
  if (activeMatchPlayers) {
    const found = activeMatchPlayers.find((obj) => {
      return obj.id == playerToCheck;
    });
    return found !== undefined ? true : false;
  } else {
    return false;
  }
}
