const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('檢查機器人的延遲狀況'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: '🏓 計算延遲中...', fetchReply: true });
        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const wsLatency = interaction.client.ws.ping;

        let latencyColor = 0x00FF00; // 綠色
        if (roundtripLatency > 200 || wsLatency > 200) {
            latencyColor = 0xFFFF00; // 黃色
        }
        if (roundtripLatency > 500 || wsLatency > 500) {
            latencyColor = 0xFF0000; // 紅色
        }

        const embed = {
            title: '🏓 Pong!',
            description: `**往返延遲:** ${roundtripLatency}ms\n**WebSocket 延遲:** ${wsLatency}ms`,
            color: latencyColor,
            timestamp: new Date(),
            footer: {
                text: 'Arcade Update Bot',
                icon_url: interaction.client.user.displayAvatarURL()
            }
        };

        await interaction.editReply({ content: '', embeds: [embed] });
    },
};
