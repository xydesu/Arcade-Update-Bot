const { SlashCommandBuilder, EmbedBuilder, ApplicationIntegrationType, InteractionContextType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('重新啟動機器人（僅限擁有者）')
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]),
    async execute(interaction) {
        // 只允許機器人擁有者使用
        if (interaction.user.id !== process.env.OWNER_ID) {
            return await interaction.reply({
                content: '❌ 只有機器人擁有者才能使用此指令。',
                ephemeral: true
            });
        }

        try {
            const embed = new EmbedBuilder()
                .setTitle('🔄 重新啟動中...')
                .setDescription('機器人將在幾秒鐘內重新啟動。\n請稍等片刻後再次嘗試使用指令。')
                .setColor(0xFF6B35)
                .setTimestamp()
                .setFooter({
                    text: '重啟由管理員觸發',
                    iconURL: interaction.user.displayAvatarURL()
                });

            await interaction.reply({ embeds: [embed] });

            console.log(`[INFO] Bot restart initiated by ${interaction.user.tag}`);

            // 給予時間讓回覆發送完成
            setTimeout(() => {
                process.exit(0); // 正常退出，讓 PM2 或其他進程管理器重啟
            }, 2000);

        } catch (error) {
            console.error('Restart command error:', error);
            await interaction.reply({
                content: '❌ 重啟過程中發生錯誤。',
                ephemeral: true
            });
        }
    },
};
