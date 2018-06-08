
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
let g_localDocumentList;
let g_localDocumentListHash;

// Active ids
let g_activeCategoryId;
let g_activeCourseId;
let g_activeDocumentId;

// ICP handlers for signals
ipcRenderer.on('documentList:update', (e, payload)=> {
	if (g_localDocumentListHash === payload.hash) {
		return;
	}

	g_localDocumentList = payload.data;
	g_localDocumentListHash = payload.hash;

	setState(ViewStates.init);
	populateCategories();
});

ipcRenderer.on('documentList:onActiveCategory', (e, categoryData)=> {
	setState(ViewStates.course);
	populateCourses(categoryData);
});

ipcRenderer.on('documentlist:onActiveCourse', (e, courseData)=> {
	setState(ViewStates.document);

	// TODO: implement this
	// populateDocuments(courseData);
})

// HTML population functions
function populateCategories() {
	$categoryList.empty();

	g_localDocumentList.categories.forEach(category => {
		let newCategory = document.createElement('li');
		newCategory.classList.add('nav-item', 'category-item');
		$(newCategory).attr('id', category.id);

		let newCategoryA = document.createElement('a');
		newCategoryA.classList.add('nav-link', 'text-muted');
		// FIXME:
		newCategoryA.href = '#';
		newCategoryA.appendChild(document.createTextNode(category.categoryName));

		newCategory.appendChild(newCategoryA);
		newCategory.addEventListener('click', ()=> {

			// Select current item as active
			$('.category-item').removeClass('active');
			newCategory.classList.add('active');

			// - set active category ID
			g_activeCategoryId = category.id;

			// - send event with active category ID
			ipcRenderer.send('request:setActiveCategory', g_activeCategoryId);

			// ... app main should find the corresponding course object with the same ID
			// ... app main should fire event to populate course with course object
		});

		$categoryList.append(newCategory);
	});
}

function populateCourses(categoryData) {
	$courseList.empty();

	categoryData.courses.forEach(course => {
		let newCourse = document.createElement('li');
		newCourse.classList.add('nav-item', 'course-item');
		newCourse.attr('id', course.id);

		let newCourseA = document.createElement('a');
		newCourseA.classList.add('nav-link', 'text-muted');
		// FIXME:
		newCourseA.href = '#';
		newCourseA.appendChild(document.createTextNode(course.courseCode));
		newCourse.appendChild(newCourseA);
		newCourse.addEventListener('click', ()=> {

			// Set current item as active
			$('.course-item').removeClass('active');
			newCourse.classList.add('active');

			// - set active course ID
			g_activeCourseId = course.id;

			// - send event with active course ID
			ipcRenderer.send('request:setActiveCourse', g_activeCourseId);

		});

		$courseList.append(newCourse);
	});
}

// // REFACTOR:
// function populateEntries(entries) {
// 	setState(ViewStates.document);

// 	entries.forEach(element => {

// 		// TODO: allow series / enum entries
// 		if (element.title !== undefined && element.title !== null && element.title !== '') {
// 			let newEntry = document.createElement('li');
// 			newEntry.classList.add('nav-item');

// 			let newEntryA = document.createElement('a');
// 			newEntryA.classList.add('nav-link', 'text-muted');
// 			newEntryA.href = '#';
// 			newEntryA.appendChild(document.createTextNode(element.title));

// 			newEntry.appendChild(newEntryA);
// 			$documentList.append(newEntry);
// 		}
// });
// }

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