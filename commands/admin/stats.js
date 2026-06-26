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
    getAsync
} = require('../../src/models/DatabaseManager.js');
const {
    formatUptime
} = require('../../src/utils/Formatter.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('顯示機器人的詳細統計資料')
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]),
    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return await interaction.reply({
                content: '❌ 只有機器人擁有者才能使用此指令。',
                ephemeral: true
            });
        }

        try {
            await interaction.deferReply();

            const guilds = interaction.client.guilds.cache;
            const totalUsers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);
            const channelIds = await getChannelIds();

            const gameStats = await getGameSubscriptionStats();

            // 記憶體使用量
            const memUsage = process.memoryUsage();
            const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

            const embed = new EmbedBuilder()
                .setTitle('📊 機器人統計資料')
                .setColor(0x9932CC)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .addFields({
                    name: '🏠 伺服器統計',
                    value: `**伺服器總數:** ${guilds.size}\n**用戶總數:** ${totalUsers.toLocaleString()}\n**監控頻道:** ${channelIds.length}`,
                    inline: true
                }, {
                    name: '🎮 遊戲訂閱統計',
                    value: `🎵 **Maimai:** ${gameStats.Maimai}\n🌍 **Maimai Intl:** ${gameStats.Maimaiintl}\n🎹 **Chunithm:** ${gameStats.Chunithm}\n🌏 **Chunithm Intl:** ${gameStats.Chunithmintl}\n🎼 **Ongeki:** ${gameStats.ongeki}`,
                    inline: true
                }, {
                    name: '⚡ 系統資源',
                    value: `**記憶體:** ${heapUsedMB}MB / ${heapTotalMB}MB\n**運行時間:** ${formatUptime(process.uptime())}`,
                    inline: false
                })
                .setTimestamp()
                .setFooter({
                    text: 'Arcade Update Bot Statistics',
                    iconURL: interaction.client.user.displayAvatarURL()
                });

            await interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error('Stats command error:', error);
            await interaction.editReply({
                content: '❌ 獲取統計資料時發生錯誤。'
            });
        }
    },
};

async function getGameSubscriptionStats() {
    const query = `
        SELECT 
            SUM(Maimai) as Maimai,
            SUM(Maimaiintl) as Maimaiintl,
            SUM(Chunithm) as Chunithm,
            SUM(Chunithmintl) as Chunithmintl,
            SUM(ongeki) as ongeki
        FROM channels
    `;
    const row = await getAsync(query);
    return row || {
        Maimai: 0,
        Maimaiintl: 0,
        Chunithm: 0,
        Chunithmintl: 0,
        ongeki: 0
    };
}