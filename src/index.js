const electron = require('electron');
const { ipcRenderer } = electron;

const statusText = document.querySelector('#status-text');

const categoryList = document.querySelector('#category-list');
const courseList = document.querySelector('#courses-list');
const documentList = document.querySelector('#documents-list');

let g_docData;

ipcRenderer.on('documentList:load', (e, data)=>{
	statusText.innerHTML = 'loaded manifest';
	g_docData = data.docs;

	clearList(categoryList);
	clearList(courseList);
	clearList(documentList);
	populateCategories();
});

function clearList(list) {
	while (list.firstChild) {
		list.removeChild(list.firstChild);
	}
}

function populateCategories() {
	g_docData.forEach(element => {
		let newCategory = document.createElement('li');
		newCategory.classList.add('nav-item');

		let newCategoryA = document.createElement('a');
		newCategoryA.classList.add('nav-link', 'text-muted');
		newCategoryA.href = '#';
		newCategoryA.appendChild(document.createTextNode(element.category));

		newCategory.appendChild(newCategoryA);
		newCategory.addEventListener('click', ()=> {
			clearList(courseList);
			clearList(documentList);
			populateCourses(element.courses);
		});

		categoryList.appendChild(newCategory);
	});
}

function populateCourses(courses) {
	courses.forEach(element => {
		let newCourse = document.createElement('li');
		newCourse.classList.add('nav-item');

		let newCourseA = document.createElement('a');
		newCourseA.classList.add('nav-link', 'text-muted');
		newCourseA.href = '#';
		newCourseA.appendChild(document.createTextNode(element.course));

		// newCourse.appendChild(document.createTextNode(element.course + ': ' + element.description));
		newCourse.appendChild(newCourseA);
		newCourse.addEventListener('click', ()=> {
			clearList(documentList);
			populateEntries(element.entries);
		});

		courseList.appendChild(newCourse);
	});
}

function populateEntries(entries) {
	entries.forEach(element => {

		// TODO: allow series / enum entries
		if (element.title !== undefined && element.title !== null && element.title !== '') {
			let newEntry = document.createElement('li');
			newEntry.classList.add('nav-item');

			let newEntryA = document.createElement('a');
			newEntryA.classList.add('nav-link', 'text-muted');
			newEntryA.href = '#';
			newEntryA.appendChild(document.createTextNode(element.title));

			newEntry.appendChild(newEntryA);
			documentList.appendChild(newEntry);
		}
	});
}