const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('song')
        .setDescription('隨機顯示一首 Maimai 歌曲')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('選擇遊戲')
                .setRequired(false)
                .addChoices(
                    { name: 'Maimai', value: 'maimai' },
                    { name: 'All Games', value: 'all' }
                )),
    async execute(interaction) {
        try {
            const game = interaction.options.getString('game') || 'maimai';
            const songsPath = './json/mai/maimaiSongs.json';

            if (!fs.existsSync(songsPath)) {
                return await interaction.reply({
                    content: '❌ 歌曲資料庫尚未初始化，請稍後再試。',
                    ephemeral: true
                });
            }

            const songs = JSON.parse(fs.readFileSync(songsPath, 'utf8'));
            if (!songs || songs.length === 0) {
                return await interaction.reply({
                    content: '❌ 找不到歌曲資料。',
                    ephemeral: true
                });
            }

            const randomSong = songs[Math.floor(Math.random() * songs.length)];
            
            const embed = new EmbedBuilder()
                .setTitle('🎵 隨機歌曲')
                .setColor(0xFF6B9D)
                .addFields(
                    { name: '歌曲名稱', value: randomSong.title || 'Unknown', inline: false },
                    { name: '藝術家', value: randomSong.artist || 'Unknown', inline: true },
                    { name: 'BPM', value: randomSong.bpm ? randomSong.bpm.toString() : 'Unknown', inline: true }
                )
                .setFooter({ 
                    text: `來自 ${songs.length} 首歌曲中`, 
                    iconURL: interaction.client.user.displayAvatarURL() 
                })
                .setTimestamp();

            // 添加遊戲圖標
            if (game === 'maimai') {
                embed.setThumbnail('https://maimai.sega.jp/storage/root/logo.png');
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Song command error:', error);
            await interaction.reply({
                content: '❌ 獲取歌曲時發生錯誤，請稍後再試。',
                ephemeral: true
            });
        }
    },
};
