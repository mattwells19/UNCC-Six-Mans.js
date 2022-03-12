import { MessageEmbed, MessageEmbedOptions } from "discord.js";
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

  static activeMatchEmbed(): BaseEmbed {
    return new BaseEmbed({ color: "DARK_RED", title: "Teams are set!" });
  }

  static captainsChooseEmbed(team: Team, captain: string): BaseEmbed {
    switch (team) {
      case Team.Blue:
        return new BaseEmbed({ color: "BLUE", description: "🔷 " + captain + " 🔷 chooses first" });
      case Team.Orange:
        return new BaseEmbed({ color: "ORANGE", description: "🔶 " + captain + " 🔶 choose 2 players" });
    }
  }
}
