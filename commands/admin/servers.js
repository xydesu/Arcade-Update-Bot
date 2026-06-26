const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ApplicationIntegrationType, InteractionContextType } = require('discord.js');
const { getChannelIds } = require('../../src/utils/ChannelHelper.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servers')
        .setDescription('顯示機器人加入的所有伺服器列表')
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
            await interaction.deferReply({ ephemeral: true });

            const guilds = interaction.client.guilds.cache;
            const channelIds = await getChannelIds();

            let description = '';
            const guildArray = Array.from(guilds.values());

            for (let i = 0; i < Math.min(guildArray.length, 20); i++) {
                const guild = guildArray[i];
                const hasBot = channelIds.some(id => {
                    const channel = interaction.client.channels.cache.get(id);
                    return channel && channel.guild.id === guild.id;
                });

                const botStatus = hasBot ? '✅' : '❌';
                description += `${botStatus} **${guild.name}**\n`;
                description += `　└ 👥 ${guild.memberCount} 成員 | 📅 ${guild.createdAt.toLocaleDateString('zh-TW')}\n\n`;
            }

            if (guildArray.length > 20) {
                description += `*... 還有 ${guildArray.length - 20} 個伺服器*`;
            }

            const embed = new EmbedBuilder()
                .setTitle('🏰 伺服器列表')
                .setDescription(description || '沒有找到任何伺服器。')
                .setColor(0x5865F2)
                .addFields({
                    name: '📊 總計',
                    value: `**伺服器總數:** ${guilds.size}\n**活躍監控:** ${channelIds.length} 個頻道`,
                    inline: false
                })
                .setTimestamp()
                .setFooter({
                    text: '✅ = 已設定監控頻道 | ❌ = 未設定監控頻道',
                    iconURL: interaction.client.user.displayAvatarURL()
                });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Servers command error:', error);
            await interaction.editReply({
                content: '❌ 獲取伺服器列表時發生錯誤。'
            });
        }
    },
};
