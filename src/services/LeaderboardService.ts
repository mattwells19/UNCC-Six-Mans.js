import LeaderboardRepository from "../repositories/LeaderboardRepository";

export async function LeaderboardToString(): Promise<Array<string>> {
  const playersPerEmbed = 10;

  const allPlayers = await LeaderboardRepository.getAllPlayersStats();

  const result: Array<string> = [];

  for (let i = 0; i < allPlayers.length; i += playersPerEmbed) {
    const playersSegment = allPlayers.slice(i, i + playersPerEmbed);

    const newEmbedSegment = playersSegment.reduce((prev, player, index) => {
      const playerStats = `Rank: ${i + index + 1}
\tName: ${player.name}
\tMMR: ${player.mmr}
\tWins: ${player.wins}
\tLosses: ${player.losses}
\tMatches Played: ${player.matchesPlayed}
\tWin Perc: ${player.winPerc}\n\n`;

      return (prev += playerStats);
    }, "");

    result.push(newEmbedSegment);
  }

  return result;
}
