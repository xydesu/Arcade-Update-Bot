const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('搜尋 Maimai 歌曲')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('歌曲名稱或藝術家')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const query = interaction.options.getString('query').toLowerCase();
            const songsPath = './json/mai/maimaiSongs.json';

            if (!fs.existsSync(songsPath)) {
                return await interaction.reply({
                    content: '❌ 歌曲資料庫尚未初始化，請稍後再試。',
                    ephemeral: true
                });
            }

            const songs = JSON.parse(fs.readFileSync(songsPath, 'utf8'));
            const searchResults = songs.filter(song => 
                song.title?.toLowerCase().includes(query) || 
                song.artist?.toLowerCase().includes(query)
            ).slice(0, 10); // 限制結果數量

            if (searchResults.length === 0) {
                return await interaction.reply({
                    content: `❌ 找不到包含 "${query}" 的歌曲。`,
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`🔍 搜尋結果: "${query}"`)
                .setColor(0x7289DA)
                .setThumbnail('https://maimai.sega.jp/storage/root/logo.png')
                .setFooter({ 
                    text: `找到 ${searchResults.length} 首歌曲`, 
                    iconURL: interaction.client.user.displayAvatarURL() 
                })
                .setTimestamp();

            let description = '';
            searchResults.forEach((song, index) => {
                description += `**${index + 1}.** ${song.title}\n👤 ${song.artist || 'Unknown'} | 🎵 ${song.bpm || 'Unknown'} BPM\n\n`;
            });

            embed.setDescription(description);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Search command error:', error);
            await interaction.reply({
                content: '❌ 搜尋時發生錯誤，請稍後再試。',
                ephemeral: true
            });
        }
    },
};
