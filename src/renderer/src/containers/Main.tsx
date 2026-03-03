import { useRef, useState, useEffect, act } from 'react';
import { Button, Divider, Text, Tooltip } from '@chakra-ui/react';
import { usePrevious } from '../lib/hooks';
import { calculateLiquidationPrice, sum } from '../lib/calculation';
import Fee from '../components/Fee';
import Margin from '../components/Margin';
import PriceScrenner from '../components/PriceScreener';
import SelectSymbol from '../components/SelectSymbol';
import Wallet from '../components/Wallet';
import LastTrade from 'components/LastTrade';
import BinanceLogo from '../assets/logos/Binance.svg';
import { IoSettings, IoInformationCircle, IoExitOutline } from 'react-icons/io5';
import { AuthenticationStore, ApplicationConfigsStore, IStoreApplicationConfigs } from 'services/store';
import Recently from 'components/Recently';
import { debugLog } from 'lib/debug';
const { Application, Binance } = window;
const URL_WSS = Application.isTestnet() ? 'wss://stream.binancefuture.com/ws/' : 'wss://fstream.binance.com/ws/';

interface Props {
  onLogout: () => void,
  authentication?: IAuthentication
}

interface IStateLastPrice {
  price: string,
  priceChange: string,
  priceChangePercent: string
}

interface IStateLastTrade {
  side?: TypePositionSide,
  time: number,
  totalValue: number,
  price: number,
  realizedPnl: number,
  commission: number,
  marginAsset?: string,
  commissionAsset: string
}

interface IState {
  expectedPosSide: TypePositionSide,
  expectedPosRatio: number,
  liquidationPrice?: number,
}

function Main(props: Props) {
  const stream = useRef<WebSocket>();
  const marketStream = useRef<WebSocket>();
  // Ref for market ticker data — updated every second without triggering re-renders
  const marketTickersRef = useRef<Record<string, IBinanceMiniTicker>>({});
  // Ref that always points to the latest onStreamUpdate, preventing stale closures
  const streamHandlerRef = useRef<(e: MessageEvent) => void>(() => {});

  const [stateCurrSymbol, setStateCurrSymbol] = useState<string>('');
  const [stateAllSymbols, setStateAllSymbols] = useState<string[]>([]);
  const [stateFuturesAccount, setStateFuturesAccount] = useState<IBinanceFuturesAccount>();
  const [statePositionRisk, setStatePositionRisk] = useState<IBinanceFuturesPositionRisk>();
  const [stateFuturesLastPrices, setStateFuturesLastPrices] = useState<IStateLastPrice>();
  const [stateFuturesMarkPrices, setStateFuturesMarkPrices] = useState<IBinanceMarkPrice>();
  const [stateFuturesLastTrade, setStateFuturesLastTrade] = useState<IStateLastTrade>();
  const [stateAppConfigs, setStateAppConfigs] = useState<IStoreApplicationConfigs>({ recentlyPairs: [] });
  const [stateInternal, setStateInternal] = useState<IState>({
    expectedPosSide: 'BUY',
    expectedPosRatio: 25,
    liquidationPrice: undefined,
  });

  const prevSymbol = usePrevious(stateCurrSymbol);
  const currentAsset = stateFuturesAccount?.assets.find(x => x.asset === stateCurrSymbol?.slice(-4));

  const getLiquidationPrice = (entryPrice?: number) => {
    if (stateInternal.expectedPosRatio === 0) return 0;
    if (!currentAsset || !statePositionRisk || !entryPrice) return 0;

    const availableBalance = Number(currentAsset.availableBalance);
    const leverage = Number(statePositionRisk.leverage);
    const maxNotional = Number(statePositionRisk.maxNotionalValue) || Infinity;
    const maxPossibleNotional = Math.min(availableBalance * leverage, maxNotional);
    const actualNotional = maxPossibleNotional * (stateInternal.expectedPosRatio / 100);
    const actualMargin = actualNotional / leverage;
    const size = actualNotional / entryPrice;
    const baseRisks = { positionSize: size, positionSide: stateInternal.expectedPosSide, leverage, entryPrice };

    if (statePositionRisk.marginType === 'isolated') {
      return calculateLiquidationPrice(stateCurrSymbol, { ...baseRisks, walletBalance: actualMargin });
    }
    else {
      const crossWalletBalance = Number(stateFuturesAccount?.totalCrossWalletBalance ?? 0);
      const otherCrossPositions = (stateFuturesAccount?.positions ?? [])
        .filter(p => !p.isolated && p.symbol !== stateCurrSymbol);
      const otherMaintMargin = otherCrossPositions.reduce((sum, p) => sum + Number(p.maintMargin), 0);
      const otherUnrealizedPnl = otherCrossPositions.reduce((sum, p) => sum + Number(p.unrealizedProfit), 0);

      return calculateLiquidationPrice(stateCurrSymbol, { ...baseRisks, walletBalance: crossWalletBalance + otherUnrealizedPnl }, otherMaintMargin);
    }
  };

  const initalizeComponent = async () => {
    Application.setSize(425, 985);
    Application.setResizable(true);

    if (props.authentication) {
      const { apiKey, apiSecret } = props.authentication;
      Binance.init(apiKey, apiSecret);
      const account = await Binance.futuresAccount();
      debugLog('[Init] Account information fetched', account);
      setStateFuturesAccount(account);

      const appConfigs = ApplicationConfigsStore.get();
      if (appConfigs) setStateAppConfigs(appConfigs);

      try {
        const streamKey = (await Binance.futuresGetDataStream()).listenKey;
        if (!stream.current) {
          stream.current = new WebSocket(`${URL_WSS}${streamKey}`);
          stream.current.onopen = () => { debugLog('[Stream] Successfully Connected'); };
          // Delegate to ref so the handler always uses the latest closure values
          stream.current.onmessage = (e) => streamHandlerRef.current(e);
        }
      } catch (err) {
        console.error('[Stream] Failed to initialize listen key:', err);
      }

      // Public market stream — all symbol mini tickers (no auth needed)
      if (!marketStream.current) {
        marketStream.current = new WebSocket(`${URL_WSS}!miniTicker@arr`);
        marketStream.current.onmessage = (e) => {
          const tickers: IBinanceMiniTicker[] = JSON.parse(e.data);
          const prev = marketTickersRef.current;
          let hasNewSymbol = false;
          tickers.forEach(t => {
            if (!prev[t.s]) hasNewSymbol = true;
            prev[t.s] = t;
          });
          if (hasNewSymbol) {
            marketTickersRef.current = { ...prev };
            setStateAllSymbols(
              Object.keys(marketTickersRef.current).filter(s => s.endsWith('USDT')).sort()
            );
          }
        };
      }
    }
  };

  const refreshSymbolMarket = async (symbol: string) => {
    debugLog(`[Refresh] Fetching market data for ${symbol}...`);
    const [account, prices, mPrices, posRisks] = await Promise.all([
      Binance.futuresAccount(),
      Binance.futuresPrices(symbol),
      Binance.futuresMarkPrice(symbol),
      Binance.futuresPositionRisk(symbol),
    ]);
    const lastPrice = String(prices[symbol]);
    debugLog(`[Refresh] Market data for ${symbol} fetched`, { account, prices, mPrices, posRisks });

    setStateFuturesAccount(account);
    // positionRisk returns one entry per positionSide; take BOTH (one-way) or first entry
    setStatePositionRisk(posRisks.find(p => p.positionSide === 'BOTH') ?? posRisks[0]);
    setStateFuturesLastPrices({ price: lastPrice, priceChange: '0', priceChangePercent: '0' });
    setStateFuturesMarkPrices({
      symbol,
      markPrice: mPrices.markPrice,
      eventTime: mPrices.time,
      eventType: '',
      fundingRate: mPrices.lastFundingRate,
      fundingTime: mPrices.nextFundingTime,
    });
  };

  const refreshLastTrades = async (symbol: string) => {
    const trades: IBinanceFuturesUserTrade[] = await Binance.futuresUserTrades(symbol);

    if (trades.length === 0) {
      setStateFuturesLastTrade({
        side: undefined,
        totalValue: 0,
        price: 0,
        commission: 0,
        realizedPnl: 0,
        time: 0,
        commissionAsset: '',
        marginAsset: '',
      });
      return;
    }

    // API returns trades sorted by time — last entry is the most recent fill
    const lastFill = trades[trades.length - 1];
    // Collect all fills belonging to the same order
    const lastOrderFills = trades.filter(t => t.orderId === lastFill.orderId);

    const totalQty = sum(lastOrderFills.map(x => x.qty));
    const totalQuoteQty = sum(lastOrderFills.map(x => x.quoteQty));

    setStateFuturesLastTrade({
      side: lastFill.side,
      totalValue: totalQty,
      // VWAP: quoteQty = price × qty per fill, so sum(quoteQty) / sum(qty) = weighted avg price
      price: totalQty > 0 ? totalQuoteQty / totalQty : 0,
      commission: sum(lastOrderFills.map(x => x.commission)),
      realizedPnl: sum(lastOrderFills.map(x => x.realizedPnl)),
      time: lastFill.time,
      commissionAsset: lastFill.commissionAsset,
      marginAsset: lastFill.marginAsset,
    });
  };

  const switchExpectedPosSide = () => {
    setStateInternal(prev => ({
      ...prev,
      expectedPosSide: prev.expectedPosSide === 'BUY' ? 'SELL' : 'BUY',
    }));
  };

  const onDeleteRecently = (pair: string) => {
    const recentlyPairs = stateAppConfigs.recentlyPairs.filter(value => value !== pair);
    setStateAppConfigs({ ...stateAppConfigs, recentlyPairs });
    ApplicationConfigsStore.set({ ...stateAppConfigs, recentlyPairs });
  };

  const onLogout = () => {
    AuthenticationStore.clear();
    stream.current?.close();
    props.onLogout();
  };

  const onChangePosRatio = (value: number) => {
    setStateInternal(prev => ({ ...prev, expectedPosRatio: value }));
  };

  const onStreamUpdate = async (message: MessageEvent) => {
    if (!stateFuturesAccount) return;
    const response = JSON.parse(message.data);
    debugLog('[Stream]', response);

    switch (response.e) {
      case 'ACCOUNT_CONFIG_UPDATE': {
        // leverage changed: ac.s = symbol, ac.l = new leverage
        if (response.ac?.s === stateCurrSymbol) {
          // Re-fetch positionRisk to get updated maxNotionalValue for the new leverage tier
          const posRisks = await Binance.futuresPositionRisk(stateCurrSymbol);
          setStatePositionRisk(posRisks.find(p => p.positionSide === 'BOTH') ?? posRisks[0]);
        }
        break;
      }

      case 'ACCOUNT_UPDATE': {
        setStateFuturesAccount(prev => {
          if (!prev) return prev;
          const assets = response.a.B.length > 0
            ? prev.assets.map(a =>
                a.asset === response.a.B[0].a ? { ...a, availableBalance: response.a.B[0].cw } : a
              )
            : prev.assets;
          return { ...prev, assets };
        });
        // a.P[0].mt = new marginType (present on both MARGIN_TYPE_CHANGE and trade events)
        if (response.a.P.length > 0 && response.a.P[0].s === stateCurrSymbol) {
          setStatePositionRisk(prev =>
            prev ? { ...prev, marginType: response.a.P[0].mt as 'isolated' | 'cross' } : prev
          );
        }
        // MARGIN_TYPE_CHANGE is a config event, not a trade — skip trade refresh
        // Delay slightly: WebSocket event arrives before REST API indexes the new trade
        if (response.a.m !== 'MARGIN_TYPE_CHANGE') {
          setTimeout(() => refreshLastTrades(stateCurrSymbol), 500);
        }
        break;
      }

      case 'markPriceUpdate':
        setStateFuturesMarkPrices({
          symbol: response.s,
          eventTime: response.E,
          markPrice: response.p,
          eventType: response.e,
          fundingRate: response.r,
          fundingTime: response.T,
        });
        break;

      case '24hrTicker':
        setStateFuturesLastPrices({
          price: response.c,
          priceChange: response.p,
          priceChangePercent: response.P,
        });
        break;
    }
  };

  // Keep the ref updated every render so the WebSocket handler always sees fresh state
  streamHandlerRef.current = onStreamUpdate;

  // Recalculate liquidation price whenever its inputs change
  useEffect(() => {
    setStateInternal(prev => ({
      ...prev,
      liquidationPrice: getLiquidationPrice(Number(stateFuturesLastPrices?.price)),
    }));
  }, [statePositionRisk, currentAsset, stateFuturesLastPrices?.price, stateInternal.expectedPosRatio, stateInternal.expectedPosSide]);

  useEffect(() => {
    initalizeComponent();
    return () => { stream.current?.close(); marketStream.current?.close(); };
  }, []);

  useEffect(() => {
    if (stateCurrSymbol === '') return;

    if (stream.current?.readyState === WebSocket.OPEN && prevSymbol) {
      stream.current.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: [`${prevSymbol.toLowerCase()}@ticker`, `${prevSymbol.toLowerCase()}@markPrice@1s`],
        id: 1,
      }));
    }

    refreshSymbolMarket(stateCurrSymbol);
    refreshLastTrades(stateCurrSymbol);

    if (stream.current?.readyState === WebSocket.OPEN) {
      stream.current.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${stateCurrSymbol.toLowerCase()}@ticker`, `${stateCurrSymbol.toLowerCase()}@markPrice@1s`],
        id: 2,
      }));
    }

    if (!stateAppConfigs.recentlyPairs.includes(stateCurrSymbol)) {
      const recentlyPairs = [stateCurrSymbol, ...stateAppConfigs.recentlyPairs.slice(0, 2)];
      setStateAppConfigs({ ...stateAppConfigs, recentlyPairs });
      ApplicationConfigsStore.set({ recentlyPairs });
    }
  }, [stateCurrSymbol]);

  return (
    <div className='flex flex-col justify-center h-full'>
      <div>
        <Tooltip
          hasArrow padding={2} bgColor='gray.700'
          placement='bottom' textColor='white'
          label='정보' fontWeight='bold'
        >
          <Button disabled title='Information' variant='link'><IoInformationCircle /></Button>
        </Tooltip>
        <Tooltip
          hasArrow padding={2} bgColor='gray.700'
          placement='bottom' textColor='white'
          label='설정' fontWeight='bold'
        >
          <Button disabled variant='link'><IoSettings /></Button>
        </Tooltip>
        <Tooltip
          hasArrow padding={2} bgColor='gray.700'
          placement='bottom' textColor='white'
          label='로그아웃' fontWeight='bold'
        >
          <Button onClick={onLogout} variant='link'><IoExitOutline /></Button>
        </Tooltip>
      </div>
      <div className='min-w-[340px] w-full p-4 bg-[#1E2329] rounded-lg'>
        <header>
          <Wallet asset={currentAsset?.asset} availableBalance={currentAsset?.availableBalance} />
          <Divider className='pt-1 mb-2' />
          <SelectSymbol
            value={stateCurrSymbol}
            onChangeSymbol={setStateCurrSymbol}
            symbols={stateAllSymbols}
          />
          <Recently
            pairs={stateAppConfigs.recentlyPairs}
            onChangeSymbol={setStateCurrSymbol}
            onDeleteRecently={onDeleteRecently}
          />
          <Divider className='pt-2 mb-1' />
        </header>
        <main className='flex flex-col py-1 space-y-2'>
          <PriceScrenner
            markPrice={stateFuturesMarkPrices?.markPrice}
            lastPrice={stateFuturesLastPrices?.price}
            lastPriceChange={stateFuturesLastPrices?.priceChange}
            lastPriceChangePercent={stateFuturesLastPrices?.priceChangePercent}
            fundingRate={stateFuturesMarkPrices?.fundingRate}
            fundingTime={stateFuturesMarkPrices?.fundingTime}
          />
          <Divider />
          <LastTrade
            symbol={stateCurrSymbol}
            time={stateFuturesLastTrade?.time}
            side={stateFuturesLastTrade?.side}
            price={stateFuturesLastTrade?.price}
            totalValue={stateFuturesLastTrade?.totalValue}
            lastCommission={stateFuturesLastTrade?.commission}
            realizedPnl={stateFuturesLastTrade?.realizedPnl}
            marginAsset={stateFuturesLastTrade?.marginAsset}
            commissionAsset={stateFuturesLastTrade?.commissionAsset}
          />
          <Divider />
          <Margin
            positionSide={stateInternal.expectedPosSide}
            onSwitchLongShort={switchExpectedPosSide}
            leverage={statePositionRisk?.leverage}
            isolated={statePositionRisk ? statePositionRisk.marginType === 'isolated' : undefined}
            liquidation={stateInternal.liquidationPrice}
          />
          <Divider />
          <Fee
            symbol={stateCurrSymbol}
            value={stateInternal.expectedPosRatio}
            setValue={onChangePosRatio}
            lastPrice={stateFuturesLastPrices?.price}
            leverage={statePositionRisk?.leverage}
            availableBalance={currentAsset?.availableBalance}
            maxNotionalValue={statePositionRisk?.maxNotionalValue}
          />
        </main>
        <Divider className='py-1' />
        <footer className='pt-4'>
          <Text className='flex justify-center items-center font-bold text-sm text-gray-500'>
            <img src={BinanceLogo} alt='Binance' />
          </Text>
        </footer>
      </div>
      <div className='pt-2'>
        <Text
          textColor='gray.600'
          textAlign='center'
          fontSize='xs'
          fontWeight='bold'
        >
          Leveraged - @dayrain
        </Text>
      </div>
    </div>
  );
}

export default Main;
