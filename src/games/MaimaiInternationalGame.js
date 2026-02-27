const {
    GameEngine
} = require('../core/GameEngine.js');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const appConfig = require('../../config/appConfig.js');

dotenv.config();

const token = process.env.GITHUB_TOKEN;

// 從 appConfig 讀取 OpenAI 配置
const clientAI = new OpenAI({
    baseURL: appConfig.openai.endpoint,
    apiKey: token,
});

// MaimaiIntl 繼承遊戲引擎，覆寫特殊行為
class MaimaiIntlGame extends GameEngine {
    constructor(config) {
        super(config);
    }

    // 重寫圖片 URL 取得方法（修復：不修改原陣列）
    getImageUrl(item) {
        const year = item.date[0];
        const month = String(item.date[1]).padStart(2, '0');
        const day = String(item.date[2]).padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        return `https://maimai.sega.com/assets/img/download/pop/download/${date}/pop.jpg`;
    }

    // 重寫 Discord 發送方法以包含 AI 生成的公告
    async postImageToDiscord(imageUrl, item, channelId, client) {
        try {
            console.log(`[INFO] Posting ${this.gameName} message to channel ${channelId}`);

            const dateMatch = this.getImageUrl(item).match(/(\d{4}-\d{2}-\d{2})/);
            const date = (dateMatch && dateMatch[1]) || 'Unknown';

            // 呼叫 AI 生成公告
            const announcement = await this.generateAnnouncement(imageUrl, date);

            const embedMessage = {
                content: announcement,
                embeds: [{
                    title: item.title,
                    color: this.color,
                    image: {
                        url: imageUrl
                    },
                    author: {
                        name: this.gameNameJP,
                        icon_url: this.avatarUrl
                    },
                    footer: {
                        text: `Generated at ${new Date().toISOString().split('T')[0]}`
                    },
                    thumbnail: {
                        url: this.thumbnailUrl
                    },
                }, ],
                username: this.gameNameJP,
                avatar_url: this.avatarUrl,
            };

            const channel = client.channels.cache.get(channelId);
            if (!channel) {
                console.error(`[ERROR] Channel with ID ${channelId} not found for ${this.gameName}.`);
                return;
            }

            await channel.send(embedMessage);
            console.log(`[INFO] ${this.gameName} message sent to channel ID ${channelId}`);
        } catch (error) {
            console.error(`[ERROR] Failed to send ${this.gameName} message:`, error);
        }
    }

    // AI 生成公告文字
    async generateAnnouncement(imageUrl, date) {
        try {
            const response = await clientAI.chat.completions.create({
                model: appConfig.openai.model,
                messages: [{
                        role: "system",
                        content: `# Role
你是一位專門負責《maimai DX》國際版官方社群的公告編輯助理。你的任務是將遊戲更新圖檔轉化為活潑、專業且格式統一的繁體中文公告。

# Task
根據使用者輸入的「更新時間」以及「活動圖片」內容，精確擷取資訊並生成公告。

# Format Rules
1. **首段格式**：【{MM/DD}({週幾})「{標題內容}」{活動關鍵字}！】
   - **日期來源**：使用使用者文字提供的更新時間。
   - **星期格式**：僅保留單字（如：五），嚴禁出現「星期」或「週」字樣。
   - **標題內容判定優先級**：
     1. 若左下角有明確區域名稱（如：ドラゴンちほー4），優先使用該名稱。
     2. 若為 IP 連動，使用連動作品名（如：Paradigm: Reboot）。
     3. 若無上述資訊，則依歌曲類型分類（如：niconico＆ボーカロイド）。
   - **忽略字詞**：請忽略圖片中的 "International ver." 字樣。

2. **段落標籤與獲取方式分類**：
   - **🔷 挑戰樂曲公告**：僅限圖片標註 "PERFECT CHALLENGE" 的歌曲。
   - **🔷 其他新內容**：
     - 若標註「**すぐに遊べる新曲！**」，下方接續：「屆時將會馬上開放以下樂曲給大家：」。
     - 若標註「**ちほーを進めてゲット！**」或「**課題曲をクリアしてゲット！**」，下方接續：「亦可透過在地圖上的進度獲取以下樂曲：」。
   - **🔷 新增譜面公告**：
     - 僅限標註 Re:MASTER 或 宴 譜面時使用。
     - **針對「宴」譜面**：曲名前必須加上屬性標籤（例如：🎵「[覚]曲名」或 🎵「[待]曲名」）。

3. **樂曲格式**：
   - 每首歌前加上「🎵」符號。
   - 曲名必須加上「」符號，例如：🎵「曲名」。
   - 一列僅限一首歌曲。

# Strict Constraints
- **負向約束**：絕對禁止列出「ネームプレート (Name Plate)」與「フレーム (Frame)」等固定收藏品資訊。
- **真實性原則**：僅限圖片中明確可見的資訊。若文字模糊，寧可省略也不要編造。
- **簡潔原則**：不要加入結尾祝福語。
- **語調**：保持日系手遊官方的輕鬆、熱情風格，適度使用驚嘆號。`
                    },
                    {
                        role: "user",
                        content: [{
                                type: "text",
                                text: `更新時間： ${date}\n請根據這張活動圖片內容生成公告：`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageUrl
                                }
                            }
                        ]
                    }
                ],
                temperature: appConfig.openai.temperature,
                top_p: appConfig.openai.top_p,
            });

            return response.choices[0].message.content || "（AI 未能生成公告）";
        } catch (err) {
            console.error("[AI Error]", err);
            return "（公告生成失敗）";
        }
    }
}

// 從 appConfig 讀取 Maimai International 配置
const maiintlGame = new MaimaiIntlGame(appConfig.games.maiintl);

async function maiintl(client) {
    await maiintlGame.run(client);
}

module.exports = {
    maiintl
};