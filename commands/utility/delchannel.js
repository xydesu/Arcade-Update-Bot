const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const {
    PermissionsBitField
} = require('discord.js');
const {
    runAsync
} = require('../../src/models/DatabaseManager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delchannel')
        .setDescription('移除此頻道的遊戲更新通知'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({
                content: '❌ 你沒有權限使用此指令。',
                ephemeral: true
            });
        }

        const channelId = interaction.channel.id;

        try {
            await runAsync('DELETE FROM channels WHERE ChannelId = ?;', [channelId]);
            return interaction.reply({
                content: '✅ 頻道已成功移除！',
                ephemeral: true
            });
        } catch (error) {
            console.error('[ERROR] Database error:', error);
            return interaction.reply({
                content: '❌ 移除頻道時發生錯誤。',
                ephemeral: true
            });
        }
    },
};