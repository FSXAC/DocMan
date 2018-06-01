const electron = require('electron');
const url = require('url');
const path = require('path');

const { app, BrowserWindow, Menu, ipcMain } = electron;
const { dialog } = electron;

let mainWindow;
let addDocumentWindow;

// Listen for app ready
app.on('ready', createWindow);

function createWindow() {
    // Create new window
    mainWindow = new BrowserWindow({width: 800, height: 600});
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

function createAddDocumentWindow() {
    addDocumentWindow = new BrowserWindow({ width: 400, height: 400 });
    // addDocumentWindow.setMenu(null);
    addDocumentWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'pages/addDocument.html'),
        protocol: 'file',
        slashes: true
    }));
    addDocumentWindow.on('closed', ()=>{
        addDocumentWindow = null;
    });
}

ipcMain.on('document:add', (e, item)=>{
    mainWindow.webContents.send('document:add', item);
    addDocumentWindow.close();
});

const mainMenuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                label: 'Open Manifest',
                accelerator: 'Ctrl+O',
                click() { openOpenManifestDialog(); }
            },
            {
                label: 'Add document',
                accelerator: 'Ctrl+N',
                click() { createAddDocumentWindow(); }
            },
            {
                label: 'Quit',
                accelerator: 'Ctrl+Q',
                click() { app.quit(); }
            }
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
                click() { require('electron').shell.openExternal('https://electronjs.org') }
            }
        ]
    }
];

if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer'
    });
}

app.on('window-all-closed', ()=>{
    app.quit()
});

app.on('active', ()=>{
    if (mainWindow === null) {
        createWindow();
    }
});

function openOpenManifestDialog() {
    let manifestPath = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Document manifests', extensions: ['json', 'docman']}
        ]
    })[0];

    const data = require(manifestPath);
    mainWindow.webContents.send('manifest:load', data);
}