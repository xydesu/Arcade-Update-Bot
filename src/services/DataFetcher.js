const fs = require('fs');
const axios = require('axios');

// 替換 node-fetch 為 axios，統一 HTTP 客戶端
async function download(folder, url) {
    try {
        fs.mkdirSync('./json/' + folder, {
            recursive: true
        });
        const response = await axios.get(url);
        fs.writeFileSync(`./json/${folder}/new.json`, JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('[ERROR] 下載檔案時發生錯誤:', error.message);
        fs.appendFileSync('error.log', `[${new Date().toISOString()}] Error downloading the file: ${error.message}\n`);
    }
}

module.exports = {
    download
};