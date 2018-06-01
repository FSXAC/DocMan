const electron = require('electron');
const { ipcRenderer } = electron;

const statusText = document.querySelector('#status-text');

const categoryList = document.querySelector('#category-list');
const courseList = document.querySelector('#courses-list');
const documentList = document.querySelector('#documents-list');

let g_docData;

// TODO: to be removed
ipcRenderer.on('document:add', (e, item)=>{
	const li = document.createElement('li');
	const itemText = document.createTextNode(item);
	li.appendChild(itemText);
	documentList.appendChild(li);
});

ipcRenderer.on('manifest:load', (e, data)=>{
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
		const newCategory = document.createElement('li');
		newCategory.appendChild(document.createTextNode(element.category));

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
		const newCourse = document.createElement('li');
		newCourse.appendChild(document.createTextNode(element.course + ': ' + element.description));

		newCourse.addEventListener('click', ()=> {
			clearList(documentList);
			populateEntries(element.entries);
		});

		courseList.appendChild(newCourse);
	});
}

function populateEntries(entries) {
	entries.forEach(element => {
		const newEntry = document.createElement('li');

		if (element.title !== undefined && element.title !== null && element.title !== '') {
			newEntry.appendChild(document.createTextNode(element.title));
			documentList.appendChild(newEntry);
		}

	});

	if (documentList.firstChild === null || documentList.firstChild === undefined) {
		const textNA = document.createElement('i');
		textNA.appendChild(document.createTextNode('No notes'));
		documentList.appendChild(textNA);
	}
}