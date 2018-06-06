
// Electron on IPC renderer
const electron = require('electron');
const { ipcRenderer } = electron;

// jQuery
if (!window.$ || !window.jQuery) {
	window.$ = window.jQuery = require('jquery');
}

// DOM element references
let $statusText = $('#status-text');

let $categoryList = $('#category-list');
let $courseList = $('#course-list');
let $documentList = $('#document-list');

let $categoryListContainer = $('#category-list-container');
let $courseListContainer = $('#course-list-container');
let $documentListContainer = $('#document-list-container');

let $mainPanelContainer = $('#main-panel-container');

let $uninitPlacement = $('#uninit-placement');

let $allSidebarSticky = $('.sidebar-sticky');

// Data
let g_docData;

// ICP handlers for signals
ipcRenderer.on('documentList:load', (e, data)=>{
	$statusText.innerHTML = 'loaded manifest';
	g_docData = data.docs;

	$categoryList.empty();
	$courseList.empty();
	$documentList.empty();
	populateCategories();

	setState(ViewStates.init);
});

// REFACTOR:
function populateCategories() {
	setState(ViewStates.category);

	g_docData.forEach(element => {
		let newCategory = document.createElement('li');
		newCategory.classList.add('nav-item');

		let newCategoryA = document.createElement('a');
		newCategoryA.classList.add('nav-link', 'text-muted');
		newCategoryA.href = '#';
		newCategoryA.appendChild(document.createTextNode(element.category));

		newCategory.appendChild(newCategoryA);
		newCategory.addEventListener('click', ()=> {
			$courseList.empty();
			$documentList.empty();
			populateCourses(element.courses);
		});

		$categoryList.append(newCategory);
	});

}

// REFACTOR:
function populateCourses(courses) {
	setState(ViewStates.course);

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
			$documentList.empty();
			populateEntries(element.entries);
		});

		$courseList.append(newCourse);
	});

}

// REFACTOR:
function populateEntries(entries) {
	setState(ViewStates.document);

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
			$documentList.append(newEntry);
		}
	});

}

// TODO: maybe use a class ???
// View state machine
// Different states
const ViewStates = {
	uninit: 'uninit',
	init: 'init',
	category: 'category',
	course: 'course',
	document: 'document'
}
let currentState = ViewStates.uninit;
updateStateOutput();

function setState(state) {
	if (!ViewStates.hasOwnProperty(state))
		return;

	if (currentState === state)
		return;

	currentState = state;
	updateStateOutput();
}

function updateState(input) {
	switch(input) {
		case 'left': {
			if (currentState === ViewStates.document) {
				setState(ViewStates.course);
			} else if (currentState === ViewStates.course) {
				setState(ViewStates.category);
			}
		}
		break;
		case 'right': {
			if (currentState === ViewStates.category) {
				setState(ViewStates.course);
			} else if (currentState === ViewStates.course) {
				setState(ViewStates.document);
			}
		}
		break;
		default: {
		}
	}
}

function updateStateOutput() {
	$mainPanelContainer.removeClass();

	switch(currentState) {
		case ViewStates.uninit: {
			$mainPanelContainer.addClass('col-sm-10');
			$documentListContainer.hide();
			$courseListContainer.hide();
			$allSidebarSticky.hide();
		}
		break;
		case ViewStates.init: {
			// set a bunch of things true
			$allSidebarSticky.show();
			$uninitPlacement.hide();

			setState(ViewStates.category);
		}
		break;
		case ViewStates.category: {
			$mainPanelContainer.addClass('col-sm-10');
			$documentListContainer.hide();
			$courseListContainer.hide();
		}
		break;
		case ViewStates.course: {
			$mainPanelContainer.addClass('col-sm-8');
			$documentListContainer.hide();
			$courseListContainer.show();
		}
		break;
		case ViewStates.document: {
			$mainPanelContainer.addClass('col-sm-6');
			$documentListContainer.show();
			$courseListContainer.show();
		}
		break;
		default: {
		}
	}
}

// View-specific keyboard controls
// FIXME:
let Mousetrap = require('mousetrap');
Mousetrap.bind('left', ()=> {
	updateState('left');
});
Mousetrap.bind('right', ()=> {
	updateState('right');
});


// View to IPC controller events
$('.request-openDocumentList').on('click', ()=> {
	ipcRenderer.send('request:openDocumentList');
});