const fs = require('fs');
const Youtube = require('youtube-search-api');
const ytdl = require('ytdl-core');

// 配置常量
const PRESENCE_CONFIG = {
    SONGS_PATH: './json/mai/maimaiSongs.json',
    BAR_LENGTH: 16,  // 適合音樂播放器的進度條長度
    MAX_DETAILS_LENGTH: 128,
    MAX_STATE_LENGTH: 64,
    UPDATE_INTERVAL: 1000, // 1秒
    SONG_CHANGE_INTERVAL: 5 * 60 * 1000 // 5分鐘
};

let currentUpdateTimer = null;
let songChangeTimer = null;

async function richpresence(client) {
    try {
        // 清除現有的定時器
        if (currentUpdateTimer) clearTimeout(currentUpdateTimer);
        if (songChangeTimer) clearTimeout(songChangeTimer);

        if (!fs.existsSync(PRESENCE_CONFIG.SONGS_PATH)) {
            console.error('[ERROR] maimaiSongs.json not found. Please run initsongs function first.');
            return;
        }

        const maimaiSongs = JSON.parse(fs.readFileSync(PRESENCE_CONFIG.SONGS_PATH, 'utf8'));
        if (!Array.isArray(maimaiSongs) || maimaiSongs.length === 0) {
            console.error('[ERROR] No songs found in maimaiSongs.json');
            return;
        }

        const song = maimaiSongs[Math.floor(Math.random() * maimaiSongs.length)];
        if (!song) {
            console.error('[ERROR] Failed to select a random song');
            return;
        }

        const title = song.title || 'Unknown';
        const artist = song.artist || 'Unknown';

        console.log(`[INFO] Setting rich presence to: ${title} by ${artist}`);

        let videoLength = '';
        let totalSeconds = 0;

        try {
            const searchQuery = `maimai 譜面確認用 外部出力 ${title}`;
            const results = await Youtube.GetListByKeyword(searchQuery, false, 1);
            
            if (results?.items?.length > 0) {
                const videoId = results.items[0].id;
                if (videoId) {
                    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    try {
                        const info = await ytdl.getInfo(videoUrl);
                        const seconds = parseInt(info.videoDetails.lengthSeconds, 10);
                        if (!isNaN(seconds) && seconds > 0) {
                            totalSeconds = seconds;
                            const min = Math.floor(seconds / 60);
                            const sec = seconds % 60;
                            videoLength = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
                        }
                    } catch (err) {
                        console.warn('[WARN] Failed to get video info from ytdl-core:', err.message);
                        // 嘗試從搜索結果獲取長度
                        if (results.items[0].length) {
                            videoLength = typeof results.items[0].length === 'string' 
                                ? results.items[0].length 
                                : results.items[0].length.simpleText || 'Unknown';
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('[WARN] Youtube search failed:', err.message);
        }

        // 解析視頻長度
        if (videoLength && videoLength !== 'Unknown' && videoLength.includes(':')) {
            const parts = videoLength.split(':');
            if (parts.length === 2) {
                const min = parseInt(parts[0], 10);
                const sec = parseInt(parts[1], 10);
                if (!isNaN(min) && !isNaN(sec)) {
                    totalSeconds = min * 60 + sec;
                }
            }
        }

        // 設置初始狀態
        await updatePresence(client, title, artist, 0, totalSeconds, videoLength);

        // 如果有視頻長度，啟動動態更新
        if (totalSeconds > 0) {
            startDynamicUpdate(client, title, artist, totalSeconds, videoLength);
        } else {
            // 如果沒有視頻長度，設置定時器在5分鐘後換歌
            songChangeTimer = setTimeout(() => {
                richpresence(client);
            }, PRESENCE_CONFIG.SONG_CHANGE_INTERVAL);
        }

    } catch (error) {
        console.error('[ERROR] Error in richpresence:', error);
        // 發生錯誤時，5分鐘後重試
        songChangeTimer = setTimeout(() => {
            richpresence(client);
        }, PRESENCE_CONFIG.SONG_CHANGE_INTERVAL);
    }
}

function startDynamicUpdate(client, title, artist, totalSeconds, videoLength) {
    let elapsed = 0;
    
    const updateLoop = async () => {
        await updatePresence(client, title, artist, elapsed, totalSeconds, videoLength);
        elapsed++;
        
        if (elapsed < totalSeconds) {
            currentUpdateTimer = setTimeout(updateLoop, PRESENCE_CONFIG.UPDATE_INTERVAL);
        } else {
            // 歌曲播完，換下一首
            richpresence(client);
        }
    };
    
    updateLoop();
}

async function updatePresence(client, title, artist, elapsed, totalSeconds, videoLength) {
    try {
        const currentMin = Math.floor(elapsed / 60);
        const currentSec = elapsed % 60;
        const currentTime = `${currentMin.toString().padStart(2, '0')}:${currentSec.toString().padStart(2, '0')}`;
        
        // 生成音樂播放器樣式的進度條
        let progressBar = '';
        let timeDisplay = '';
        
        if (totalSeconds > 0) {
            const progress = elapsed / totalSeconds;
            const pos = Math.floor(progress * PRESENCE_CONFIG.BAR_LENGTH);
            
            // 創建更像音樂播放器的進度條
            for (let i = 0; i < PRESENCE_CONFIG.BAR_LENGTH; i++) {
                if (i < pos) {
                    progressBar += '━'; // 已播放部分
                } else if (i === pos) {
                    progressBar += '●'; // 播放位置指示器
                } else {
                    progressBar += '─'; // 未播放部分
                }
            }
            
            // 音樂播放器樣式：時間 ━━━●─── 總時長
            timeDisplay = `${currentTime} ${progressBar} ${videoLength}`;
        } else {
            // 無時間資訊時的動畫效果
            const scrollPos = elapsed % PRESENCE_CONFIG.BAR_LENGTH;
            for (let i = 0; i < PRESENCE_CONFIG.BAR_LENGTH; i++) {
                if (i === scrollPos) {
                    progressBar += '♪';
                } else if (Math.abs(i - scrollPos) <= 1) {
                    progressBar += '♫';
                } else {
                    progressBar += '─';
                }
            }
            timeDisplay = `♪ ${progressBar} ♫`;
        }
        
        // 使用音樂播放器的標準配置
        const presenceData = {
            activities: [{
                name: `${title} — ${artist}`,  // 歌曲標題和藝術家在同一行
                type: 2, // LISTENING 類型
                state: timeDisplay, // 播放進度
            }],
            status: 'online',
        };
        
        // 如果有總時長，添加時間戳
        if (totalSeconds > 0) {
            const startTime = Date.now() - (elapsed * 1000);
            const endTime = startTime + (totalSeconds * 1000);
            
            presenceData.activities[0].timestamps = {
                start: startTime,
                end: endTime
            };
        }
        
        await client.user.setPresence(presenceData);
        
    } catch (error) {
        console.error('[ERROR] Failed to update presence:', error);
    }
}

// 清理函數
function cleanup() {
    if (currentUpdateTimer) {
        clearTimeout(currentUpdateTimer);
        currentUpdateTimer = null;
    }
    if (songChangeTimer) {
        clearTimeout(songChangeTimer);
        songChangeTimer = null;
    }
}

module.exports = {
    richpresence: richpresence,
    cleanup: cleanup
};