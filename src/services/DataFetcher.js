const fs = require('fs');
const fetch = require('node-fetch');

async function download(folder, url) {
    try {
        fs.mkdirSync('./json/'+folder, { recursive: true });
        const response = await fetch(url);
        const json = await response.json();
        fs.writeFileSync(`./json/${folder}/new.json`, JSON.stringify(json, null, 2));
    } catch (error) {
        console.error('[ERROR] Error downloading the file:', error.message);
        // save error to a log file
        fs.appendFileSync('error.log', `[${new Date().toISOString()}] Error downloading the file: ${error.message}\n`);
    }
}

module.exports = {
    download: download
}