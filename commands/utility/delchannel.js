const {SlashCommandBuilder} = require('@discordjs/builders');
const {PermissionsBitField} = require("discord.js");
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delchannel')
        .setDescription('Delete reminder from channel.'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({content: 'You do not have permission to use this command.', ephemeral: true});
        }
        
        const channelId = interaction.channel.id;

        // 使用 Promise 包裝數據庫操作以確保連接正確關閉
        const executeDbOperation = () => {
            return new Promise((resolve, reject) => {
                const db = new sqlite3.Database('database.db');
                const deleteQuery = `DELETE FROM channels WHERE ChannelId = ?;`;

                db.run(deleteQuery, [channelId], function (err) {
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
            return interaction.reply({content: 'Channel deleted successfully!', ephemeral: true});
        } catch (error) {
            console.error('Database error:', error);
            return interaction.reply({content: 'There was an error while deleting the channel.', ephemeral: true});
        }
    },
};
