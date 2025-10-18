// 應用程式配置文件
module.exports = {
    // 數據庫配置
    database: {
        filename: 'database.db',
        connectionTimeout: 10000 // 10秒超時
    },

    // 任務調度配置
    scheduler: {
        frequency: '*/30 * * * *', // 每30分鐘執行一次
        timezone: 'Asia/Taipei'
    },

    // 日誌配置
    logging: {
        errorLogFile: 'error.log',
        maxLogFileSize: 10 * 1024 * 1024, // 10MB
        logLevel: 'info'
    },

    // Discord 配置
    discord: {
        maxRetries: 3,
        retryDelay: 5000 // 5秒
    },

    // API 配置
    api: {
        timeout: 30000, // 30秒超時
        maxRetries: 3
    },

    // 遊戲配置
    games: {
        maimai: {
            gameKey: 'mai',
            gameName: 'Maimai',
            gameNameJP: 'maimai でらっくす',
            apiUrl: 'https://info-maimai.sega.jp/wp-json/thistheme/v1/articlesRest',
            avatarUrl: 'https://www.google.com/s2/favicons?sz=64&domain=maimai.sega.jp',
            thumbnailUrl: 'https://maimai.sega.jp/storage/root/logo.png',
            color: 4571344,
            dbField: 'Maimai',
            hasPermalink: true
        },
        chunithm: {
            gameKey: 'chu',
            gameName: 'Chunithm',
            gameNameJP: 'CHUNITHM チュウニズム',
            apiUrl: 'https://info-chunithm.sega.jp/wp-json/thistheme/v1/articlesRest',
            avatarUrl: 'https://www.google.com/s2/favicons?sz=64&domain=chunithm.sega.jp',
            thumbnailUrl: 'https://chunithm.sega.jp/$site/components/chuniNavi/logo.png',
            color: 0xff2269,
            dbField: 'Chunithm',
            hasPermalink: true
        },
        chuintl: {
            gameKey: 'chuintl',
            gameName: 'Chunithm International',
            gameNameJP: 'CHUNITHM チュウニズム',
            apiUrl: 'https://info-chunithm.sega.com/wp-json/thistheme/v1/articlesRest',
            avatarUrl: 'https://www.google.com/s2/favicons?sz=64&domain=chunithm.sega.com',
            thumbnailUrl: 'https://chunithm.sega.com/assets/img/top/kv_logo.png',
            color: 0xff2269,
            dbField: 'Chunithmintl',
            hasPermalink: true
        },
        ongeki: {
            gameKey: 'ongeki',
            gameName: 'Ongeki',
            gameNameJP: 'オンゲキ',
            apiUrl: 'https://info-ongeki.sega.jp/wp-json/thistheme/v1/articlesRest',
            avatarUrl: 'https://www.google.com/s2/favicons?sz=64&domain=ongeki.sega.jp',
            thumbnailUrl: 'https://chunithm.sega.jp/$site/components/chuniNavi/logo.png',
            color: 0xF087EE,
            dbField: 'ongeki',
            hasPermalink: true
        },
        maiintl: {
            gameKey: 'maiintl',
            gameName: 'Maimai International',
            gameNameJP: 'maimai でらっくす',
            apiUrl: 'https://maimai.sega.com/assets/data/index.json',
            avatarUrl: 'https://www.google.com/s2/favicons?sz=64&domain=maimai.sega.com',
            thumbnailUrl: 'https://maimai.sega.com/assets/img/prism/common/logo.png',
            color: 4571344,
            dbField: 'Maimaiintl',
            hasPermalink: false
        }
    },

    // OpenAI 配置
    openai: {
        endpoint: "https://models.github.ai/inference",
        model: "openai/gpt-4.1",
        temperature: 0.8,
        top_p: 1.0
    }
};
