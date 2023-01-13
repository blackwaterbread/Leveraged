const { Application, Store } = window;

class StoreModel<T extends string | number | object> {
    readonly key: string;
    constructor(key: string) {
        this.key = key;
    }
    public get() { return Store.get(this.key) as T | undefined; }
    public set(payload: T) { Store.set(this.key, payload); }
    public clear() { Store.delete(this.key); }
}

export interface IStoreAuthentication {
    apiKey: string,
    apiSecret: string
}

export interface IStoreApplicationConfigs {
    recentlyPairs: string[]
}

export const STORE_KEY_AUTHENTICATION = Application.isDevelopment() ? 'authenticationDev' : 'authentication';
export const STORE_KEY_APPLICATION_CONFIGS = Application.isDevelopment() ? 'appConfigsDev' : 'appConfigs';
export const AuthenticationStore = new StoreModel<IStoreAuthentication>(STORE_KEY_AUTHENTICATION);
export const ApplicationConfigsStore = new StoreModel<IStoreApplicationConfigs>(STORE_KEY_APPLICATION_CONFIGS);