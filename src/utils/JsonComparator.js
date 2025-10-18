const fs = require('fs-extra');

async function compareJson(folder) {
	try {
		//if old.json doesn't exist, rename new.json to old.json
		if (!fs.existsSync(`./json/${folder}/old.json`)) {
			fs.renameSync(`./json/${folder}/new.json`, `./json/${folder}/old.json`);
			console.log('[INFO] old.json not found, new.json renamed to old.json');
			return;
		}

		const oldData = JSON.parse(fs.readFileSync(`./json/${folder}/old.json`));
		const newData = JSON.parse(fs.readFileSync(`./json/${folder}/new.json`));

		//get new objects from newData that are not in oldData
		const newObjects = getNewData(oldData, newData);

		if (newObjects.length > 0) {
			console.log('[INFO] New Objects found:', newObjects);
			fs.writeFileSync(`./json/${folder}/newObjects.json`, JSON.stringify(newObjects, null, 2));
			fs.renameSync(`./json/${folder}/new.json`, `./json/${folder}/old.json`);
		} else {
			console.log('[INFO] No new objects found, skipping!');
			fs.writeFileSync(`./json/${folder}/newObjects.json`, JSON.stringify(newObjects, null, 2));
			fs.removeSync(`./json/${folder}/new.json`);
			//fs.renameSync(`./json/${folder}/new.json`, `./json/${folder}/old.json`);
		}
	} catch (error) {
		// save error to a log file, with timestamp and error message and stack trace
		fs.appendFileSync('error.log', `[${new Date().toISOString()}] ${error.message}\n${error.stack}\n`);
		console.error('Error comparing JSON files:', error.message);
	}
}

function getNewData(oldData, newData) {
	const oldDataSet = new Set(oldData.map(item => JSON.stringify(item)));
	return newData.filter(item => !oldDataSet.has(JSON.stringify(item)));
  }

module.exports = {
	compareJson: compareJson
}