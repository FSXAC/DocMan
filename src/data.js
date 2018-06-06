'user strict';

const debug = true;

const fs = require('fs');

const DocumentEntryFlag = {
	'new': 'New',
	'draft': 'Draft'
};

/* DocumentList class wraps around all category and course data
 */
class DocumentList {

	/* Constructor
	 * @param inputData The JSON data for the whole document list
	 * @return undefined
	 */
	constructor(inputData, path) {

		// properties
		this.categories = [];
		inputData.docs.forEach(category => {
			this.categories.push(new CategoryItem(category));
		});

		let splitPath = path.split('\\');	// HACK: if on windows
		this.path = splitPath.slice(0, -1).join('\\');
		this.filename = splitPath.slice(-1);
	}

	/* This function returns the object to be JSONified and saved to file
	 * @return object
	 */
	packData() {
		let categoryDocList = [];
		this.categories.forEach(element => {
			categoryDocList.push(element.packData());
		});

		return { docs: categoryDocList };
	}

	/* Validate file paths and make sure they exist
	 */
	validateFiles() {

		const extensions = [
			'pdf',
			'html',
			'md'
		];

		const localPath = this.path;
		let validateSingleFile = function(filepath) {
			
			// HACK: TODO: this is shitty implementation that doesn't even work
			// TODO: TODO:
			// DELETION

			// let filename = filepath.split('/').splice(-1);
			// let extension = /(?:\.([^.]+))?$/.exec(filename)[0];
			// let fullpath = localPath + '\\' + filepath;
			let isValid = false;

			// FIXME:
			// fs.stat(fullpath, (error, stat)=> {
			// 	if (error === null) {
			// 		// exists
			// 		isValid = true;
					
			// 	} else if (error.code == 'ENOENT') {

			// 		// Doesn't exist
			// 		console.log('extension: ', extension);

			// 		// Doesn't have extension - try extensions
			// 		if (extension === undefined || extension === '') {
			// 			for (let i = 0; i < extensions.length; i++) {
			// 				if (validateSingleFile(fullpath + '.' + extensions[i])) {
			// 					isValid = true;
			// 				}
			// 			}
			// 		}
			// 	} else {
			// 		// TODO: throw error
			// 	}
			// });

			return isValid;
		}

		this.categories.forEach(category => {
			category.courses.forEach(course => {
				course.entries.forEach(entry => {
					if(entry instanceof DocumentEntry) {
						if (entry.link !== undefined && entry.link !== null) {
							
							// TODO: some way to join directory
							console.log(entry.link);
							console.log(validateSingleFile(entry.link));
						} else {
							// TODO: throw error
						}
					} else if (entry instanceof DocumentEntryList) {
						entry.subEntries.forEach(element => {
							// TODO: check directory
							if (element.link !== undefined) {
								// console.log(this.path + '\\' + element.link);
							}
						});
					} else {
						// TODO: throw error
					}
				});
			});
		});
	}
}

/* CategoryItem is the class that holds the colletion of courses
 */
class CategoryItem {

	/* Constructor
	 * @param inputData The input JSON data
	 */
	constructor(inputData) {

		this.courses = [];
		inputData.courses.forEach(course => {
			this.courses.push(new CourseItem(course));
		});

		this.categoryName = inputData.category;
	}

	/* This function returns the object to be JSONified and saved to file
	 * @return object
	 */
	packData() {
		let coursesList = [];
		this.courses.forEach(course => {
			coursesList.push(course.packData());
		});

		return {
			category: this.categoryName,
			courses: coursesList
		};
	}
}

/* Class that contains a single course along with its entries */
class CourseItem {
	/* Constructor
	 * @param inputData Input JSON data
	 */
	constructor(inputData) {

		this.entries = [];

		inputData.entries.forEach(element => {
			if (element.hasOwnProperty('title') && element.hasOwnProperty('link') && element.hasOwnProperty('flag')) {
				this.entries.push(new DocumentEntry(element));
			} else if (element.hasOwnProperty('title') && element.hasOwnProperty('enum') && element.hasOwnProperty('links')) {
				this.entries.push(new DocumentEntryList(element));
			} else {
				// TODO: throw error
			}
		});

		this.courseId = inputData.course;
		this.courseDescription = inputData.description;

		this.lastUpdatedDate = null;
		if (inputData.date !== '' && inputData.date !== null) {
			this.lastUpdatedDate = new Date(inputData.date);
		}
	}

	/* Returns packed object to be saved
	 * @return object
	 */
	packData() {
		let entriesList = [];
		this.entries.forEach(element => {
			entriesList.push(element.packData());
		});

		return {
			course: this.courseId,
			description: this.courseDescription,
			date: this.lastUpdatedDate,
			entries: entriesList
		};
	}
}

class DocumentEntry {
	/* Constructor
	 * @param inputData Input JSON data
	 */
	constructor(inputData) {

		this.title = inputData.title;
		this.link = inputData.link;
		this.linkValid = false;

		if (DocumentEntryFlag.hasOwnProperty(this.flag)) {
			this.flag = inputData.flag;
		} else {
			// TODO: throw error
		}
	}

	/* Returns packed object to be saved
	 * @return object
	 */
	packData() {
		return {
			title: this.title,
			link: this.link,
			flag: this.flag
		};
	}
}

class DocumentEntryList {
	/* Constructor
	 * @param inputData Input JSON data
	 */
	constructor(inputData) {

		/* SubEntry class specifically for sub entries */
		this.subEntry = class {
			constructor(number, link, flag) {
				this.number = number;
				this.link = link;
				this.linkValid = false;
				this.flag = flag;
			}
		};

		this.title = inputData.title;
		this.subEntries = [];

		const el = inputData.enum.length;
		const ll = inputData.links.length;
		if (el === ll) {
			let i = 0;
			for (; i < el; i++) {
				this.subEntries.push(new this.subEntry(
					inputData.enum[i],
					inputData.links[i],
					'' // TODO:
				));
			}
		} else {
			// TODO: throw error
		}
	}

	/* Returns packed object to be saved
	 * @return object
	 */
	packData() {
		let enumList = [];
		let linksList = [];
		let flagsList = [];

		this.subEntries.forEach(element => {
			enumList.push(element.number);
			linksList.push(element.link);
			flagsList.push(element.flag);
		});

		return {
			title: this.title,
			enum: enumList,
			links: linksList,
			flags: flagsList
		};
	}
}

// Export to be imported
module.exports = {
	DocumentList: DocumentList,
	CategoryItem: CategoryItem,
	CourseItem: CourseItem,
	DocumentEntry: DocumentEntry,
	DocumentEntryList: DocumentEntryList
};