import { DateTime } from "luxon";
import { Colors } from "./theme";

const M125x = [
    [50000,     0.4,  0],
    [250000,    0.5,  50],
    [1000000,   1.0,  1300],
    [5000000,   2.5,  16300],
    [20000000,  5.0,  141300],
    [50000000,  10.0, 1141300],
    [100000000, 12.5, 2391300],
    [200000000, 15.0, 4891300],
    [200000001, 25.0, 24891300]
];

const M100x = [
    [10000,     0.5,    0],
    [100000,    0.65,   15],
    [500000,    1.0,    365],
    [1000000,   2.0,    5365],
    [2000000,   5.0,    35365],
    [50000000,  10.0,   135365],
    [100000000, 12.5,   260365],
    [200000000, 15.0,   510365],
    [200000001, 25.0,   2510365]
];

const M75x = [
    [10000,    0.65,  0],
    [50000,    1.00,  35],
    [250000,   2.00,  535],
    [1000000,  5.00,  8035],
    [2000000,  10.00, 58035],
    [5000000,  12.50, 108035],
    [10000000, 15.00, 233035],
    [10000001, 25.00, 1233035]
];

const M50x = [
    [5000,    1.0,  0],
    [25000,   2.5,  75],
    [100000,  5.0,  700],
    [250000,  10.0, 5700],
    [1000000, 12.5, 11950],
    [1000001, 50.0, 386950]
];

const MLOOKUP = new Map([
    ['BTC', M125x],
    ['ETH', M100x],
    ['ADA', M75x],
    ['BNB', M75x],
    ['DOT', M75x],
    ['EOS', M75x],
    ['ETC', M75x],
    ['LINK', M75x],
    ['LTC', M75x],
    ['TRX', M75x],
    ['XLM', M75x],
    ['XMR', M75x],
    ['XRP', M75x],
    ['XTZ', M75x],
    ['BCH', M75x],
    ['OTHERS', M50x]
]);

const LEVERAGE_LEVEL = [
    [0, Colors.bull],
    [6, 'cyan.400'],
    [13, Colors.binance],
    [51, Colors.funding],
    [76, Colors.bear]
]

export function calculateLiquidationPrice(symbol: string, positionRisks: IPositionRisks) {
    const { walletBalance, positionSize: size, positionSide, leverage, entryPrice } = positionRisks;
    const side = positionSide === 'BUY' ? 1 : -1;
    const asset = symbol.replace('USDT', '').replace('BUSD', '');
    const notionalSize = walletBalance * leverage;
    const mTable = MLOOKUP.get(asset) ?? MLOOKUP.get('OTHERS')!;
    let mRatio = 0, mAmount = 0;
    for (const mRow of mTable) {
        if (notionalSize < mRow[0]) {
            mRatio = mRow[1] / 100;
            mAmount = mRow[2];
            break;
        }
    }
    const f1 = walletBalance - mAmount - (side * size * entryPrice);
    const f2 = (size * mRatio) - (side * size);
    return f1 / f2;
}

export function getFloatFixed(n: number) {
    return n > 1000 ? 1 : n > 100 ? 2 : n > 10 ? 3 : n > 1 ? 4 : 6;
}

export function getFixedNumber(n: number, fixed?: number) {
    if (fixed) {
        return n.toLocaleString('ko-KR', { maximumFractionDigits: fixed });
    }
    else {
        const f = getFloatFixed(n);
        return n.toLocaleString('ko-KR', { maximumFractionDigits: f });
    }
}

export function convertMillisTime(time: number) {
    return DateTime.fromMillis(time).toLocaleString(DateTime.DATETIME_SHORT)
}

export function sum(array: Array<number> | Array<string>) {
    return array.map(x => Number(x)).reduce((x, y) => x + y, 0);
}

export function inRange(n: number, start: number, end?: number) {
    if (end && start > end) [end, start] = [start, end];
    return end == null ? n >= 0 && n < start : n >= start && n < end;
};

export function judgeLeverage(leverage: number): string {
    if (isNaN(leverage)) {
        return 'gray.700';
    }
    for (let i = 0; i < LEVERAGE_LEVEL.length; i++) {
        const currentLevel = LEVERAGE_LEVEL[i];
        const nextLevel = LEVERAGE_LEVEL[i + 1];
        if (nextLevel) {
            if (inRange(leverage, currentLevel[0] as number, nextLevel[0] as number)) {
                return currentLevel[1] as string;
            }
        }
        else {
            return currentLevel[1] as string;
        }
    }
    return 'gray.700';
}