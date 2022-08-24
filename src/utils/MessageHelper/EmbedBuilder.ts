import { MessageEmbed, MessageEmbedOptions } from "discord.js";
import { ActiveMatchCreated } from "../../services/MatchService";
import { Team } from "../../types/common";

class BaseEmbed extends MessageEmbed {
  private static readonly normIconURL =
    "https://raw.githubusercontent.com/mattwells19/UNCC-Six-Mans.js/main/media/norm_still.png";

  constructor(messageOptions: MessageEmbedOptions) {
    messageOptions.thumbnail = { url: BaseEmbed.normIconURL };
    super(messageOptions);
  }
}

export default class EmbedBuilder {
  static leaderboardEmbed(description: string, title: string): MessageEmbed {
    return new BaseEmbed({ color: "BLUE", description, title });
  }

  static queueEmbed(title: string, description: string): MessageEmbed {
    return new BaseEmbed({ color: "GREEN", description, title });
  }

  static fullQueueEmbed(description: string): BaseEmbed {
    return new BaseEmbed({ color: "GREEN", description, title: "Queue is Full" });
  }

  static activeMatchEmbed({ blue, orange }: ActiveMatchCreated): BaseEmbed {
    const blueTeam: Array<string> = blue.players.map((player) => "<@" + player.id + ">");
    const orangeTeam: Array<string> = orange.players.map((player) => "<@" + player.id + ">");
    const activeMatchEmbed = new BaseEmbed({
      color: "DARK_RED",
      fields: [
        { name: "🔷 Blue Team 🔷", value: blueTeam.join("\n") },
        { name: "🔶 Orange Team 🔶", value: orangeTeam.join("\n") },
      ],
      title: "Teams are set!",
    });

    let probability;
    let winner;
    if (blue.winProbability > orange.winProbability) {
      probability = blue.winProbability;
      winner = "Blue Team is";
    } else if (blue.winProbability < orange.winProbability) {
      probability = orange.winProbability;
      winner = "Orange Team is";
    } else {
      probability = "50";
      winner = "Both teams are";
    }

    activeMatchEmbed.addField(
      "MMR Stake & Probability Rating:\n",
      "🔷 Blue Team: \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0**(+" +
        blue.mmrStake.toString() +
        ")**\u00A0\u00A0**(-" +
        orange.mmrStake.toString() +
        ")** 🔷\n🔶 Orange Team:\u00A0\u00A0**(+" +
        orange.mmrStake.toString() +
        ")**\u00A0\u00A0**(-" +
        blue.mmrStake.toString() +
        ")** 🔶\n" +
        winner +
        " predicted to have a **" +
        probability +
        "%** chance of winning."
    );

    return activeMatchEmbed;
  }

  static voteForCaptainsOrRandomEmbed(title: string, description: string): BaseEmbed {
    return new BaseEmbed({ color: "GREEN", description, title });
  }

  static captainsChooseEmbed(team: Team, captain: string): BaseEmbed {
    switch (team) {
      case Team.Blue:
        return new BaseEmbed({ color: "BLUE", description: "🔷 " + captain + " 🔷 chooses first" });
      case Team.Orange:
        return new BaseEmbed({ color: "ORANGE", description: "🔶 " + captain + " 🔶 choose 2 players" });
    }
  }

  static newSeasonEmbed(newSeason: string): BaseEmbed {
    return new BaseEmbed({
      color: "DARK_RED",
      description: "You are about to create a new season. This will end the current season.",
      title: "Start " + newSeason + " season?",
    });
  }

  static newSeasonConfirmedEmbed(newSeason: string): BaseEmbed {
    return new BaseEmbed({
      color: "GREEN",
      description: "The previous season has ended and the " + newSeason + " season has begun.",
      title: "New Season Started",
    });
  }

  static newSeasonCancellationEmbed(): BaseEmbed {
    return new BaseEmbed({
      color: "DARK_RED",
      description: "No changes were made and the current season is still active.",
      title: "New Season Cancelled",
    });
  }
}
