import { contextBridge, ipcRenderer } from 'electron';
import Store from 'electron-store';
import Binance from 'node-binance-api';

const store = new Store();
let binance: InstanceType<typeof Binance> | null = null;

contextBridge.exposeInMainWorld('Application', {
    versions: {
        node: () => process.versions.node,
        chrome: () => process.versions.chrome,
        electron: () => process.versions.electron,
    },
    setSize: (width: number, height: number) => { ipcRenderer.send('setSize', width, height) },
    setResizable: (resizable: boolean) => { ipcRenderer.send('setResizable', resizable); },
    isDevelopment: () => process.env.NODE_ENV === 'development' || process.argv.includes('-d') || process.argv.includes('--debug')
});

contextBridge.exposeInMainWorld('Store', {
    get: (key: string) => store.get(key),
    set: (key: string, value: number | string | object) => store.set(key, value),
    delete: (key: string) => store.delete(key),
});

contextBridge.exposeInMainWorld('Binance', {
    init: (apiKey: string, apiSecret: string) => {
        binance = new Binance({
            APIKEY: apiKey,
            APISECRET: apiSecret,
            recvWindow: 60000,
            test: process.env.NODE_ENV === 'development',
        });
    },
    futuresAccount: () => binance!.futuresAccount(),
    futuresPositionRisk: (symbol: string) => binance!.futuresPositionRiskV2({ symbol }),
    futuresPrices: (symbol: string) => binance!.futuresPrices(symbol),
    futuresMarkPrice: (symbol: string) => binance!.futuresMarkPrice(symbol),
    futuresUserTrades: (symbol: string) => binance!.futuresUserTrades(symbol),
    futuresGetDataStream: () => binance!.futuresGetDataStream(),
});
