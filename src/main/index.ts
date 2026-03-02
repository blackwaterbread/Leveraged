import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron';
import ElectronStore from 'electron-store';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import path from 'path';

const isDebug = process.argv.includes('-d') || process.argv.includes('--devtools');
const isTestnet = process.argv.includes('-t') || process.argv.includes('--testnet');
let mainWindow: BrowserWindow | null = null;

function createWindow() {
    Menu.setApplicationMenu(null);
    ElectronStore.initRenderer();
    mainWindow = new BrowserWindow({
        width: 1024,
        minWidth: 1024,
        height: 800,
        minHeight: 800,
        resizable: false,
        darkTheme: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            sandbox: false,
            contextIsolation: true,
            webSecurity: app.isPackaged,
            preload: path.join(__dirname, '../preload/index.mjs'),
            devTools: !app.isPackaged || isDebug,
            additionalArguments: [
                ...(isDebug ? ['--devtools'] : []),
                ...(isTestnet ? ['--testnet'] : []),
            ]
        },
    });

    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    if (!app.isPackaged || isDebug) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    mainWindow.on('closed', () => {
        if (process.platform !== 'darwin') app.quit();
        else mainWindow = null;
    });

    mainWindow.focus();

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.exit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.whenReady().then(() => {
    if (!app.isPackaged || isDebug) {
        installExtension(REACT_DEVELOPER_TOOLS)
            .then((name) => console.log(`Added Extension: ${name}`))
            .catch((err) => console.log('An error occurred: ', err));
    }
});

ipcMain.on('setSize', (event, width: number, height: number) => {
    mainWindow!.setMinimumSize(width, height);
    mainWindow!.setSize(width, height, true);
    mainWindow!.center();
});

ipcMain.on('setResizable', (event, resizable: boolean) => {
    mainWindow!.resizable = resizable;
});