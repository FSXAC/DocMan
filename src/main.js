
'use strict';

/* Electron app stuff */
const electron = require('electron');
const url = require('url');
const path = require('path');
const hash = require('object-hash');

const { app, BrowserWindow, Menu, ipcMain } = electron;
const { dialog } = electron;

// Data models
const { DocumentList, CategoryItem, CourseItem, DocumentEntry, DocumentEntryList } = require('./data.js');


// Window
// Main window
let mainWindow;

// Menu options
const mainMenuTemplate = [
	{
		label: 'File',
		submenu: [
			{
				label: 'Open Document List',
				accelerator: 'Ctrl+O',
				click() { openDocumentList(); }
			},
			{ role: 'quit' }
		]
	},
	{
		label: 'Edit',
		submenu: [
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			{ role: 'pasteandmatchstyle' },
			{ role: 'delete' },
			{ role: 'selectall' }
		]
	},
	{
		label: 'View',
		submenu: [
			{ role: 'reload' },
			{ role: 'forcereload' },
			{ role: 'toggledevtools' },
			{ type: 'separator' },
			{ role: 'resetzoom' },
			{ role: 'zoomin' },
			{ role: 'zoomout' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' }
		]
	},
	{
		role: 'help',
		submenu: [
			{
				label: 'Learn More',
				click() { electron.shell.openExternal('https://electronjs.org'); }
			}
		]
	}
];

// Create window
function createWindow() {
	// Create new window
	mainWindow = new BrowserWindow({ width: 1024, height: 640 });
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file',
		slashes: true
	}));
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	Menu.setApplicationMenu(mainMenu);
}

// App events
// Listen for app ready -> entry point
app.on('ready', createWindow);

app.on('window-all-closed', ()=>{
	app.quit();
});

app.on('active', ()=>{
	if (mainWindow === null) {
		createWindow();
	}
});

// IPC incoming events
ipcMain.on('request:openDocumentList', openDocumentList);
ipcMain.on('request:setActiveCategory', (e, ids)=> {
	setActiveCategory(ids);
});
ipcMain.on('request:setActiveCourse', (e, ids)=> {
	setActiveCourse(ids);
});
ipcMain.on('request:setActiveDocumentEntry', (e, ids)=> {
	setActiveDocumentEntry(ids);
});

// Global document variables
let g_documentList;

/* Opens a file dialog window that gets the file path and calls the load document function
 */
function openDocumentList() {
	let readPath = dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'Document manifests', extensions: ['json', 'docman'] }
		]
	})[0];

	loadDocumentList(readPath);
}

/* Loads a document list
 * @param file The file of the document list JSON
 */
function loadDocumentList(file) {
	const data = require(file);

	if (typeof data === 'undefined') {
		// TODO: throw error
	}

	// - Load the json data into data objects
	if (g_documentList !== null) {
		// TODO: user workflow: prompt user to save and reset document list
	}

	g_documentList = new DocumentList(data, file);

	// - Validate data
	g_documentList.validateFiles();

	// send data via IPC to the javascript in webpage
	mainWindow.webContents.send('documentList:update', { data: g_documentList, hash: hash(g_documentList) });
}

function findActiveCategory(categoryId) {
	for (let i = 0; i < g_documentList.categories.length; i++) {
		if (g_documentList.categories[i].id === categoryId) {
			return g_documentList.categories[i];
		}
	}

	return null;
}

function findActiveCourse(category, courseId) {
	for (let i = 0; i < category.courses.length; i++) {
		if (category.courses[i].id === courseId) {
			return category.courses[i];
		}
	}

	return null;
}

function findActiveDocumentEntry(course, docId) {
	for (let i = 0; i < course.entries.length; i++) {
		if (course.entries[i].id === docId) {
			return course.entries[i];
		} else if (course.entries[i].isSeries === true) {
			for (let j = 0; j < course.entries[i].subEntries.length; j++) {
				if (course.entries[i].subEntries[j].id === docId) {
					return course.entries[i].subEntries[j];
				}
			}
		}
	}

	return null;
}

function setActiveCategory(ids) {
	// Find the category with ID
	if (ids.categoryId === null) {
		// TODO: throw error
		return false;
	}

	const activeCategory = findActiveCategory(ids.categoryId);
	if (activeCategory !== null) {
		mainWindow.webContents.send('documentList:onActiveCategory', activeCategory);
		return true;
	}

	// TODO: error
	return false;
}

function setActiveCourse(ids) {
	if (ids.categoryId === null || ids.courseId === null) {
		return false;
	}

	// Find the category
	const activeCategory = findActiveCategory(ids.categoryId);

	// Find course
	const course = findActiveCourse(activeCategory, ids.courseId);
	if (course !== null) {
		mainWindow.webContents.send('documentList:onActiveCourse', course);
		return true;
	}

	return false;
}

function setActiveDocumentEntry(ids) {
	if (ids.categoryId === null || ids.courseId === null || ids.documentEntryId === null) {
		return false;
	}

	const cat = findActiveCategory(ids.categoryId);
	const crs = findActiveCourse(cat, ids.courseId);
	const doc = findActiveDocumentEntry(crs, ids.documentEntryId);

	if (doc !== null) {
		mainWindow.webContents.send('documentList:onActiveDocumentEntry', doc);
		return true;
	}

	return false;
}