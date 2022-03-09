import { ColorResolvable, MessageOptions, MessageEmbedOptions, MessageEmbed } from "discord.js";
import { getEnvVariable } from "../utils";

class BaseEmbed extends MessageEmbed {
  private static readonly normIconURL =
    "https://raw.githubusercontent.com/mattwells19/UNCC-Six-Mans.js/main/media/norm_still.png";
  constructor(color: ColorResolvable, description?: string, title?: string | null) {
    super();
    this.url = BaseEmbed.normIconURL;
    this.setColor(color);
    this.description = !description ? null : description;
    this.title = !title ? null : title;
  }
}

export default class EmbedBuilder {
  private static readonly isDev = getEnvVariable("ENVIRONMENT") === "dev";
  private static readonly normIconURL =
    "https://raw.githubusercontent.com/mattwells19/UNCC-Six-Mans.js/main/media/norm_still.png";

  static leaderboardEmbed(description: string, title: string): MessageEmbed {
    return new BaseEmbed("BLUE", description, title);
  }

  static queueEmbed(description?: string, title?: string): MessageEmbed {
    return new BaseEmbed("GREEN", title, description);
  }

  static fullQueueEmbed(description?: string | undefined): BaseEmbed {
    return new BaseEmbed("GREEN", "Queue is Full", description);
  }

  static activeMatchEmbed(): BaseEmbed {
    return new BaseEmbed("DARK_RED", "Teams are set!");
  }

  static captainsChooseEmbed(color: ColorResolvable, captain: string): BaseEmbed {
    const description =
      color === "BLUE" ? "🔷 " + captain + " 🔷 chooses first" : "🔶 " + captain + " 🔶 choose 2 players";

    return new BaseEmbed(color, "Captains pick your players", description);
  }
}
