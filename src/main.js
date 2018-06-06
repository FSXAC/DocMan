
'use strict';

/* Electron app stuff */
const electron = require('electron');
const url = require('url');
const path = require('path');

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
				click() { electron.shell.openExternal('https://electronjs.org') }
			}
		]
	}
];

// Listen for app ready -> entry point
app.on('ready', createWindow);

function createWindow() {
	// Create new window
	mainWindow = new BrowserWindow({width: 1024, height: 640});
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file',
		slashes: true
	}));
	mainWindow.on('closed', ()=>{
		mainWindow = null;
	});

	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	Menu.setApplicationMenu(mainMenu);
}

app.on('window-all-closed', ()=>{
	app.quit();
});

app.on('active', ()=>{
	if (mainWindow === null) {
		createWindow();
	}
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

	console.log(DocumentEntryList);
	g_documentList = new DocumentList(data, file);

	// - Validate data
	// TODO:
	g_documentList.validateFiles();

	// - Send "rendered" data to view model in index.json
	// TODO:

	// HACK:
	// send data via IPC to the javascript in webpage
	mainWindow.webContents.send('documentList:load', data);
}