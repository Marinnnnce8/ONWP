const fs = require('fs');

module.exports = {
	productionBuild: false,
	partialSRCs: [],
	pagesSRCs: [],
	distAssets: {},
	warningTemp: 'src/config/cf-templates/warning-log-temp.txt',
	rf(src, callback) {
		fs.readFile(src, 'utf8', function(err, data) {
			if (!err) {
				callback(data);
			} else {
				console.log('ERROR: ', err);
			}
		});
	},
	logMSG(template, str, color = 'yellow') {
		module.exports.rf(template, function(data) {
			data = data.replace(new RegExp('@{str}', 'g'), str);
			color = color === 'yellow' ? '\x1b[33m' : '\x1b[32m';

			console.log(color);
			console.log(data);
			console.log('\x1b[37m');
		});
	},
	createDistFolder() {
		if (!fs.existsSync('dist')) {
			fs.mkdirSync('./dist');
		}
		if (!fs.existsSync('dist/img')) {
			fs.mkdirSync('./dist/img');
		}
	}
};
