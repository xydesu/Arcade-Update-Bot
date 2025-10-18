const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addchannel')
        .setDescription('Add reminder to channel.'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_games')
            .setPlaceholder('Select games')
            .setMinValues(1)
            .setMaxValues(5)
            .addOptions([
                { label: 'Maimai', value: 'maimai' },
                { label: 'Maimai International', value: 'maimaiintl' },
                { label: 'Chunithm', value: 'chunithm' },
                { label: 'Chunithm International', value: 'chunithmintl' },
                { label: 'Ongeki', value: 'ongeki' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ content: 'Please select the games:', components: [row], ephemeral: true });

        const filter = i => i.customId === 'select_games' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const selectedGames = i.values;
            const channelId = interaction.channelId;
            const maimai = selectedGames.includes('maimai');
            const maimaiintl = selectedGames.includes('maimaiintl');
            const chunithm = selectedGames.includes('chunithm');
            const chunithmintl = selectedGames.includes('chunithmintl');
            const ongeki = selectedGames.includes('ongeki');

            // 使用 Promise 包裝數據庫操作以確保連接正確關閉
            const executeDbOperation = () => {
                return new Promise((resolve, reject) => {
                    const db = new sqlite3.Database('database.db');
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

                    db.run(insertQuery, [channelId, maimai, maimaiintl, chunithm, chunithmintl, ongeki], function (err) {
                        db.close(); // 確保關閉連接
                        if (err) {
                            console.error(err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            };

            try {
                await executeDbOperation();
                return i.reply({ content: 'Channel added successfully!', ephemeral: true });
            } catch (error) {
                console.error('Database error:', error);
                return i.reply({ content: 'There was an error while adding the channel.', ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'You did not select any games.', ephemeral: true });
            }
        });
    },
};