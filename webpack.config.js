const path = require('path');

module.exports = {
	entry: {
		'theme': [''],
	},
	output: {
		path: path.join(__dirname, './dist/js/'),
		filename: '[name].min.js'
	},
	module: {
		loaders: [
			{
				test: path.join(__dirname),
				loader: 'babel-loader'
			}
		]
	}
};
