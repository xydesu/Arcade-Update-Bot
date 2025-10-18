const { GameEngine } = require('../core/GameEngine.js');

// Chunithm International 遊戲配置
const chuintlConfig = {
    gameKey: 'chuintl',
    gameName: 'Chunithm International',
    gameNameJP: 'CHUNITHM チュウニズム',
    apiUrl: 'https://info-chunithm.sega.com/wp-json/thistheme/v1/articlesRest',
    avatarUrl: 'https://www.google.com/s2/favicons?sz=64&domain=chunithm.sega.com',
    thumbnailUrl: 'https://chunithm.sega.com/assets/img/top/kv_logo.png',
    color: 0xff2269,
    dbField: 'Chunithmintl',
    hasPermalink: true
};

// 創建 Chunithm International 實例
const chuintlGame = new GameEngine(chuintlConfig);

async function chuintl(client) {
    await chuintlGame.run(client);
}

module.exports = {
    chuintl: chuintl
};
