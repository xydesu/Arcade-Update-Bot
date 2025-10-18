// 遊戲引擎基礎類，用於減少重複代碼
const { getChannelIds } = require('../utils/ChannelHelper.js');
const { download } = require('../services/DataFetcher.js');
const { compareJson } = require('../utils/JsonComparator.js');
const { getChannelSettings } = require('../models/DatabaseManager.js');
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');
const { ButtonBuilder, ButtonStyle } = require('discord.js');

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
            fs.mkdirSync(imageFolder, { recursive: true });

            for (const item of data) {
                const imageUrl = this.getImageUrl(item);
                if (!imageUrl) continue;

                console.log(`[INFO] Processing image for ${this.gameName}: ${imageUrl}`);

                try {
                    // 驗證圖片URL是否有效
                    await axios.get(imageUrl, { responseType: 'arraybuffer' });
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

    async postImageToDiscord(imageUrl, item, channelId, client) {
        try {
            console.log(`[INFO] Posting ${this.gameName} message to channel ${channelId}`);
            
            const embedMessage = {
                embeds: [
                    {
                        title: item.title,
                        ...(this.hasPermalink && item.permalink && { description: item.permalink }),
                        color: this.color,
                        image: { url: imageUrl },
                        author: { name: this.gameNameJP, icon_url: this.avatarUrl },
                        footer: { text: `Generated at ${moment().format('YYYY-MM-DD')}` },
                        thumbnail: { url: this.thumbnailUrl },
                    },
                ],
                username: this.gameNameJP,
                avatar_url: this.avatarUrl,
            };

            // 添加按鈕（如果有永久連結）
            if (this.hasPermalink && item.permalink) {
                const button = new ButtonBuilder()
                    .setLabel('閱讀更多')
                    .setURL(item.permalink)
                    .setStyle(ButtonStyle.Link);
                embedMessage.components = [{ type: 1, components: [button] }];
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

module.exports = { GameEngine };
