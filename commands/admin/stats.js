const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getChannelIds } = require('../../src/utils/ChannelHelper.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('顯示機器人的詳細統計資料'),
    async execute(interaction) {
        // 檢查權限（可選：只允許特定用戶查看）
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({
                content: '❌ 您需要管理員權限才能使用此指令。',
                ephemeral: true
            });
        }

        try {
            await interaction.deferReply();

            // 獲取基本統計
            const guilds = interaction.client.guilds.cache;
            const totalUsers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);
            const channelIds = await getChannelIds();
            
            // 獲取遊戲訂閱統計
            const gameStats = await getGameSubscriptionStats();
            
            const embed = new EmbedBuilder()
                .setTitle('📊 機器人統計資料')
                .setColor(0x9932CC)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .addFields(
                    {
                        name: '🏠 伺服器統計',
                        value: `**伺服器總數:** ${guilds.size}\n**用戶總數:** ${totalUsers.toLocaleString()}\n**監控頻道:** ${channelIds.length}`,
                        inline: true
                    },
                    {
                        name: '🎮 遊戲訂閱統計',
                        value: `🎵 **Maimai:** ${gameStats.Maimai}\n🌍 **Maimai Intl:** ${gameStats.Maimaiintl}\n🎹 **Chunithm:** ${gameStats.Chunithm}\n🌏 **Chunithm Intl:** ${gameStats.Chunithmintl}\n🎼 **Ongeki:** ${gameStats.ongeki}`,
                        inline: true
                    },
                    {
                        name: '⚡ 系統資源',
                        value: `**CPU 使用率:** ${(process.cpuUsage().user / 1000000).toFixed(2)}%\n**記憶體:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB / ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB\n**運行時間:** ${formatUptime(process.uptime())}`,
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: 'Arcade Update Bot Statistics', 
                    iconURL: interaction.client.user.displayAvatarURL() 
                });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Stats command error:', error);
            await interaction.editReply({
                content: '❌ 獲取統計資料時發生錯誤。'
            });
        }
    },
};

async function getGameSubscriptionStats() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('database.db');
        const query = `
            SELECT 
                SUM(Maimai) as Maimai,
                SUM(Maimaiintl) as Maimaiintl,
                SUM(Chunithm) as Chunithm,
                SUM(Chunithmintl) as Chunithmintl,
                SUM(ongeki) as ongeki
            FROM channels
        `;
        
        db.get(query, [], (err, row) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(row || { Maimai: 0, Maimaiintl: 0, Chunithm: 0, Chunithmintl: 0, ongeki: 0 });
            }
        });
    });
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days}天 ${hours}小時`;
    } else if (hours > 0) {
        return `${hours}小時 ${minutes}分鐘`;
    } else {
        return `${minutes}分鐘`;
    }
}
