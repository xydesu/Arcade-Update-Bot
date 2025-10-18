const { GameEngine } = require('../core/GameEngine.js');

// Maimai 遊戲配置
const maimaiConfig = {
    gameKey: 'mai',
    gameName: 'Maimai',
    gameNameJP: 'maimai でらっくす',
    apiUrl: 'https://info-maimai.sega.jp/wp-json/thistheme/v1/articlesRest',
    avatarUrl: 'https://www.google.com/s2/favicons?sz=64&domain=maimai.sega.jp',
    thumbnailUrl: 'https://maimai.sega.jp/storage/root/logo.png',
    color: 4571344,
    dbField: 'Maimai',
    hasPermalink: true
};

// 創建 Maimai 實例
const maimaiGame = new GameEngine(maimaiConfig);

async function maimai(client) {
    await maimaiGame.run(client);
}

module.exports = {
    maimai: maimai
};