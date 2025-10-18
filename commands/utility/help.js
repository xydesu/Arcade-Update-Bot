const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('顯示機器人的使用說明'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Arcade Update Bot 使用說明')
            .setDescription('這個機器人會自動推送 SEGA 街機遊戲的最新更新資訊')
            .setColor(0x7289DA)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                {
                    name: '📋 基本指令',
                    value: `\`/addchannel\` - 為頻道添加遊戲通知\n\`/delchannel\` - 移除頻道的遊戲通知\n\`/status\` - 查看頻道通知狀態\n\`/lastupdates\` - 查看遊戲最後更新記錄\n\`/help\` - 顯示此說明`,
                    inline: false
                },
                {
                    name: '🎮 支援的遊戲',
                    value: `🎵 **Maimai** - 日版\n🌍 **Maimai International** - 國際版\n🎹 **Chunithm** - 日版\n🌏 **Chunithm International** - 國際版\n🎼 **Ongeki** - 音擊`,
                    inline: false
                },
                {
                    name: '⚙️ 管理指令',
                    value: `\`/ping\` - 檢查機器人延遲\n\`/info\` - 顯示機器人資訊\n\`/stats\` - 顯示統計資料`,
                    inline: false
                },
                {
                    name: '📝 注意事項',
                    value: '• 需要「管理頻道」權限才能設定通知\n• 機器人每30分鐘檢查一次更新\n• 通知會自動發送到已設定的頻道',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({
                text: 'Arcade Update Bot v2.0',
                iconURL: interaction.client.user.displayAvatarURL()
            });

        await interaction.reply({ embeds: [embed] });
    },
};
