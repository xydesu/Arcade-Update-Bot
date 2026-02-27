const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const {
    PermissionsBitField,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');
const {
    runAsync
} = require('../../src/models/DatabaseManager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addchannel')
        .setDescription('為此頻道新增遊戲更新通知'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({
                content: '❌ 你沒有權限使用此指令。',
                ephemeral: true
            });
        }

        // 使用 interaction.id 生成唯一 customId 避免碰撞
        const customId = `select_games_${interaction.id}`;

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder('選擇遊戲')
            .setMinValues(1)
            .setMaxValues(5)
            .addOptions([{
                    label: 'Maimai',
                    value: 'maimai'
                },
                {
                    label: 'Maimai International',
                    value: 'maimaiintl'
                },
                {
                    label: 'Chunithm',
                    value: 'chunithm'
                },
                {
                    label: 'Chunithm International',
                    value: 'chunithmintl'
                },
                {
                    label: 'Ongeki',
                    value: 'ongeki'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: '請選擇要接收通知的遊戲：',
            components: [row],
            ephemeral: true
        });

        const filter = i => i.customId === customId && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 60000
        });

        collector.on('collect', async i => {
            const selectedGames = i.values;
            const channelId = interaction.channelId;
            const maimai = selectedGames.includes('maimai');
            const maimaiintl = selectedGames.includes('maimaiintl');
            const chunithm = selectedGames.includes('chunithm');
            const chunithmintl = selectedGames.includes('chunithmintl');
            const ongeki = selectedGames.includes('ongeki');

            const insertQuery = `
                INSERT INTO channels (ChannelId, Maimai, Maimaiintl, Chunithm, Chunithmintl, ongeki) 
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(ChannelId) DO UPDATE SET
                  Maimai=excluded.Maimai,
                  Maimaiintl=excluded.Maimaiintl,
                  Chunithm=excluded.Chunithm,
                  Chunithmintl=excluded.Chunithmintl,
                  ongeki=excluded.ongeki;
            `;

            try {
                await runAsync(insertQuery, [channelId, maimai, maimaiintl, chunithm, chunithmintl, ongeki]);
                return i.reply({
                    content: '✅ 頻道已成功新增！',
                    ephemeral: true
                });
            } catch (error) {
                console.error('[ERROR] Database error:', error);
                return i.reply({
                    content: '❌ 新增頻道時發生錯誤。',
                    ephemeral: true
                });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({
                    content: '⏰ 未選擇任何遊戲，操作已逾時。',
                    ephemeral: true
                });
            }
        });
    },
};