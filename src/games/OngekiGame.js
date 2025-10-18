const { GameEngine } = require('../core/GameEngine.js');

// Ongeki 遊戲配置
const ongekiConfig = {
    gameKey: 'ongeki',
    gameName: 'Ongeki',
    gameNameJP: 'オンゲキ',
    apiUrl: 'https://info-ongeki.sega.jp/wp-json/thistheme/v1/articlesRest',
    avatarUrl: 'https://www.google.com/s2/favicons?sz=64&domain=ongeki.sega.jp',
    thumbnailUrl: 'https://chunithm.sega.jp/$site/components/chuniNavi/logo.png',
    color: 0xF087EE,
    dbField: 'ongeki',
    hasPermalink: true
};

// 創建 Ongeki 實例
const ongekiGame = new GameEngine(ongekiConfig);

async function ongeki(client) {
    await ongekiGame.run(client);
}

module.exports = {
    ongeki: ongeki
};
