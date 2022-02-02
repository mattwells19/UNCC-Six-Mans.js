import { Client, Interaction, Message, MessageActionRow, MessageButton, MessageEmbed, User, TextChannel, ChannelManager } from "discord.js";
import { DateTime } from "luxon";
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
            new MessageButton()
                .setCustomId('listQueue')
                .setLabel('List')
                .setStyle('PRIMARY'),
        );

    const row2 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('top5')
                .setLabel('Top 5')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('help')
                .setLabel('Help')
                .setStyle('SECONDARY'),
        );

    const embed = new MessageEmbed()
        .setColor('#3ba55c') // <- This is green
        .setTitle('Queue is Empty')
        .setDescription('Click the green button to join the queue!')
    console.info("NormJS is running.");

    await queueChannel.send({ embeds: [embed], components: [row1, row2] });
};


NormClient.on('interactionCreate', async (buttonInteraction: Interaction) => {

    if (!buttonInteraction.isButton()) return;

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
                await QueueRepository.addBallChaserToQueue(player);

            } else {
                await QueueRepository.addBallChaserToQueue(member);
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
                    new MessageButton()
                        .setCustomId('listQueue')
                        .setLabel('List')
                        .setStyle('PRIMARY'),
                );

            const row2 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('top5')
                        .setLabel('Top 5')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setCustomId('help')
                        .setLabel('Help')
                        .setStyle('SECONDARY'),
                );


            let ballchasers = await QueueRepository.getAllBallChasersInQueue()
            const embed = new MessageEmbed()
                .setColor('#3ba55c') // <- This is green
                .setTitle(buttonInteraction.user.username + ' Joined the Queue!')
                .setDescription('Click the green button to join the queue!\n\n' +
                    ballchasers[0].name);

            await buttonInteraction.update({ embeds: [embed], components: [row1, row2] })
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
                    new MessageButton()
                        .setCustomId('listQueue')
                        .setLabel('List')
                        .setStyle('PRIMARY'),
                );

            const row2 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('top5')
                        .setLabel('Top 5')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setCustomId('help')
                        .setLabel('Help')
                        .setStyle('SECONDARY'),
                );

            const embed = new MessageEmbed()
                .setColor('#ed4245') // <- This is red
                .setTitle(buttonInteraction.user.username + ' Left the Queue!')
                .setDescription('Click the green button to join the queue!\n\n' +
                    await QueueRepository.getAllBallChasersInQueue());

            await buttonInteraction.update({ embeds: [embed], components: [row1, row2] })
            break;
        }

        case 'listQueue': {
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
                    new MessageButton()
                        .setCustomId('listQueue')
                        .setLabel('List')
                        .setStyle('PRIMARY'),
                );

            const row2 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('top5')
                        .setLabel('Top 5')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setCustomId('help')
                        .setLabel('Help')
                        .setStyle('SECONDARY'),
                );

            const embed = new MessageEmbed()
                .setColor('#5865f2') // <- This is blurple
                .setTitle('List Of The Current Queue')
                .setDescription('Click the green button to join the queue!\n\n' +
                    await QueueRepository.getAllBallChasersInQueue() + ' h\n\n h\n\n h')

            await buttonInteraction.update({ embeds: [embed], components: [row1, row2] })
            break;
        }

        case 'top5': {
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
                    new MessageButton()
                        .setCustomId('listQueue')
                        .setLabel('List')
                        .setStyle('PRIMARY'),
                );

            const row2 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('top5')
                        .setLabel('Top 5')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setCustomId('help')
                        .setLabel('Help')
                        .setStyle('SECONDARY'),
                );

            const embed = new MessageEmbed()
                .setColor('#5865f2') // <- This is blurple
                .setTitle('Top 5')
                .setDescription('Click the green button to join the queue!\n\n' +
                    await QueueRepository.getAllBallChasersInQueue() + ' h\n\n h\n\n h')

            await buttonInteraction.update({ embeds: [embed], components: [row1, row2] })
            break;
        }

        case 'help': {
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
                    new MessageButton()
                        .setCustomId('listQueue')
                        .setLabel('List')
                        .setStyle('PRIMARY'),
                );

            const row2 = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('top5')
                        .setLabel('Top 5')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setCustomId('help')
                        .setLabel('Help')
                        .setStyle('SECONDARY'),
                );

            const embed = new MessageEmbed()
                .setColor('#5865f2') // <- This is blurple
                .setTitle('Help')
                .setDescription('Click the green button to join the queue!\n\n' +
                    await QueueRepository.getAllBallChasersInQueue() + ' h\n\n h\n\n h')

            await buttonInteraction.update({ embeds: [embed], components: [row1, row2] })
            break;
        }
    }
})

NormClient.login(process.env.token);
