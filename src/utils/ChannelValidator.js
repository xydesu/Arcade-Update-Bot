const {getChannelIds} = require("./ChannelHelper");
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs'); // 添加缺失的 fs 引入

/**
 * Check the channels that the bot is in and log them to the console.
 * @param {Client} client The Discord client object.
 */
async function checkchannels(client) {
    try {
        const channelIds = await getChannelIds();
        const invalidChannels = [];

        channelIds.forEach(channelId => {
            // 檢查頻道是否仍然存在於任何伺服器中
            const channelExists = client.guilds.cache.some(guild => 
                guild.channels.cache.has(channelId)
            );

            if (!channelExists) {
                console.log(`[INFO] Channel ${channelId} not found, marking for deletion.`);
                invalidChannels.push(channelId);
            }
        });

        // 批量刪除無效頻道
        if (invalidChannels.length > 0) {
            await deleteInvalidChannels(invalidChannels);
        }
    } catch (error) {
        console.error('[ERROR] Error in checkchannels:', error);
        fs.appendFileSync('error.log', `[${new Date().toISOString()}] checkchannels error: ${error.message}\n${error.stack}\n`);
    }
}

/**
 * Delete invalid channels from database
 * @param {Array<string>} channelIds Array of channel IDs to delete
 */
async function deleteInvalidChannels(channelIds) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('database.db');
        const placeholders = channelIds.map(() => '?').join(',');
        const deleteQuery = `DELETE FROM channels WHERE ChannelId IN (${placeholders});`;

        db.run(deleteQuery, channelIds, function (err) {
            db.close(); // 確保關閉連接
            if (err) {
                fs.appendFileSync('error.log', `[${new Date().toISOString()}] Database deletion error: ${err.message}\n`);
                console.error('[ERROR] Database deletion error:', err.message);
                reject(err);
            } else {
                console.log(`[INFO] Successfully deleted ${this.changes} invalid channels from database.`);
                resolve();
            }
        });
    });
}

module.exports = {
    checkchannels: checkchannels
};