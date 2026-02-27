const fs = require('node:fs');
const path = require('node:path');
const {
    Client,
    Collection,
    Events,
    GatewayIntentBits
} = require('discord.js');
const dotenv = require('dotenv');
const schedule = require('node-schedule');

const {
    maimai
} = require('./src/games/MaimaiGame.js');
const {
    maiintl
} = require('./src/games/MaimaiInternationalGame.js');
const {
    chunithm
} = require('./src/games/ChunithmGame.js');
const {
    chuintl
} = require('./src/games/ChunithmInternationalGame.js');
const {
    ongeki
} = require('./src/games/OngekiGame.js');
const {
    checkchannels
} = require('./src/utils/ChannelValidator.js');
const {
    initsongs
} = require('./src/utils/SongInitializer.js');
const {
    richpresence
} = require('./src/services/PresenceService.js');
const {
    initializeDatabase,
    close: closeDb
} = require('./src/models/DatabaseManager.js');
const appConfig = require('./config/appConfig.js');

dotenv.config();

const token = process.env.BOTTOKEN;

// 檢查必要的環境變數
if (!token) {
    console.error('[FATAL] BOTTOKEN 環境變數未設定！');
    process.exit(1);
}

// 全域錯誤處理
process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERROR] 未處理的 Promise Rejection:', reason);
    fs.appendFileSync('error.log', `[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n${reason?.stack || ''}\n`);
});

process.on('uncaughtException', (error) => {
    console.error('[FATAL] 未捕獲的例外:', error);
    fs.appendFileSync('error.log', `[${new Date().toISOString()}] Uncaught Exception: ${error.message}\n${error.stack}\n`);
    // 優雅關閉後退出
    closeDb().finally(() => process.exit(1));
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// 排程器（在 main 之前宣告）
const sche = schedule.scheduleJob(appConfig.scheduler.frequency, () => {
    console.log('[INFO] 排程任務開始...');
    main();
});

client.once(Events.ClientReady, async readyClient => {
    console.log(`[INFO] 已登入為 ${readyClient.user.tag}`);

    // 初始化資料庫
    try {
        await initializeDatabase();
        console.log('[INFO] 資料庫初始化完成');
    } catch (error) {
        console.error('[FATAL] 資料庫初始化失敗:', error);
        process.exit(1);
    }

    // 啟動主要功能
    main();

    // 啟動 Rich Presence
    richpresence(client);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`[ERROR] 找不到指令: ${interaction.commandName}`);
            return;
        }

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`[ERROR] 找不到指令: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '執行指令時發生錯誤！',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '執行指令時發生錯誤！',
                ephemeral: true
            });
        }
    }
});

client.login(token);

// 主要功能
async function main() {
    try {
        await initsongs();
        await checkchannels(client);
        await maimai(client);
        await chunithm(client);
        await chuintl(client);
        await maiintl(client);
        await ongeki(client);
        console.log('[INFO] 目前時間: ' + new Date().toISOString());
        console.log('[INFO] 下次排程時間: ' + sche.nextInvocation());
    } catch (error) {
        console.error('[ERROR] main() 執行錯誤:', error);
        fs.appendFileSync('error.log', `[${new Date().toISOString()}] Main function error: ${error.message}\n${error.stack}\n`);
    }
}

// 優雅關閉
process.on('SIGINT', async () => {
    console.log('[INFO] 收到 SIGINT，正在關閉...');
    sche.cancel();
    await closeDb();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('[INFO] 收到 SIGTERM，正在關閉...');
    sche.cancel();
    await closeDb();
    process.exit(0);
});