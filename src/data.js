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
	constructor(inputData) {
		// properties
		this.categories = [];
		inputData.docs.forEach(category => {
			this.categories.push(new CategoryItem(category));
		});

		this.savePath = null;
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
		this.entires = [];
		inputData.entires.forEach(element => {
			if (element.hasOwnProperty('title', 'link', 'flag')) {
				this.entires.push(new DocumentEntry(element));
			} else if (element.hasOwnProperty('title', 'enum', 'links')) {
				this.entires.push(new DocumentEntryList(element));
			} else {
				// TODO: throw error
			}
		});

		this.courseId = inputData.course;
		this.courseDescription = inputData.description;
		this.lastUpdatedDate = new Date(inputData.date);
	}

	/* Returns packed object to be saved
	 * @return object
	 */
	packData() {
		let entriesList = [];
		this.entires.forEach(element => {
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
				this.flag = flag;
			}
		};

		this.title = inputData.title;
		this.subEntires = [];

		const el = inputData.enum.length;
		const ll = inputData.links.length;
		if (el === ll) {
			let i = 0;
			for (; i < el; i++) {
				this.subEntires.push(new this.subEntry(
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

		this.subEntires.forEach(element => {
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