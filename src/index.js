
// DEBUG
const DEBUG_DISPLAY_DOCUMENT_ID_INSTEAD_OF_NAME = false;

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
let $documentEntryList = $('#document-entry-list');

let $categoryListContainer = $('#category-list-container');
let $courseListContainer = $('#course-list-container');
let $documentEntryListContainer = $('#document-entry-list-container');

let $mainPanelContainer = $('#main-panel-container');

let $uninitPlacement = $('#uninit-placement');

let $allSidebarSticky = $('.sidebar-sticky');

// Data
let g_localDocumentList;
let g_localDocumentListHash;

// Active ids
let g_activeIds = {
	categoryId: null,
	courseId: null,
	documentEntryId: null
};

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

ipcRenderer.on('documentList:onActiveCourse', (e, courseData)=> {
	setState(ViewStates.document);
	populateDocuments(courseData);
});

ipcRenderer.on('documentList:onActiveDocumentEntry', (e, documentEntryData)=> {
	// TODO: implement this
});

// HTML population functions
function populateCategories() {
	$categoryList.empty();

	g_localDocumentList.categories.forEach(category => {
		let newCategory = document.createElement('li');
		newCategory.classList.add('nav-item', 'category-item');
		$(newCategory).attr('id', category.id);

		let newCategoryA = document.createElement('a');
		newCategoryA.classList.add('nav-link', 'doclist-item', 'text-dark');
		// FIXME:
		newCategoryA.href = '#';

		if (DEBUG_DISPLAY_DOCUMENT_ID_INSTEAD_OF_NAME) {
			newCategoryA.appendChild(document.createTextNode(category.id));
		} else {
			newCategoryA.appendChild(document.createTextNode(category.categoryName));
		}

		newCategory.appendChild(newCategoryA);
		newCategory.addEventListener('click', ()=> {

			// Select current item as active
			$('.category-item').removeClass('active');
			newCategory.classList.add('active');

			// - set active category ID
			g_activeIds.categoryId = category.id;

			// - send event with active category ID
			ipcRenderer.send('request:setActiveCategory', g_activeIds);

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
		$(newCourse).attr('id', course.id);

		let newCourseA = document.createElement('a');
		newCourseA.classList.add('nav-link', 'doclist-item', 'text-dark');
		// FIXME:
		newCourseA.href = '#';
		if (DEBUG_DISPLAY_DOCUMENT_ID_INSTEAD_OF_NAME) {
			newCourseA.appendChild(document.createTextNode(course.id));
		} else {
			newCourseA.appendChild(document.createTextNode(course.courseCode));
		}
		newCourse.appendChild(newCourseA);
		newCourse.addEventListener('click', ()=> {

			// Set current item as active
			$('.course-item').removeClass('active');
			newCourse.classList.add('active');

			// - set active course ID
			g_activeIds.courseId = course.id;

			// - send event with active course ID
			ipcRenderer.send('request:setActiveCourse', g_activeIds);

		});

		$courseList.append(newCourse);
	});
}

function populateDocuments(courseData) {
	$documentEntryList.empty();

	courseData.entries.forEach(entry => {
		if (entry.isSeries === true) {

			let newEntryLi = document.createElement('li');
			newEntryLi.classList.add('nav-item');

			let newEntryTitle = document.createElement('a');
			const entryTitle = entry.title.replace(' ', '-');
			const collapsableId = courseData.id + '-' + entryTitle + '-group';

			let newEntryDiv = document.createElement('div');
			newEntryDiv.classList.add('collapse', 'show');
			$(newEntryDiv).attr('id', collapsableId);

			newEntryTitle.classList.add('nav-link', 'doclist-item', 'text-dark', 'doc-entry-group-title');
			newEntryTitle.href = '#' + collapsableId;
			$(newEntryTitle).attr('data-toggle', 'collapse');
			$(newEntryTitle).attr('role', 'button');
			$(newEntryTitle).attr('aria-expanded', 'true');
			$(newEntryTitle).attr('aria-controls', collapsableId);
			newEntryTitle.appendChild(document.createTextNode(entry.title));

			let newEntryGroup = document.createElement('ul');
			newEntryGroup.classList.add('nav', 'ml-3', 'p-1', 'mb-1', 'mr-3', 'doc-entry-group');

			// For each sub entry document (individual documents)
			entry.subEntries.forEach(subentry => {
				let newEntry = document.createElement('li');
				newEntry.classList.add('document-entry-item');
				$(newEntry).attr('id', subentry.id);

				let newEntryA = document.createElement('a');
				newEntryA.classList.add('p-1', 'btn', 'btn-sm', 'm-1');
				newEntryA.href = '#';

				// Invalid link class
				if (subentry.linkValid === false) {
					newEntryA.classList.add('btn-outline-danger');
				} else {
					newEntryA.classList.add('btn-outline-dark');
				}

				// Name
				if (DEBUG_DISPLAY_DOCUMENT_ID_INSTEAD_OF_NAME) {
					newEntryA.appendChild(document.createTextNode(subentry.id));
				} else {
					newEntryA.appendChild(document.createTextNode(subentry.number));
				}

				newEntry.appendChild(newEntryA);
				newEntry.addEventListener('click', ()=> {
					$('.document-entry-item').removeClass('active');
					$(newEntry).addClass('active');

					g_activeIds.documentEntryId = subentry.id;

					ipcRenderer.send('request:setActiveDocumentEntry', g_activeIds);
				});

				$(newEntryGroup).append(newEntry);
			});

			newEntryLi.appendChild(newEntryTitle);
			newEntryDiv.appendChild(newEntryGroup);
			newEntryLi.appendChild(newEntryDiv);
			$documentEntryList.append(newEntryLi);

		} else {

			let newEntry = document.createElement('li');
			newEntry.classList.add('nav-item', 'document-entry-item');
			$(newEntry).attr('id', entry.id);

			let newEntryA = document.createElement('a');
			newEntryA.classList.add('nav-link', 'doclist-item');
			newEntryA.href = '#';

			if (entry.linkValid === false) {
				newEntryA.classList.add('text-danger');
			} else {
				newEntryA.classList.add('text-dark');
			}

			if (DEBUG_DISPLAY_DOCUMENT_ID_INSTEAD_OF_NAME) {
				newEntryA.appendChild(document.createTextNode(entry.id));
			} else {
				newEntryA.appendChild(document.createTextNode(entry.title));
			}
			newEntry.appendChild(newEntryA);
			newEntry.addEventListener('click', ()=> {
				$('.document-entry-item').removeClass('active');
				$(newEntry).addClass('active');

				g_activeIds.documentEntryId = entry.id;

				ipcRenderer.send('request:setActiveDocumentEntry', g_activeIds);
			});

			$documentEntryList.append(newEntry);
		}
	});
}

// Add new buttons
$('#add-category-button').on('click', onAddCategory);
$('#add-course-button').on('click', onAddCategory);
$('#add-document-entry-button').on('click', onAddCategory);

function onAddCategory() {

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
};
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
			$documentEntryListContainer.hide();
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
			$documentEntryListContainer.hide();
			$courseListContainer.hide();
		}
		break;
		case ViewStates.course: {
			$mainPanelContainer.addClass('col-sm-8');
			$documentEntryListContainer.hide();
			$courseListContainer.show();
		}
		break;
		case ViewStates.document: {
			$mainPanelContainer.addClass('col-sm-6');
			$documentEntryListContainer.show();
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