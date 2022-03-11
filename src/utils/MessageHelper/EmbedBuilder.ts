import { ColorResolvable, MessageEmbed } from "discord.js";

class BaseEmbed extends MessageEmbed {
  private static readonly normIconURL =
    "https://raw.githubusercontent.com/mattwells19/UNCC-Six-Mans.js/main/media/norm_still.png";

  // 🐧 will 'title' ever not be provided?
  constructor(color: ColorResolvable, description?: string, title?: string | null) {
    // 🐧 can we pass these options directly into the super(...) call?
    super();
    this.thumbnail = { url: BaseEmbed.normIconURL };
    this.setColor(color);
    // 🐧 You can simplify these undefined checks to: description ?? null
    this.description = !description ? null : description;
    this.title = !title ? null : title;
  }
}

export default class EmbedBuilder {
  static leaderboardEmbed(description: string, title: string): MessageEmbed {
    return new BaseEmbed("BLUE", description, title);
  }

  // 🐧 Does 'title' need to be optional here?
  static queueEmbed(description?: string, title?: string): MessageEmbed {
    return new BaseEmbed("GREEN", description, title);
  }

  // 🐧 Does 'description' need to be optional here?
  static fullQueueEmbed(description?: string | undefined): BaseEmbed {
    return new BaseEmbed("GREEN", description, "Queue is Full");
  }

  static activeMatchEmbed(): BaseEmbed {
    return new BaseEmbed("DARK_RED", "Teams are set!");
  }

  // 🐧 I would make 'color' -> 'teamColor' and accept type Team instead of ColorResolvable.
  //    that would allow this function to decide which team gets which color instead of wherever
  //    this function is being called.
  static captainsChooseEmbed(color: ColorResolvable, captain: string): BaseEmbed {
    const description =
      color === "BLUE" ? "🔷 " + captain + " 🔷 chooses first" : "🔶 " + captain + " 🔶 choose 2 players";

    return new BaseEmbed(color, description, "Captains pick your players");
  }
}
