const { GameEngine } = require('../core/GameEngine.js');

// Chunithm 遊戲配置
const chunithmConfig = {
    gameKey: 'chu',
    gameName: 'Chunithm',
    gameNameJP: 'CHUNITHM チュウニズム',
    apiUrl: 'https://info-chunithm.sega.jp/wp-json/thistheme/v1/articlesRest',
    avatarUrl: 'https://www.google.com/s2/favicons?sz=64&domain=chunithm.sega.jp',
    thumbnailUrl: 'https://chunithm.sega.jp/$site/components/chuniNavi/logo.png',
    color: 0xff2269,
    dbField: 'Chunithm',
    hasPermalink: true
};

// 創建 Chunithm 實例
const chunithmGame = new GameEngine(chunithmConfig);

async function chunithm(client) {
    await chunithmGame.run(client);
}

module.exports = {
    chunithm: chunithm
};
