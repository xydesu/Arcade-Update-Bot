const {
    GameEngine
} = require('../core/GameEngine.js');
const appConfig = require('../../config/appConfig.js');

// 從集中配置讀取 Maimai 設定
const maimaiGame = new GameEngine(appConfig.games.maimai);

async function maimai(client) {
    await maimaiGame.run(client);
}

module.exports = {
    maimai
};