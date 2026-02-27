const {
    GameEngine
} = require('../core/GameEngine.js');
const appConfig = require('../../config/appConfig.js');

// 從集中配置讀取 Ongeki 設定（已修正 thumbnailUrl 使用 Ongeki favicon）
const ongekiGame = new GameEngine(appConfig.games.ongeki);

async function ongeki(client) {
    await ongekiGame.run(client);
}

module.exports = {
    ongeki
};