const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getChannelSettings } = require('../../src/models/DatabaseManager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('查看此頻道的遊戲通知設定狀態'),
    async execute(interaction) {
        try {
            const channelId = interaction.channelId;
            const settings = await getChannelSettings(channelId);

            const embed = new EmbedBuilder()
                .setTitle('🎮 頻道遊戲通知狀態')
                .setColor(0x00AE86)
                .setTimestamp()
                .setFooter({ text: 'Arcade Update Bot', iconURL: interaction.client.user.displayAvatarURL() });

            if (!settings) {
                embed.setDescription('❌ 此頻道尚未設定任何遊戲通知\n\n使用 `/addchannel` 來添加遊戲通知');
            } else {
                const games = [
                    { name: 'Maimai', value: settings.Maimai, emoji: '🎵' },
                    { name: 'Maimai International', value: settings.Maimaiintl, emoji: '🌍' },
                    { name: 'Chunithm', value: settings.Chunithm, emoji: '🎹' },
                    { name: 'Chunithm International', value: settings.Chunithmintl, emoji: '🌏' },
                    { name: 'Ongeki', value: settings.ongeki, emoji: '🎼' }
                ];

                const enabledGames = games.filter(game => game.value).map(game => `${game.emoji} ${game.name}`);
                const disabledGames = games.filter(game => !game.value).map(game => `${game.emoji} ${game.name}`);

                if (enabledGames.length > 0) {
                    embed.addFields({ name: '✅ 已啟用的遊戲', value: enabledGames.join('\n'), inline: true });
                }
                if (disabledGames.length > 0) {
                    embed.addFields({ name: '❌ 未啟用的遊戲', value: disabledGames.join('\n'), inline: true });
                }
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Status command error:', error);
            await interaction.reply({ 
                content: '❌ 查詢狀態時發生錯誤，請稍後再試。', 
                ephemeral: true 
            });
        }
    },
};
