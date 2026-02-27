const fs = require('fs');
const axios = require('axios');

async function initsongs() {
    const path = './json/mai';
    const url = 'https://otoge-db.net/maimai/data/music-ex.json';
    try {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, {
                recursive: true
            });
            console.log('[INFO] Created directory:', path);
        }

        const response = await axios.get(url);
        const data = response.data;

        fs.writeFileSync(`${path}/songlist.json`, JSON.stringify(data, null, 2));
        console.log('[INFO] Data written to songlist.json successfully');
    } catch (error) {
        console.error('[ERROR] Error fetching or writing data:', error.message);
    }

    // 過濾只保留 maimai 分類的歌曲
    let songlistRaw = JSON.parse(fs.readFileSync(`${path}/songlist.json`, 'utf8'));
    let songlist = Array.isArray(songlistRaw) ? songlistRaw : (Array.isArray(songlistRaw.songs) ? songlistRaw.songs : []);

    if (!Array.isArray(songlist) || songlist.length === 0) {
        console.warn('[WARN] songlist is not an array or is empty. Check the structure of songlist.json');
        return;
    }
    console.log(`[INFO] Found ${songlist.length} songs in songlist.json`);

    const maimaiSongs = songlist.filter(song => song.catcode === 'maimai').map(song => ({
        title: song.title,
        artist: song.artist,
        bpm: song.bpm
    }));
    const maimaiSongsPath = `${path}/maimaiSongs.json`;
    fs.writeFileSync(maimaiSongsPath, JSON.stringify(maimaiSongs, null, 2));
    console.log('[INFO] Filtered maimai songs written to maimaiSongs.json successfully');
}

module.exports = {
    initsongs
};