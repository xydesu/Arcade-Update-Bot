const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ApplicationIntegrationType, InteractionContextType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('查看機器人日誌')
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
        .addStringOption(option =>
            option.setName('type')
                .setDescription('選擇日誌類型')
                .setRequired(false)
                .addChoices(
                    { name: '錯誤日誌', value: 'error' },
                    { name: '完整日誌', value: 'full' },
                    { name: '最近活動', value: 'recent' }
                )),
    async execute(interaction) {
        // 檢查權限 (Bot Owner Only)
        const application = await interaction.client.application.fetch();
        if (interaction.user.id !== application.owner.id) {
            return await interaction.reply({
                content: '❌ 只有機器人擁有者才能查看日誌。',
                ephemeral: true
            });
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            const logType = interaction.options.getString('type') || 'recent';
            const errorLogPath = path.join(process.cwd(), 'error.log');

            switch (logType) {
                case 'error':
                    await handleErrorLogs(interaction, errorLogPath);
                    break;
                case 'full':
                    await handleFullLogs(interaction, errorLogPath);
                    break;
                case 'recent':
                    await handleRecentActivity(interaction);
                    break;
                default:
                    await interaction.editReply('❌ 無效的日誌類型。');
            }

        } catch (error) {
            console.error('Logs command error:', error);
            await interaction.editReply({
                content: '❌ 讀取日誌時發生錯誤。'
            });
        }
    },
};

async function handleErrorLogs(interaction, errorLogPath) {
    try {
        const exists = await fs.access(errorLogPath).then(() => true).catch(() => false);
        if (!exists) {
            const embed = new EmbedBuilder()
                .setTitle('📋 錯誤日誌')
                .setDescription('✅ 沒有發現任何錯誤記錄！機器人運行正常。')
                .setColor(0x00FF00)
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        const logContent = await fs.readFile(errorLogPath, 'utf-8');
        const lines = logContent.split('\n').filter(line => line.trim()).slice(-10);

        if (lines.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('📋 錯誤日誌')
                .setDescription('✅ 錯誤日誌檔案為空，機器人運行正常。')
                .setColor(0x00FF00)
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('⚠️ 最近的錯誤日誌')
            .setDescription(`\`\`\`\n${lines.join('\n').slice(-1800)}\n\`\`\``)
            .setColor(0xFF0000)
            .setTimestamp()
            .setFooter({ text: `顯示最近 ${lines.length} 條錯誤記錄` });

        // 如果日誌太長，提供檔案下載
        if (logContent.length > 2000) {
            const attachment = new AttachmentBuilder(errorLogPath, { name: 'error.log' });
            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });
        } else {
            await interaction.editReply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Error reading error log:', error);
        await interaction.editReply('❌ 無法讀取錯誤日誌檔案。');
    }
}

async function handleFullLogs(interaction, errorLogPath) {
    try {
        const attachment = new AttachmentBuilder(errorLogPath, { name: 'error.log' });
        const embed = new EmbedBuilder()
            .setTitle('📁 完整日誌檔案')
            .setDescription('完整的錯誤日誌檔案已附加在下方。')
            .setColor(0x5865F2)
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed],
            files: [attachment]
        });
    } catch (error) {
        console.error('Error sending full log:', error);
        await interaction.editReply('❌ 無法發送完整日誌檔案。');
    }
}

async function handleRecentActivity(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('📊 機器人最近活動')
        .setColor(0x9932CC)
        .addFields(
            {
                name: '⏰ 運行時間',
                value: formatUptime(process.uptime()),
                inline: true
            },
            {
                name: '💾 記憶體使用',
                value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                inline: true
            },
            {
                name: '🏠 連接的伺服器',
                value: `${interaction.client.guilds.cache.size} 個`,
                inline: true
            },
            {
                name: '⚡ 最後檢查時間',
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                inline: false
            }
        )
        .setTimestamp()
        .setFooter({
            text: '系統狀態正常',
            iconURL: interaction.client.user.displayAvatarURL()
        });

    await interaction.editReply({ embeds: [embed] });
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
        return `${days}天 ${hours}小時 ${minutes}分鐘`;
    } else if (hours > 0) {
        return `${hours}小時 ${minutes}分鐘`;
    } else {
        return `${minutes}分鐘`;
    }
}
