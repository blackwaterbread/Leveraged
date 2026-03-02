const { Application } = window;
export const debugLog = (...args: unknown[]) => { if (Application.isDevelopment()) console.log(...args); };
