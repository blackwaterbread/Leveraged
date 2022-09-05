/// <reference types="react-scripts" />

type TypePositionSide = 'BUY' | 'SELL';

interface IBinanceFuturesAccount {
    feeTier: number;
    canTrade: boolean;
    canDeposit: boolean;
    canWithdraw: boolean;
    updateTime: number;
    totalInitialMargin: string;
    totalMaintMargin: string;
    totalWalletBalance: string;
    totalUnrealizedProfit: string;
    totalMarginBalance: string;
    totalPositionInitialMargin: string;
    totalOpenOrderInitialMargin: string;
    totalCrossWalletBalance: string;
    totalCrossUnPnl: string;
    availableBalance: string;
    maxWithdrawAmount: string;
    assets: IBinanceAssets[];
    positions: IBinancePositions[];
}

interface IBinanceAssets {
    asset: string;
    walletBalance: string;
    unrealizedProfit: string;
    marginBalance: string;
    maintMargin: string;
    initialMargin: string;
    positionInitialMargin: string;
    openOrderInitialMargin: string;
    maxWithdrawAmount: string;
    crossWalletBalance: string;
    crossUnPnl: string;
    availableBalance: string;
    marginAvailable: boolean;
    updateTime: number;
}

interface IBinancePositions {
    symbol: string;
    initialMargin: string;
    maintMargin: string;
    unrealizedProfit: string;
    positionInitialMargin: string;
    openOrderInitialMargin: string;
    leverage: string;
    isolated: boolean;
    entryPrice: string;
    maxNotional: string;
    positionSide: string;
    positionAmt: string;
    notional: string;
    isolatedWallet: string;
    updateTime: number;
    bidNotional: string;
    askNotional: string;
}

interface IBinanceFuturesMarkPrice {
    symbol: string;
    markPrice: string;
    indexPrice: string;
    estimatedSettlePrice: string;
    lastFundingRate: string;
    nextFundingTime: number;
    interestRate: string;
    time: number;
}

interface IBinanceMarkPrice {
    eventType: string,
    eventTime: number,
    symbol: string,
    markPrice: string,
    fundingRate: string,
    fundingTime: number
}

interface IBinanceFuturesDaily {
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    weightedAvgPrice: string;
    lastPrice: string;
    lastQty: string;
    openPrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
    openTime: number;
    closeTime: number;
    firstId: number;
    lastId: number;
    count: number;
}

interface IBinanceFuturesPrice {
    [index: string]: string
}

interface IBinanceFuturesLongShortRatio {
    symbol: string,
    longAccount: string,
    longShortRatio: string,
    shortAccount: string,
    timestamp: number
}

interface IBinanceFuturesIncome {
    symbol: string,
    incomeType: string,
    income: string,
    asset: string,
    time: number,
    info: string,
    tranId: number,
    tradeId: string
}

interface IBinanceFuturesUserTrade {
    symbol: string,
    id: number,
    orderId: number,
    side: TypePositionSide,
    price: string,
    qty: string,
    realizedPnl: string,
    marginAsset: string,
    quoteQty: string,
    commission: string,
    commissionAsset: string,
    time: number,
    positionSide: string,
    maker: boolean,
    buyer: boolean
}

interface IAuthentication {
    apiKey: string,
    apiSecret: string
}

interface Window {
    Application: {
        versions: {
            node: () => string,
            chrome: () => string,
            electron: () => string,
        },
        setSize: (width: number, height: number) => void,
        setResizable: (resizable: boolean) => void,
        isDevelopment: () => boolean
    },
    Store: {
        get: (key: string) => any,
        set: (key: string, value: number | string | object) => void,
        delete: (key: string) => void,
    },
    Binance: {
        getBinance: (apiKey: string, apiSecret: string) => Binance,
    }
}