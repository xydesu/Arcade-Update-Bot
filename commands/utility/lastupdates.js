const { SlashCommandBuilder, EmbedBuilder, ApplicationIntegrationType, InteractionContextType } = require('discord.js');
const { GameEngine } = require('../../src/core/GameEngine.js');
const moment = require('moment');

// 設定中文本地化
moment.locale('zh-tw', {
    relativeTime: {
        future: '%s後',
        past: '%s前',
        s: '幾秒',
        ss: '%d秒',
        m: '1分鐘',
        mm: '%d分鐘',
        h: '1小時',
        hh: '%d小時',
        d: '1天',
        dd: '%d天',
        M: '1個月',
        MM: '%d個月',
        y: '1年',
        yy: '%d年'
    }
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lastupdates')
        .setDescription('查看各遊戲的最後更新通知')
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
        .addStringOption(option =>
            option.setName('game')
                .setDescription('選擇特定遊戲查看詳細資訊')
                .setRequired(false)
                .addChoices(
                    { name: '🎵 Maimai', value: 'mai' },
                    { name: '🌍 Maimai International', value: 'maiintl' },
                    { name: '🎹 Chunithm', value: 'chu' },
                    { name: '🌏 Chunithm International', value: 'chuintl' },
                    { name: '🎼 Ongeki', value: 'ongeki' }
                )),
    async execute(interaction) {
        try {
            const selectedGame = interaction.options.getString('game');
            const lastUpdates = GameEngine.getLastUpdates();

            if (Object.keys(lastUpdates).length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📝 遊戲更新記錄')
                    .setDescription('❌ 尚未有任何遊戲更新記錄')
                    .setColor(0xFF6B6B)
                    .setTimestamp()

                    .setFooter({ text: 'Arcade Update Bot', iconURL: interaction.client.user.displayAvatarURL() });

                await interaction.reply({ embeds: [embed] });
                return;
            }

            if (selectedGame) {
                // 顯示特定遊戲的詳細資訊
                const gameData = lastUpdates[selectedGame];
                if (!gameData) {
                    await interaction.reply({
                        content: '❌ 該遊戲尚未有更新記錄',
                        ephemeral: true
                    });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setTitle(`🎮 ${gameData.gameNameJP} 最後更新`)
                    .setColor(gameData.color)
                    .setThumbnail(gameData.avatarUrl)
                    .setTimestamp(new Date(gameData.lastUpdateTime))
                    .setFooter({ text: 'Arcade Update Bot', iconURL: interaction.client.user.displayAvatarURL() });

                if (gameData.lastItem.thumbnail) {
                    embed.setImage(gameData.lastItem.thumbnail);
                }

                embed.addFields(
                    { name: '🎵 最新內容', value: gameData.lastItem.title, inline: false }
                );

                if (gameData.lastItem.artist) {
                    embed.addFields(
                        { name: '🎤 藝術家', value: gameData.lastItem.artist, inline: true }
                    );
                }

                embed.addFields(
                    { name: '⏰ 更新時間', value: moment(gameData.lastUpdateTime).format('YYYY-MM-DD HH:mm:ss'), inline: true },
                    { name: '📅 相對時間', value: moment(gameData.lastUpdateTime).fromNow(), inline: true }
                );

                await interaction.reply({ embeds: [embed] });
            } else {
                // 顯示所有遊戲的概覽
                const embed = new EmbedBuilder()
                    .setTitle('🎮 遊戲最後更新概覽')
                    .setDescription('以下是各遊戲的最後更新時間')
                    .setColor(0x4ECDC4)
                    .setTimestamp()
                    .setFooter({ text: 'Arcade Update Bot', iconURL: interaction.client.user.displayAvatarURL() });

                const gameEmojis = {
                    'mai': '🎵',
                    'maiintl': '🌍',
                    'chu': '🎹',
                    'chuintl': '🌏',
                    'ongeki': '🎼'
                };

                let gamesList = '';
                const sortedGames = Object.entries(lastUpdates)
                    .sort(([, a], [, b]) => new Date(b.lastUpdateTime) - new Date(a.lastUpdateTime));

                for (const [gameKey, gameData] of sortedGames) {
                    const emoji = gameEmojis[gameKey] || '🎮';
                    const relativeTime = moment(gameData.lastUpdateTime).fromNow();
                    const title = gameData.lastItem.title.length > 25
                        ? gameData.lastItem.title.substring(0, 25) + '...'
                        : gameData.lastItem.title;

                    gamesList += `${emoji} **${gameData.gameName}**\n`;
                    gamesList += `   📝 ${title}\n`;
                    gamesList += `   ⏰ ${relativeTime}\n\n`;
                }

                embed.setDescription(gamesList);

                embed.addFields({
                    name: '💡 提示',
                    value: '使用 `/lastupdates game:[遊戲名稱]` 查看特定遊戲的詳細資訊',
                    inline: false
                });

                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('LastUpdates command error:', error);
            await interaction.reply({
                content: '❌ 查詢最後更新時發生錯誤，請稍後再試。',
                ephemeral: true
            });
        }
    },
};
