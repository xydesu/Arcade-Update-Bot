const {
    getChannelIds
} = require('./ChannelHelper');
const {
    runAsync
} = require('../models/DatabaseManager.js');
const fs = require('fs');

/**
 * 檢查頻道是否仍然有效，刪除無效頻道
 * @param {Client} client Discord 客戶端
 */
async function checkchannels(client) {
    try {
        const channelIds = await getChannelIds();
        const invalidChannels = [];

        channelIds.forEach(channelId => {
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
 * 從資料庫刪除無效頻道
 * @param {Array<string>} channelIds 要刪除的頻道 ID 陣列
 */
async function deleteInvalidChannels(channelIds) {
    try {
        const placeholders = channelIds.map(() => '?').join(',');
        const deleteQuery = `DELETE FROM channels WHERE ChannelId IN (${placeholders});`;
        const result = await runAsync(deleteQuery, channelIds);
        console.log(`[INFO] Successfully deleted ${result.changes} invalid channels from database.`);
    } catch (err) {
        fs.appendFileSync('error.log', `[${new Date().toISOString()}] Database deletion error: ${err.message}\n`);
        console.error('[ERROR] Database deletion error:', err.message);
    }
}

module.exports = {
    checkchannels
};