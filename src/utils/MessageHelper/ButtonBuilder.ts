import { ButtonInteraction, MessageActionRow, MessageButton, MessageOptions } from "discord.js";
import { getEnvVariable } from "../utils";

export const enum ButtonCustomID {
  JoinQueue = "joinQueue",
  LeaveQueue = "leaveQueue",
  CreateRandomTeam = "randomizeTeams",
  ChooseTeam = "chooseTeam",
  FillTeam = "fillTeam",
  ReportMatch = "reportMatch",
  RemoveAll = "removeAll",
  BreakMatch = "breakMatch",
}

export default class ButtonBuilder extends MessageButton {
  private static readonly isDev = getEnvVariable("ENVIRONMENT") === "dev";

  static joinButton(disabled = false): MessageButton {
    return new MessageButton({
      customId: ButtonCustomID.JoinQueue,
      disabled: disabled,
      label: "Join",
      style: "SUCCESS",
    });
  }

  static leaveButton(disabled = false): MessageButton {
    return new MessageButton({
      customId: ButtonCustomID.LeaveQueue,
      disabled: disabled,
      label: "Leave",
      style: "DANGER",
    });
  }

  static fillTeamButton(disabled = false): MessageButton {
    return new MessageButton({
      customId: ButtonCustomID.FillTeam,
      disabled: disabled,
      label: "DEV: Fill Queue",
      style: "DANGER",
    });
  }

  static removeAllButton(disabled = false): MessageButton {
    return new MessageButton({
      customId: ButtonCustomID.RemoveAll,
      disabled: disabled,
      label: "DEV: Remove All",
      style: "DANGER",
    });
  }

  static randomTeamsButton(disabled = false): MessageButton {
    return new MessageButton({
      customId: ButtonCustomID.CreateRandomTeam,
      disabled: disabled,
      label: "Random",
      style: "PRIMARY",
    });
  }

  static reportMatchButton(disabled = false): MessageButton {
    return new MessageButton({
      customId: ButtonCustomID.ReportMatch,
      disabled: disabled,
      label: "Report Match",
      style: "SUCCESS",
    });
  }

  static breakMatchButton(disabled = false): MessageButton {
    return new MessageButton({
      customId: ButtonCustomID.BreakMatch,
      disabled: disabled,
      label: "DEV: Break Match",
      style: "DANGER",
    });
  }

  static pickCaptainsButton(disabled = false): MessageButton {
    return new MessageButton({
      customId: ButtonCustomID.ChooseTeam,
      disabled: disabled,
      label: "Captains",
      style: "PRIMARY",
    });
  }

  static disabledQueueButtons(buttonInteraction: ButtonInteraction): MessageOptions {
    const waitLabel = "Please wait...";

    const joinButton = this.joinButton(true);
    const leaveButton = this.leaveButton(true);

    switch (buttonInteraction.customId) {
      case ButtonCustomID.JoinQueue: {
        joinButton.label = waitLabel;
        break;
      }
      case ButtonCustomID.LeaveQueue: {
        leaveButton.label = waitLabel;
        break;
      }
    }
    return {
      components: [new MessageActionRow({ components: [joinButton, leaveButton] })],
    };
  }

  static enabledQueueButtons(): MessageOptions {
    const joinButton = this.joinButton();
    const leaveButton = this.leaveButton();
    return {
      components: [new MessageActionRow({ components: [joinButton, leaveButton] })],
    };
  }

  static queueButtons(): MessageActionRow {
    const components = [ButtonBuilder.joinButton(), ButtonBuilder.leaveButton()];
    if (this.isDev) {
      components.push(ButtonBuilder.fillTeamButton(), ButtonBuilder.removeAllButton());
    }
    return new MessageActionRow({ components: components });
  }

  static fullQueueButtons(): MessageActionRow {
    const components = [
      ButtonBuilder.pickCaptainsButton(),
      ButtonBuilder.randomTeamsButton(),
      ButtonBuilder.leaveButton(),
    ];

    if (this.isDev) {
      components.push(ButtonBuilder.removeAllButton());
    }
    return new MessageActionRow({ components: components });
  }

  static activeMatchButtons(): MessageActionRow {
    const components = [ButtonBuilder.reportMatchButton()];
    if (this.isDev) {
      components.push(ButtonBuilder.breakMatchButton());
    }
    return new MessageActionRow({ components: components });
  }
}
