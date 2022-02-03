/* eslint-disable prefer-const */
/* eslint-disable sort-keys */
import { Client, Interaction, MessageActionRow, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import { PlayerStats } from "../repositories/LeaderboardRepository/types";
import QueueRepository from "../repositories/QueueRepository";
import { BallChaser } from "../types/common";
const NormClient = new Client({ intents: "GUILDS" });


export async function buttonEmbeds(queueChannel: TextChannel): Promise<void> {

    let ballchasers = await QueueRepository.getAllBallChasersInQueue();

    const row1 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("joinQueue")
                .setLabel("Join")
                .setStyle("SUCCESS"),
            new MessageButton()
                .setCustomId("leaveQueue")
                .setLabel("Leave")
                .setStyle("DANGER"),
        );

    if (ballchasers == null) {
        const embed = new MessageEmbed()
            .setColor("#3ba55c") // <- This is green
            .setTitle("Queue is Empty")
            .setDescription("Click the green button to join the queue!");
        console.info("NormJS is running.");

        await queueChannel.send({ embeds: [embed], components: [row1] });

    } else {
        let ballChaserNames = ballchasers.map(function (a) { return a.name; });

        const embed = new MessageEmbed()
            .setColor("#3ba55c") // <- This is green
            .setTitle("Current Queue")
            .setDescription("Click the green button to join the queue!\n\n" +
                "Current Queue: " + ballchasers.length + "/6\n" + ballChaserNames.join("\n"));
        console.info("NormJS is running.");

        await queueChannel.send({ embeds: [embed], components: [row1] });
    }
}

NormClient.on("interactionCreate", async (buttonInteraction: Interaction) => {

    if (!buttonInteraction.isButton()) return;
    console.log(buttonInteraction);

    switch (buttonInteraction.customId) {
        case "joinQueue": {
            
            let queueMember: BallChaser | null;
            queueMember = await QueueRepository.getBallChaserInQueue(buttonInteraction.user.toString());

            let leaderboardMember: Readonly<PlayerStats> | null;
            leaderboardMember = await LeaderboardRepository.getPlayerStats(buttonInteraction.user.toString());

            if (queueMember == null && leaderboardMember == null) {
                const player: BallChaser = {
                    id: buttonInteraction.user.toString(),
                    mmr: 100,
                    name: buttonInteraction.user.username,
                    isCap: false,
                    team: null,
                    queueTime: DateTime.now(),
                };

                await QueueRepository.addBallChaserToQueue(player);
            }

            if (queueMember == null && leaderboardMember != null) {
                const player: BallChaser = {
                    id: buttonInteraction.user.toString(),
                    mmr: leaderboardMember.mmr,
                    name: buttonInteraction.user.username,
                    isCap: false,
                    team: null,
                    queueTime: DateTime.now(),
                };

                await QueueRepository.addBallChaserToQueue(player);
            }

            const row1 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId("joinQueue")
                        .setLabel("Join")
                        .setStyle("SUCCESS"),
                    //.setDisabled(Need a method that returns T/F to determine if this is a clickable button after a full queue)
                    new MessageButton()
                        .setCustomId("leaveQueue")
                        .setLabel("Leave")
                        .setStyle("DANGER"),
                );


            let ballchasers = await QueueRepository.getAllBallChasersInQueue();
            let ballChaserNames = ballchasers.map(function (a) { return a.name; });

            const embed = new MessageEmbed()
                .setColor("#3ba55c") // <- This is green
                .setTitle(buttonInteraction.user.username + " Joined the Queue!")
                .setDescription("Click the green button to join the queue!\n\n" +
                    "Current Queue: " + ballchasers.length + "/6\n" + ballChaserNames.join("\n"));

            await buttonInteraction.update({ embeds: [embed], components: [row1] });
            break;
        }

        case "leaveQueue": {

            let member: BallChaser | null;
            member = await QueueRepository.getBallChaserInQueue(buttonInteraction.user.toString());

            if (member != null) {
                let remainingMembers = await QueueRepository.removeBallChaserFromQueue(buttonInteraction.user.toString());

                const row1 = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId("joinQueue")
                            .setLabel("Join")
                            .setStyle("SUCCESS"),
                        new MessageButton()
                            .setCustomId("leaveQueue")
                            .setLabel("Leave")
                            .setStyle("DANGER"),
                    );

                let ballchasers = await QueueRepository.getAllBallChasersInQueue();
                let ballChaserNames = remainingMembers.map(function (a) { return a.name; });

                const embed = new MessageEmbed()
                    .setColor("#ed4245") // <- This is red
                    .setTitle(buttonInteraction.user.username + " Left the Queue!")
                    .setDescription("Click the green button to join the queue!\n\n" +
                        "Current Queue: " + ballchasers.length + "/6\n" + ballChaserNames.join("\n"));

                await buttonInteraction.update({ embeds: [embed], components: [row1] });
            }
            break;
        }
    }
});

NormClient.login(process.env.token);