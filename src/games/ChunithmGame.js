const {
    GameEngine
} = require('../core/GameEngine.js');
const appConfig = require('../../config/appConfig.js');

// 從集中配置讀取 Chunithm 設定
const chunithmGame = new GameEngine(appConfig.games.chunithm);

async function chunithm(client) {
    await chunithmGame.run(client);
}

module.exports = {
    chunithm
};