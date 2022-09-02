import { contextBridge, ipcRenderer } from 'electron';
import Store from 'electron-store';
import Binance from 'node-binance-api';

const store = new Store();
const isDev = process.env.NODE_ENV === 'development';

contextBridge.exposeInMainWorld('Application', {
    versions: {
        node: () => process.versions.node,
        chrome: () => process.versions.chrome,
        electron: () => process.versions.electron,
    },
    getStore: (key: string) => store.get(key),
    setStore: (key: string, value: number | string | object) => store.set(key, value),
    delStore: (key: string) => store.delete(key),
    setSize: (width: number, height: number) => { ipcRenderer.send('setSize', width, height) },
    setResizable: (resizable: boolean) => { ipcRenderer.send('setResizable', resizable); },
    isDevelopment: () => process.env.NODE_ENV === 'development'
});

contextBridge.exposeInMainWorld('Binance', {
    getBinance: (apiKey: string, apiSecret: string) => new Binance().options({
        APIKEY: apiKey,
        APISECRET: apiSecret,
        useServerTime: true,
        recvWindow: 60000,
        test: isDev,
    }),
});