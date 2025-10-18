const fs = require('fs');
const Youtube = require('youtube-search-api');
const ytdl = require('ytdl-core');

// 配置常量
const PRESENCE_CONFIG = {
    SONGS_PATH: './json/mai/maimaiSongs.json',
    BAR_LENGTH: 26,
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
        
        // 生成動態進度條
        let bar = '';
        if (totalSeconds > 0) {
            const progress = elapsed / totalSeconds;
            const pos = Math.floor(progress * PRESENCE_CONFIG.BAR_LENGTH);
            
            // 添加動畫效果 - 讓進度條有移動感
            const animationOffset = Math.floor((elapsed % 4) / 2); // 每2秒切換一次
            
            for (let i = 0; i < PRESENCE_CONFIG.BAR_LENGTH; i++) {
                if (i < pos) {
                    bar += '█'; // 已完成部分
                } else if (i === pos) {
                    // 當前播放位置，添加動畫效果
                    bar += animationOffset === 0 ? '◉' : '●';
                } else {
                    bar += '░'; // 未完成部分
                }
            }
        } else {
            // 無時間資訊時顯示滾動動畫
            const scrollPos = elapsed % PRESENCE_CONFIG.BAR_LENGTH;
            for (let i = 0; i < PRESENCE_CONFIG.BAR_LENGTH; i++) {
                if (i === scrollPos) {
                    bar += '◉';
                } else if (Math.abs(i - scrollPos) <= 1) {
                    bar += '●';
                } else {
                    bar += '░';
                }
            }
        }
        
        let detailsStr = `${currentTime} ${bar} ${videoLength || '??:??'}`;
        if (detailsStr.length > PRESENCE_CONFIG.MAX_DETAILS_LENGTH) {
            detailsStr = detailsStr.slice(0, PRESENCE_CONFIG.MAX_DETAILS_LENGTH);
        }
        
        // 居中對齊
        let stateStr = detailsStr;
        if (stateStr.length < PRESENCE_CONFIG.MAX_STATE_LENGTH) {
            const totalPad = PRESENCE_CONFIG.MAX_STATE_LENGTH - stateStr.length;
            const leftPad = Math.floor(totalPad / 2);
            const rightPad = totalPad - leftPad;
            stateStr = ' '.repeat(leftPad) + stateStr + ' '.repeat(rightPad);
        }
        
        await client.user.setPresence({
            activities: [{
                name: `🎵 ${title} — ${artist}`,
                type: 2, // LISTENING
                state: stateStr,
            }],
            status: 'online',
        });
        
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