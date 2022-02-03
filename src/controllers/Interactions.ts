import { Client, Interaction, Message, MessageActionRow, MessageButton, MessageEmbed, User, TextChannel, ChannelManager } from "discord.js";
import { DateTime } from "luxon";
import LeaderboardRepository from "../repositories/LeaderboardRepository";
import { PlayerStats } from "../repositories/LeaderboardRepository/types";
import QueueRepository from "../repositories/QueueRepository";
import { BallChaser } from '../types/common';
const NormClient = new Client({ intents: "GUILDS" });


export async function buttonEmbeds(queueChannel : TextChannel): Promise<void> {

    const row1 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('joinQueue')
                .setLabel('Join')
                .setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId('leaveQueue')
                .setLabel('Leave')
                .setStyle('DANGER'),
        );

    const embed = new MessageEmbed()
        .setColor('#3ba55c') // <- This is green
        .setTitle('Queue is Empty')
        .setDescription('Click the green button to join the queue!')
    console.info("NormJS is running.");

    await queueChannel.send({ embeds: [embed], components: [row1] });
};


NormClient.on('interactionCreate', async (buttonInteraction: Interaction) => {

    if (!buttonInteraction.isButton()) return;
    console.log(buttonInteraction);

    switch (buttonInteraction.customId) {
        case 'joinQueue': {

            let member: BallChaser | null;
            member = await QueueRepository.getBallChaserInQueue(buttonInteraction.user.toString());
            if (member == null) {
                const player: BallChaser = {
                    id: buttonInteraction.user.toString(),
                    mmr: 100,
                    name: buttonInteraction.user.username,
                    isCap: false,
                    team: null,
                    queueTime: DateTime.now(),
                }
                console.log("Add BallChaser 2")
                await QueueRepository.addBallChaserToQueue(player);

            } else {
                QueueRepository.addBallChaserToQueue(member);
            }

            const row1 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('joinQueue')
                        .setLabel('Join')
                        .setStyle('SUCCESS'),
                    //.setDisabled(Need a method that returns T/F to determine if this is a clickable button after a full queue)
                    new MessageButton()
                        .setCustomId('leaveQueue')
                        .setLabel('Leave')
                        .setStyle('DANGER'),
                );


            let ballchasers = await QueueRepository.getAllBallChasersInQueue();
            console.log(ballchasers);
            // let names = [] 
            // for (let i = 0; i <= ballchasers.length; i++) {
            //     names[i] = ballchasers[i].name;
            // }
            
            const embed = new MessageEmbed()
                .setColor('#3ba55c') // <- This is green
                .setTitle(buttonInteraction.user.username + ' Joined the Queue!')
                .setDescription('Click the green button to join the queue!\n\n' +
                    ballchasers[0].name + '\n\n' + ballchasers[1].name);

            await buttonInteraction.update({ embeds: [embed], components: [row1] })
            break;
        }

        case 'leaveQueue': {

            let member: BallChaser | null;
            member = await QueueRepository.getBallChaserInQueue(buttonInteraction.user.toString());
            if (member != null) {
                QueueRepository.removeBallChaserFromQueue(buttonInteraction.user.toString());
            }

            const row1 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('joinQueue')
                        .setLabel('Join')
                        .setStyle('SUCCESS'),
                    new MessageButton()
                        .setCustomId('leaveQueue')
                        .setLabel('Leave')
                        .setStyle('DANGER'),
                );

            const embed = new MessageEmbed()
                .setColor('#ed4245') // <- This is red
                .setTitle(buttonInteraction.user.username + ' Left the Queue!')
                .setDescription('Click the green button to join the queue!\n\n' +
                    await QueueRepository.getAllBallChasersInQueue());

            await buttonInteraction.update({ embeds: [embed], components: [row1] })
            break;
        }
    }
})

NormClient.login(process.env.token);
