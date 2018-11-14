'use strict';

var path = require('path'),
	rootPath = path.normalize(__dirname + '/../..');

module.exports = {
	templateEngine: 'swig',
	version: 'v1',
	activeProvider: '',
	root: rootPath,
	categoriesFilters: ['kashrut'],
	hierarchyFilters: {
		kashrut: {
			content: 'אוכל'
		}
	},
	searchQuery: {
		records: {
			default: {
				match: ['reindexTags.raw'],
				regexp: ['reindexTitle']
			},
			notOnlyCategoriesFilter: {
				match: ['reindexTitle'],
				plain: ['reindexTitle']
			}
		}
	},
	fieldsForIndex: {
		city: {
			index: 'reindex-cities', 
			type:'cities'
		}, 
		// languages: {
		// 	index: 'reindex-languages', 
		// 	type:'languages',
		// 	separator: ','
		// }
	},
	queues: [
		// {
		//   name: 'reindex-module',
		//   maxUnackMessages: 5
		// }
	],	
	schedules: [
		// {
		// 	name: 'reindex-module',
		// 	cron: '0 0 0 * * * *'
		// }
	],
	routes: [
		// {
		// 	module: 'reindex-module',
		// 	name: 'module'
		// }
	],
	inheritFunctions: {
		// importRecords: 'reindex-import-module',
	},
};