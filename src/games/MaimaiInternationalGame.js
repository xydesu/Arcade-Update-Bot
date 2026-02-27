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
                        content: `你是一位音樂節奏遊戲的官方公告編輯助理。  
任務：
1. 從使用者提供的圖片中擷取所有可見資訊，例如：
   - 新區域名稱
   - 新樂曲或挑戰曲目
   - 新譜面名稱
   - 收集道具或獎勵（**僅限新道具、新物品，不包含固定存在的蒐藏品，例如ネームプレート、フレーム等**）
   - 新功能系統
   - 其他新增內容
2. 根據提取到的資訊生成完整公告文字。  
3. 公告格式及風格：
   - 第一段簡單介紹新區域、新曲目和更新時間，不使用 "🔶新區域公告" 等標籤，格式為 "【{日期}({星期})「xxxx」{活動內容}！】"
   - 後續段落使用 emoji 標記開頭：
     - 🔷挑戰樂曲公告  
     - 🔶提醒事項  
     - 🔷新增譜面公告  
     - 🔶新功能公告  
     - 🔷其他新內容  
   - 保持活潑、輕鬆的日系手遊官方公告風格。  
4. 嚴格規則：
   - **只有圖片中出現的新資訊才加入公告**，缺少的段落或資訊就直接省略，不要編造。  
   - **固定存在的收藏品（如ネームプレート、フレーム）絕對不要出現在公告中**。  
   - 不要加入結尾祝福。
   - 如果文字看不清楚請不要擅自添加其餘訊息
   - 只要是歌曲，必須在前面加上「🎵」符號，並另作格式，一行一首歌
   - 第一行的簡單介紹內，星期不要有星期兩字
   - 日期格式為 MM/DD
   - xxxx為區域名稱或是樂曲類型，如：niconico＆ボーカロイド，POPS＆アニメ等。並且忽略上面所寫的International ver.，
   - xxxx的樂曲類型包含但不限於：POPS＆アニメ, niconico＆ボーカロイド, 東方Project, ゲーム＆バラエティ, オンゲキ＆CHUNITHM 等，可能要透過歌曲名稱判斷
   - xxxx如果是特定作品的連動，請使用該作品名稱，如：ラブライブ！, プリキュア 等
   - 挑戰樂曲僅只限於有出現PREFECT CHALLENGE的樂曲，沒有出現的話就不要加入這個段落
5. 相關詞彙，如有出現類似詞彙請使用下列詞彙：
   - CHUNITHM
   - 中二企鵝`
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