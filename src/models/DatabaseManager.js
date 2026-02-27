// 單例資料庫連接管理器
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'database.db');

let db = null;

/**
 * 取得資料庫單例連接
 * @returns {sqlite3.Database}
 */
function getDb() {
    if (!db) {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('[ERROR] 無法連接資料庫:', err.message);
            } else {
                console.log('[INFO] 資料庫連接已建立');
                // 啟用 WAL 模式提升並行效能
                db.run('PRAGMA journal_mode=WAL');
            }
        });
    }
    return db;
}

/**
 * 初始化資料庫表格
 * @returns {Promise<void>}
 */
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const database = getDb();
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS channels (
            ChannelId TEXT PRIMARY KEY,
            Maimai BOOLEAN NOT NULL CHECK (Maimai IN (0, 1)),
            Maimaiintl BOOLEAN NOT NULL CHECK (Maimaiintl IN (0, 1)),
            Chunithm BOOLEAN NOT NULL CHECK (Chunithm IN (0, 1)),
            Chunithmintl BOOLEAN NOT NULL CHECK (Chunithmintl IN (0, 1)),
            ongeki BOOLEAN NOT NULL CHECK (ongeki IN (0, 1))
          );
        `;

        database.run(createTableQuery, (err) => {
            if (err) {
                console.error('[ERROR] 建立資料表失敗:', err.message);
                reject(err);
            } else {
                console.log('[INFO] 資料表已就緒');
                resolve();
            }
        });
    });
}

/**
 * Promise 封裝 db.all()
 * @param {string} query - SQL 查詢
 * @param {Array} params - 查詢參數
 * @returns {Promise<Array>}
 */
function allAsync(query, params = []) {
    return new Promise((resolve, reject) => {
        getDb().all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

/**
 * Promise 封裝 db.get()
 * @param {string} query - SQL 查詢
 * @param {Array} params - 查詢參數
 * @returns {Promise<object|undefined>}
 */
function getAsync(query, params = []) {
    return new Promise((resolve, reject) => {
        getDb().get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

/**
 * Promise 封裝 db.run()，回傳 { changes }
 * @param {string} query - SQL 查詢
 * @param {Array} params - 查詢參數
 * @returns {Promise<{changes: number}>}
 */
function runAsync(query, params = []) {
    return new Promise((resolve, reject) => {
        getDb().run(query, params, function (err) {
            if (err) reject(err);
            else resolve({
                changes: this.changes
            });
        });
    });
}

/**
 * 取得頻道設定
 * @param {string} channelId - 頻道 ID
 * @returns {Promise<object|undefined>}
 */
function getChannelSettings(channelId) {
    return getAsync('SELECT * FROM channels WHERE ChannelId = ?', [channelId]);
}

/**
 * 優雅關閉資料庫連接
 * @returns {Promise<void>}
 */
function close() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) reject(err);
                else {
                    db = null;
                    console.log('[INFO] 資料庫連接已關閉');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

module.exports = {
    getDb,
    initializeDatabase,
    allAsync,
    getAsync,
    runAsync,
    getChannelSettings,
    close
};