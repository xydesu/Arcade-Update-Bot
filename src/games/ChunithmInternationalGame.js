const {
    GameEngine
} = require('../core/GameEngine.js');
const appConfig = require('../../config/appConfig.js');

// 從集中配置讀取 Chunithm International 設定
const chuintlGame = new GameEngine(appConfig.games.chuintl);

async function chuintl(client) {
    await chuintlGame.run(client);
}

module.exports = {
    chuintl
};