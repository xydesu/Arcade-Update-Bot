const {
    SlashCommandBuilder,
    EmbedBuilder,
    ApplicationIntegrationType,
    InteractionContextType
} = require('discord.js');
const {
    getChannelIds
} = require('../../src/utils/ChannelHelper.js');
const {
    formatUptime
} = require('../../src/utils/Formatter.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('顯示機器人的詳細資訊')
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]),
    async execute(interaction) {
        try {
            const channelIds = await getChannelIds();
            const uptime = process.uptime();
            const uptimeString = formatUptime(uptime);

            const embed = new EmbedBuilder()
                .setTitle('🤖 Arcade Update Bot 資訊')
                .setColor(0x00AE86)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .addFields({
                    name: '📊 統計資料',
                    value: `**伺服器數量:** ${interaction.client.guilds.cache.size}\n**監控頻道:** ${channelIds.length}\n**運行時間:** ${uptimeString}`,
                    inline: true
                }, {
                    name: '⚡ 系統資訊',
                    value: `**Node.js:** ${process.version}\n**記憶體使用:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB\n**平台:** ${process.platform}`,
                    inline: true
                }, {
                    name: '🔧 機器人版本',
                    value: `**版本:** 2.0.0\n**更新頻率:** 每30分鐘\n**最後更新:** ${new Date().toLocaleDateString('zh-TW')}`,
                    inline: false
                }, {
                    name: '🌐 支援連結',
                    value: '[GitHub Repository](https://github.com/xydesu/Arcade-Update-Bot)\n[邀請機器人](https://discord.com/oauth2/authorize?client_id=1241736420004204564)',
                    inline: false
                })
                .setTimestamp()
                .setFooter({
                    text: 'Arcade Update Bot v2.0',
                    iconURL: interaction.client.user.displayAvatarURL()
                });

            await interaction.reply({
                embeds: [embed]
            });
        } catch (error) {
            console.error('Info command error:', error);
            await interaction.reply({
                content: '❌ 獲取資訊時發生錯誤，請稍後再試。',
                ephemeral: true
            });
        }
    },
};