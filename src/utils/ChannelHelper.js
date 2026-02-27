const {
    allAsync
} = require('../models/DatabaseManager.js');

// 從資料庫取得所有頻道 ID
async function getChannelIds() {
    const rows = await allAsync('SELECT ChannelId FROM channels');
    return rows.map(row => BigInt(row.ChannelId).toString());
}

module.exports = {
    getChannelIds
};