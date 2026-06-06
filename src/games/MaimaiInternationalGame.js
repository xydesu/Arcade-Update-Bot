const {
    GameEngine
} = require('../core/GameEngine.js');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const axios = require('axios');
const appConfig = require('../../config/appConfig.js');

dotenv.config();

const token = process.env.NVIDIA_API_KEY;

// 從 appConfig 讀取 OpenAI/NVIDIA 配置，設定 30 秒超時以防止請求卡死
const clientAI = new OpenAI({
    baseURL: appConfig.openai.endpoint,
    apiKey: token,
    timeout: 30000,
});

// 將圖片下載並轉換成 base64 格式，以確保 NVIDIA API 能正確讀取
async function imageToBase64(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const contentType = response.headers['content-type'] || 'image/jpeg';
        return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error(`[ERROR] Failed to convert image to base64: ${url}`, error);
        throw error;
    }
}

// MaimaiIntl 繼承遊戲引擎，覆寫特殊行為
class MaimaiIntlGame extends GameEngine {
    constructor(config) {
        super(config);
    }

    // 重寫圖片 URL 取得方法
    getImageUrl(item) {
        const year = item.date[0];
        const month = String(item.date[1]).padStart(2, '0');
        const day = String(item.date[2]).padStart(2, '0');
        
        // 基本的日期資料夾名稱 (例如 2026-04-24)
        let dateFolder = `${year}-${month}-${day}`;
        
        // 擷取 date 陣列的第四個元素（如果有的話，例如 5）
        const imageIndex = item.date[3];
        
        // 如果有索引值，就加在日期資料夾名稱的後面 (變成 2026-04-24-5)
        if (imageIndex) {
            dateFolder += `-${imageIndex}`;
        }

        // 取得預設的檔名 (通常是 pop.jpg)
        const fileName = item.thumb || 'pop.jpg';

        // 組合出最終正確的網址
        return `https://maimai.sega.com/assets/img/download/pop/download/${dateFolder}/${fileName}`;
    }

    // 重寫 Discord 發送方法以包含 AI 生成的公告
    async postImageToDiscord(imageUrl, item, channelId, client) {
        try {
            console.log(`[INFO] Posting ${this.gameName} message to channel ${channelId}`);

            const dateMatch = this.getImageUrl(item).match(/(\d{4}-\d{2}-\d{2})/);
            const date = (dateMatch && dateMatch[1]) || 'Unknown';

            // 在 JavaScript 端推算星期幾，以提高大模型生成的星期準確度
            let dateStr = date;
            if (date !== 'Unknown') {
                const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                const dateObj = new Date(date);
                const dayOfWeek = weekdays[dateObj.getDay()];
                dateStr = `${date} (星期${dayOfWeek})`;
            }

            // 呼叫 AI 生成公告
            const announcement = await this.generateAnnouncement(imageUrl, dateStr);

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
            console.log(`[INFO] Fetching and converting image to base64: ${imageUrl}`);
            const base64Image = await imageToBase64(imageUrl);

            console.log(`[INFO] Requesting AI announcement generation...`);
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
   - **日期來源**：使用使用者文字提供的更新時間（例如輸入 "2026-05-01 (星期五)"，應轉換為 "05/01(五)"）。
   - **星期格式**：僅保留單字（如：五），嚴禁出現「星期」或「週」字樣。
   - **標題內容判定優先級**：
     1. 若左下角有明確區域名稱（如：ドラゴンちほー4），優先使用該名稱。
     2. 若為 IP 連動，使用連動作品名（如：Paradigm: Reboot）。
     3. 若無上述資訊，則依歌曲類型分類（如：niconico＆ボーカロイド）。
   - **活動關鍵字**：必須使用繁體中文來表達活動類型（例如：「新增原創樂曲」、「連動活動」、「新曲開放」、「新增宴譜面」、「集章卡更新」、「新曲與對手登場」等），切勿直接保留日文原文。
   - **忽略字詞**：請忽略圖片中的 "International ver." 字樣。

2. **段落標籤與獲取方式分類**：
   - **🔷 挑戰樂曲公告**：僅限圖片標註 "PERFECT CHALLENGE" 的歌曲。
   - **🔷 其他新內容**：
     - 若標註「**すぐに遊べる新曲！**」，下方接續：「屆時將會馬上開放以下樂曲給大家：」。
     - 若標註「**ちほーを進めてゲット！**」或「**課題曲をクリアしてゲット！**」，下方接續：「亦可透過在地圖上的進度獲取以下樂曲：」。
   - **🔷 新增譜面公告**：
     - 僅限標註 Re:MASTER 或 宴 譜面時使用。
     - **針對「宴」譜面**：曲名前必須加上屬性標籤（例如：🎵「[鏡]曲名」或 🎵「[邪]曲名」）。
     - **注意**：當圖片包含上述日文標示（如「すぐに遊べる新曲！」、「課題曲をクリアしてゲット！」等）時，請直接使用對應的繁體中文接續句，絕對不要將該日文標示本身（例如「すぐに遊べる新曲！」日文原文）殘留在公告的任何地方。

3. **樂曲格式**：
   - 每首歌前加上「🎵」符號。
   - 曲名必須加上「」符號，後方可接續原圖中標記之作曲家資訊，例如：🎵「曲名」或 🎵「曲名」作曲家。
   - 一列僅限一首歌曲，曲名行中嚴禁夾雜任何額外的分類標籤、中日文修飾詞或符號（例如：不要寫成 "・[PERFECT CHALLENGE]🎵「曲名」" 或 "🎵「曲名」★"）。

# Strict Constraints
- **完全繁體中文化**：除了曲名、歌手名、版權標記之外，公告中所有說明文字、提示與補充說明必須全部翻譯為流暢自然的繁體中文，絕對禁止殘留 any 日文原文（例如將 "オトモダチ" 翻譯為 "對手對戰" 或 "好友對戰" 等）。
- **負向約束**：絕對禁止列出「ネームプレート (Name Plate)」與「フレーム (Frame)」等固定收藏品資訊。
- **真實性原則**：僅限圖片中明確可見的資訊。若文字模糊，寧可省略也不要編造。請注意修正 OCR 辨識可能產生的半形亂碼或明顯字元錯誤。
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
                                    url: base64Image
                                }
                            }
                        ]
                    }
                ],
                temperature: appConfig.openai.temperature,
                top_p: appConfig.openai.top_p,
                max_tokens: 16384
            });

            const reasoning = response.choices[0]?.message?.reasoning_content;
            if (reasoning) {
                process.stdout.write(reasoning + "\n");
            }

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