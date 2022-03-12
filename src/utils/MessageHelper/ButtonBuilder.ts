import { MessageActionRow, MessageButton, MessageOptions } from "discord.js";
import { getEnvVariable } from "../utils";
import CustomButton, { ButtonCustomID, QueueButtonOptions } from "./CustomButtons";

const isDev = getEnvVariable("ENVIRONMENT") === "dev";

const leaveButton = new CustomButton({ customId: ButtonCustomID.LeaveQueue });
const fillTeamButton = new CustomButton({ customId: ButtonCustomID.FillTeam });
const removeAllButton = new CustomButton({ customId: ButtonCustomID.RemoveAll });
const randomTeamsButton = new CustomButton({ customId: ButtonCustomID.CreateRandomTeam });
const chooseTeamsButton = new CustomButton({ customId: ButtonCustomID.ChooseTeam });
const breakMatchButton = new CustomButton({ customId: ButtonCustomID.BreakMatch });
const reportMatchButton = new CustomButton({ customId: ButtonCustomID.ReportMatch });

export default class ButtonBuilder extends MessageButton {
  static queueButtons(options: QueueButtonOptions = { disabled: false }): MessageActionRow {
    const dynamicJoinButton = new CustomButton({
      customId: ButtonCustomID.JoinQueue,
      disabled: options.disabled,
      label: options.disabled && options.buttonId === ButtonCustomID.JoinQueue ? "Please wait..." : undefined,
    });
    const dynamicLeaveButton = new CustomButton({
      customId: ButtonCustomID.LeaveQueue,
      disabled: options.disabled,
      label: options.disabled && options.buttonId === ButtonCustomID.LeaveQueue ? "Please wait..." : undefined,
    });

    const components = [dynamicJoinButton, dynamicLeaveButton];
    if (isDev) {
      components.push(fillTeamButton, removeAllButton);
    }
    return new MessageActionRow({ components: components });
  }

  static fullQueueButtons(): MessageActionRow {
    const components = [chooseTeamsButton, randomTeamsButton, leaveButton];

    if (isDev) {
      components.push(removeAllButton);
    }
    return new MessageActionRow({ components: components });
  }

  static activeMatchButtons(): MessageActionRow {
    const components = [reportMatchButton];
    if (isDev) {
      components.push(breakMatchButton);
    }
    return new MessageActionRow({ components: components });
  }

  static breakMatchButtons(): MessageActionRow {
    return new MessageActionRow({ components: [breakMatchButton] });
  }
}
