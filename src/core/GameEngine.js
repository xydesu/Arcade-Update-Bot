// 遊戲引擎基礎類，用於減少重複代碼
const {
    getChannelIds
} = require('../utils/ChannelHelper.js');
const {
    download
} = require('../services/DataFetcher.js');
const {
    compareJson
} = require('../utils/JsonComparator.js');
const {
    getChannelSettings
} = require('../models/DatabaseManager.js');
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');
const {
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

class GameEngine {
    constructor(config) {
        this.gameKey = config.gameKey;
        this.gameName = config.gameName;
        this.gameNameJP = config.gameNameJP;
        this.apiUrl = config.apiUrl;
        this.avatarUrl = config.avatarUrl;
        this.thumbnailUrl = config.thumbnailUrl;
        this.color = config.color;
        this.dbField = config.dbField;
        this.hasPermalink = config.hasPermalink !== false; // 默認為 true
        this.customImageUrl = config.customImageUrl; // 自定義圖片URL函數
    }

    async run(client) {
        try {
            console.log(`[INFO] Starting ${this.gameName} check...`);
            await download(this.gameKey, this.apiUrl);
            await compareJson(this.gameKey);

            const channelIds = await getChannelIds();
            if (channelIds.length === 0) {
                console.error(`[ERROR] No channels found in the database for ${this.gameName}.`);
                return;
            }

            await this.loadImages(channelIds, client);
            console.log(`[INFO] ${this.gameName} check completed.`);
        } catch (error) {
            console.error(`[ERROR] Error in ${this.gameName}:`, error);
            fs.appendFileSync('error.log', `[${new Date().toISOString()}] ${this.gameName} error: ${error.message}\n${error.stack}\n`);
        }
    }

    async loadImages(channelIds, client) {
        try {
            const newObjectsPath = `./json/${this.gameKey}/newObjects.json`;
            if (!fs.existsSync(newObjectsPath)) {
                console.log(`[INFO] ${this.gameName} newObjects.json not found, skipping!`);
                return;
            }

            const data = JSON.parse(fs.readFileSync(newObjectsPath));
            const imageFolder = 'images';
            fs.mkdirSync(imageFolder, {
                recursive: true
            });

            for (const item of data) {
                const imageUrl = this.getImageUrl(item);
                if (!imageUrl) continue;

                console.log(`[INFO] Processing image for ${this.gameName}: ${imageUrl}`);

                try {
                    // 驗證圖片URL是否有效
                    await axios.get(imageUrl, {
                        responseType: 'arraybuffer'
                    });
                } catch (imageError) {
                    console.warn(`[WARN] Failed to fetch image for ${this.gameName}:`, imageError.message);
                    continue;
                }

                for (const channelId of channelIds) {
                    try {
                        const settings = await getChannelSettings(channelId);
                        if (settings && settings[this.dbField]) {
                            await this.postImageToDiscord(imageUrl, item, channelId, client);
                        }
                    } catch (err) {
                        console.error(`[ERROR] Error fetching channel settings for ${this.gameName}:`, err);
                    }
                }
            }
        } catch (err) {
            console.error(`[ERROR] Error in loadImages for ${this.gameName}:`, err);
        }
    }

    getImageUrl(item) {
        if (this.customImageUrl) {
            return this.customImageUrl(item);
        }
        return item.thumbnail;
    }

    // 自定義字段顯示，子類可以覆蓋此方法
    getCustomFields(item) {
        const fields = [];

        // 通用字段處理
        if (item.artist) {
            fields.push({
                name: "🎤 藝術家",
                value: item.artist,
                inline: true
            });
        }

        if (item.level || item.difficulty) {
            fields.push({
                name: "⭐ 難度",
                value: item.level || item.difficulty,
                inline: true
            });
        }

        if (item.bpm) {
            fields.push({
                name: "🎵 BPM",
                value: item.bpm.toString(),
                inline: true
            });
        }

        // 發佈日期
        if (item.releaseDate || item.date) {
            fields.push({
                name: "📅 發佈日期",
                value: item.releaseDate || item.date,
                inline: true
            });
        }

        // 版本資訊
        if (item.version) {
            fields.push({
                name: "🔢 版本",
                value: item.version,
                inline: true
            });
        }

        return fields;
    }

    // 記錄最後更新資訊
    recordLastUpdate(item) {
        const lastUpdatePath = './json/lastUpdates.json';
        let lastUpdates = {};

        // 讀取現有的最後更新記錄
        if (fs.existsSync(lastUpdatePath)) {
            try {
                lastUpdates = JSON.parse(fs.readFileSync(lastUpdatePath, 'utf8'));
            } catch (error) {
                console.warn('[WARN] Failed to read lastUpdates.json:', error.message);
            }
        }

        // 更新記錄
        lastUpdates[this.gameKey] = {
            gameName: this.gameName,
            gameNameJP: this.gameNameJP,
            lastItem: {
                title: item.title,
                artist: item.artist || null,
                thumbnail: this.getImageUrl(item)
            },
            lastUpdateTime: new Date().toISOString(),
            color: this.color,
            avatarUrl: this.avatarUrl
        };

        // 儲存更新記錄
        try {
            fs.writeFileSync(lastUpdatePath, JSON.stringify(lastUpdates, null, 2));
        } catch (error) {
            console.error('[ERROR] Failed to write lastUpdates.json:', error.message);
        }
    }

    // 獲取所有遊戲的最後更新資訊
    static getLastUpdates() {
        const lastUpdatePath = './json/lastUpdates.json';
        if (!fs.existsSync(lastUpdatePath)) {
            return {};
        }

        try {
            return JSON.parse(fs.readFileSync(lastUpdatePath, 'utf8'));
        } catch (error) {
            console.error('[ERROR] Failed to read lastUpdates.json:', error.message);
            return {};
        }
    }

    async postImageToDiscord(imageUrl, item, channelId, client) {
        try {
            console.log(`[INFO] Posting ${this.gameName} message to channel ${channelId}`);

            // 記錄最後更新資訊
            this.recordLastUpdate(item);

            // 創建更美觀的嵌入消息
            const embed = {
                title: `🎵 ${item.title}`,
                color: this.color,
                image: {
                    url: imageUrl
                },
                author: {
                    name: `${this.gameNameJP} 新增內容`,
                    icon_url: this.avatarUrl
                },
                fields: this.getCustomFields(item), // 使用自定義字段方法
                footer: {
                    text: `🕐 ${moment().format('YYYY-MM-DD HH:mm')}`,
                    icon_url: this.thumbnailUrl
                },
                timestamp: new Date().toISOString()
            };

            // 添加描述或永久連結
            if (this.hasPermalink && item.permalink) {
                embed.description = `🔗 [查看詳細資訊](${item.permalink})`;
            }

            const embedMessage = {
                embeds: [embed],
                username: this.gameNameJP,
                avatar_url: this.avatarUrl,
            };

            // 添加美化的按鈕組
            if (this.hasPermalink && item.permalink) {
                const linkButton = new ButtonBuilder()
                    .setLabel('📖 詳細資訊')
                    .setURL(item.permalink)
                    .setStyle(ButtonStyle.Link);

                embedMessage.components = [{
                    type: 1,
                    components: [linkButton]
                }];
            }

            const channel = client.channels.cache.get(channelId);
            if (!channel) {
                console.error(`[ERROR] Channel with ID ${channelId} not found for ${this.gameName}.`);
                fs.appendFileSync('error.log', `[${new Date().toISOString()}] Channel ${channelId} not found for ${this.gameName}.\n`);
                return;
            }

            await channel.send(embedMessage);
            console.log(`[INFO] ${this.gameName} message sent to channel ID ${channelId}`);
        } catch (error) {
            console.error(`[ERROR] Failed to send ${this.gameName} message:`, error);
            fs.appendFileSync('error.log', `[${new Date().toISOString()}] Failed to send ${this.gameName} message: ${error.message}\n`);
        }
    }
}

module.exports = {
    GameEngine
};