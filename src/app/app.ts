import { app, BrowserWindow, shell, session, ipcMain } from 'electron';
import { initRenderer } from 'electron-store';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
function createWindow() {
    initRenderer();
    mainWindow = new BrowserWindow({
        width: 1024,
        minWidth: 1024,
        height: 800,
        minHeight: 800,
        resizable: false,
        darkTheme: true,
        autoHideMenuBar: app.isPackaged,
        icon: path.join(__dirname, '../public/logo512.png'),
        webPreferences: {
            nodeIntegration: false,
            sandbox: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            devTools: !app.isPackaged
        },
    });

    mainWindow.loadURL(
        app.isPackaged
            ? `file://${path.join(__dirname, '../build/index.html')}`
            : 'http://localhost:3000'
    );

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    mainWindow.on('closed', () => {
        if (process.platform !== 'darwin') app.quit();
        else mainWindow = null;
    });
    mainWindow.focus();

    // 새창 시스템 브라우저로 열기
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // app.quit();
        app.exit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// debugging
app.whenReady().then(async () => {
    const reactDevToolsPath = 'C:/Users/denev/AppData/Local/Google/Chrome/User Data/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.25.0_0'
    if (!app.isPackaged) await session.defaultSession.loadExtension(reactDevToolsPath);
});

ipcMain.on('setSize', (event, width: number, height: number) => {
    mainWindow!.setMinimumSize(width, height);
    mainWindow!.setSize(width, height, true);
    mainWindow!.center();
});

ipcMain.on('setResizable', (event, resizable: boolean) => {
    mainWindow!.resizable = resizable;
});