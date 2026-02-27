// 共用格式化工具

/**
 * 將秒數格式化為可讀的運行時間字串
 * @param {number} seconds - 運行秒數
 * @returns {string} 格式化後的時間字串
 */
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

module.exports = {
    formatUptime
};