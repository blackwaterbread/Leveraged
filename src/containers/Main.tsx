import React, { useRef, useState, useEffect } from 'react';
import { Button, Divider, Text, Tooltip } from '@chakra-ui/react';
import { usePrevious } from '../lib/hooks';
import { calculateLiquidationPrice, sum } from '../lib/calculation';
import Fee from '../components/Fee';
import Margin from '../components/Margin';
import PriceScrenner from '../components/PriceScreener';
import SelectSymbol from '../components/SelectSymbol';
import Wallet from '../components/Wallet';
import LastFee from 'components/LastFee';
import BinanceLogo from '../assets/logos/Binance.svg';
import BinanceClass from 'node-binance-api';
import { IoSettings, IoInformationCircle, IoExitOutline } from 'react-icons/io5';
import { AuthenticationStore } from 'services/store';
const { Application, Binance } = window;
const URL_WSS = Application.isDevelopment() ? 'wss://stream.binancefuture.com/ws/' : 'wss://fstream.binance.com/ws/';

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
  marginAsset: string,
  commissionAsset: string
}

interface IStateFuturesPrices {
  last?: IStateLastPrice,
  mark?: IBinanceMarkPrice
}

interface IState {
  expectedPosSide: TypePositionSide,
  expectedPosRatio: number,
  liquidationPrice?: number,
}

function Main(props: Props) {
  const stream = useRef<WebSocket>();
  const binance = useRef<BinanceClass>();

  const [stateCurrSymbol, setStateCurrSymbol] = useState<string>('');
  const [stateIsRequireRefreshTrades, setStateIsRequireRefreshTrades] = useState(false);
  const [stateIsRequireCalculateLiqPrice, setStateIsRequireCalculateLiqPrice] = useState(false);

  const [stateFuturesAccount, setStateFuturesAccount] = useState<IBinanceFuturesAccount>();
  const [stateFuturesPrices, setStateFuturesPrices] = useState<IStateFuturesPrices>();
  const [stateFuturesLastTrade, setStateFuturesLastTrade] = useState<IStateLastTrade>();

  const [stateInternal, setStateInternal] = useState<IState>({
    expectedPosSide: 'BUY',
    expectedPosRatio: 25,
    liquidationPrice: 0,
  });

  const prevSymbol = usePrevious(stateCurrSymbol);
  const currentPosition = stateFuturesAccount?.positions?.find((x: any) => x.symbol === stateCurrSymbol);
  const currentAsset = stateFuturesAccount?.assets.find(x => x.asset === stateCurrSymbol?.slice(-4));

  const initalizeComponent = async () => {
    Application.setSize(425, 900);
    Application.setResizable(true);
    if (props.authentication) {
      const { apiKey, apiSecret } = props.authentication;
      binance.current = Binance.getBinance(apiKey, apiSecret);
      await binance.current!.useServerTime();
      const account = await binance.current!.futuresAccount();
      const streamKey = (await binance.current!.futuresGetDataStream()).listenKey;
      if (!stream.current) {
        stream.current = new WebSocket(`${URL_WSS}${streamKey}`);
        stream.current.onopen = () => { console.log('[Stream] Successfully Connected'); }
        stream.current.onmessage = onStreamUpdate;
        setStateFuturesAccount(account);
      }
    }
  }

  const refreshSymbolMarket = async (symbol: string) => {
    if (!binance.current) return;
    await binance.current!.useServerTime();
    const [account, prices, mPrices] = await Promise.all([
      binance.current.futuresAccount(),
      binance.current.futuresPrices(symbol),
      binance.current.futuresMarkPrice(symbol)
    ]);
    const lastPrice = prices[symbol];
    setStateFuturesAccount(account);
    setStateFuturesPrices({
      last: {
        price: lastPrice,
        priceChange: '0',
        priceChangePercent: '0'
      },
      mark: {
        symbol: symbol,
        markPrice: mPrices.markPrice,
        eventTime: mPrices.time,
        eventType: '',
        fundingRate: mPrices.lastFundingRate,
        fundingTime: mPrices.nextFundingTime
      }
    });
    setStateInternal({ ...stateInternal, liquidationPrice: getLiquidationPrice(Number(lastPrice)) });
  }

  const refreshLastTrades = async (symbol: string) => {
    if (!binance.current) return;
    await binance.current!.useServerTime();
    const trades: IBinanceFuturesUserTrade[] = await binance.current.futuresUserTrades(symbol);
    const lastOrder = trades.pop();
    if (lastOrder) {
      const sameOrders = trades.filter(trade => trade.orderId === lastOrder.orderId);
      sameOrders.push(lastOrder);
      if (sameOrders.length > 0) {
        const commission = sum(sameOrders.map(x => x.commission));
        const realizedPnl = sum(sameOrders.map(x => x.realizedPnl));
        const totalValue = sum(sameOrders.map(x => x.qty));
        setStateFuturesLastTrade({
          side: lastOrder.side,
          totalValue: totalValue,
          price: Number(lastOrder.price),
          commission: commission,
          realizedPnl: realizedPnl,
          time: lastOrder.time,
          commissionAsset: lastOrder.commissionAsset,
          marginAsset: lastOrder.marginAsset,
        });
      }
    }
    else {
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
    }
  }

  const switchExpectedPosSide = () => {
    setStateInternal({
      ...stateInternal,
      expectedPosSide: stateInternal.expectedPosSide === 'BUY' ? 'SELL' : 'BUY'
    });
    setStateIsRequireCalculateLiqPrice(true);
  }

  const getLiquidationPrice = (entryPrice?: number) => {
    if (stateInternal.expectedPosRatio === 0) {
      return 0;
    }
    else if (currentPosition && !currentPosition.isolated) {
      return 0;
    }
    else if (currentAsset && currentPosition && entryPrice) {
      const availableBalance = Number(currentAsset?.availableBalance);
      const leverage = Number(currentPosition.leverage);
      const initalMargin = availableBalance * (stateInternal.expectedPosRatio / 100);
      const size = initalMargin * leverage / entryPrice;
      const liquidationPrice = calculateLiquidationPrice(stateCurrSymbol,
        {
          // in isolated mode, wb = margin.
          walletBalance: initalMargin,
          positionSize: size,
          positionSide: stateInternal.expectedPosSide,
          leverage: leverage,
          entryPrice: entryPrice
        }
      );
      return liquidationPrice;
    }
    else {
      return 0;
    }
  }

  const onLogout = () => {
    AuthenticationStore.clear();
    props.onLogout();
  }

  const onStreamUpdate = async (message: MessageEvent) => {
    if (!stateFuturesAccount) return;
    const response = JSON.parse(message.data);
    console.log(response);
    const positions = [...stateFuturesAccount.positions];
    switch (response.e) {
      case 'ACCOUNT_CONFIG_UPDATE':
        const current = positions.findIndex(v => v.symbol === response.ac.s);
        positions[current].leverage = response.ac.l;
        setStateFuturesAccount({
          ...stateFuturesAccount,
          positions: positions
        });
        setStateIsRequireCalculateLiqPrice(true);
        break;
      case 'ACCOUNT_UPDATE':
        if (response.a.P.length > 0) {
          const account = response.a.P[0];
          const p = positions.findIndex(v => v.symbol === account.s);
          positions[p].isolated = account.mt === 'isolated';
        }
        const tAssets = stateFuturesAccount.assets;
        tAssets[stateFuturesAccount.assets.findIndex(x => x.asset === response.a.B[0].a)].availableBalance = response.a.B[0].cw;
        setStateFuturesAccount({
          ...stateFuturesAccount,
          assets: tAssets,
        });
        setStateIsRequireRefreshTrades(true);
        break;
      case 'markPriceUpdate':
        setStateFuturesPrices({
          ...stateFuturesPrices,
          mark: {
            symbol: response.s,
            eventTime: response.E,
            markPrice: response.p,
            eventType: response.e,
            fundingRate: response.r,
            fundingTime: response.T
          }
        });
        break;
      case '24hrTicker':
        setStateIsRequireCalculateLiqPrice(true);
        setStateFuturesPrices({
          ...stateFuturesPrices,
          last: {
            price: response.c,
            priceChange: response.p,
            priceChangePercent: response.P
          }
        });
        break;
    }
  }

  const onSymbolChanged: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (!binance.current) return;
    const symbol = e.target.value;
    setStateCurrSymbol(symbol);
  }

  const onChangePosRatio = (value: number) => {
    setStateInternal({
      ...stateInternal,
      expectedPosRatio: value
    });
  }

  useEffect(() => {
    initalizeComponent();
  }, []);

  useEffect(() => {
    if (!stream.current) return;
    if (prevSymbol) {
      const requestUnsubscribe = JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: [
          `${prevSymbol.toLowerCase()}@ticker`,
          `${prevSymbol.toLowerCase()}@markPrice@1s`
        ],
      });
      stream.current.send(requestUnsubscribe);
      console.log('[Stream] Unsubscribe: ', requestUnsubscribe);
    }

    refreshSymbolMarket(stateCurrSymbol);
    refreshLastTrades(stateCurrSymbol);

    const requestSubscribe = JSON.stringify({
      method: 'SUBSCRIBE',
      params: [
        `${stateCurrSymbol.toLowerCase()}@ticker`,
        `${stateCurrSymbol.toLowerCase()}@markPrice@1s`
      ],
    });
    stream.current.send(requestSubscribe);
    console.log('[Stream] Subscribe: ', requestSubscribe);
  }, [stateCurrSymbol]);

  useEffect(() => {
    // replace handler if changed account state (don't know this is best)
    if (stream.current) {
      stream.current.onmessage = onStreamUpdate;
    }
  }, [stateFuturesAccount]);

  useEffect(() => {
    if (stateIsRequireRefreshTrades) {
      refreshLastTrades(stateCurrSymbol);
      setStateIsRequireRefreshTrades(false);
    }
  }, [stateIsRequireRefreshTrades]);

  useEffect(() => {
    if (stateIsRequireCalculateLiqPrice) {
      setStateInternal({
        ...stateInternal,
        liquidationPrice: getLiquidationPrice(Number(stateFuturesPrices?.last?.price))
      });
      setStateIsRequireCalculateLiqPrice(false);
    }
  }, [stateIsRequireCalculateLiqPrice]);

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
            onChange={onSymbolChanged}
            symbols={stateFuturesAccount?.positions?.map((x: any) => x.symbol).sort()}
          />
          <Divider className='pt-2 mb-1' />
        </header>
        <main className='flex flex-col py-1 space-y-2'>
          <PriceScrenner
            markPrice={stateFuturesPrices?.mark?.markPrice}
            lastPrice={stateFuturesPrices?.last?.price}
            lastPriceChange={stateFuturesPrices?.last?.priceChange}
            lastPriceChangePercent={stateFuturesPrices?.last?.priceChangePercent}
            fundingRate={stateFuturesPrices?.mark?.fundingRate}
            fundingTime={stateFuturesPrices?.mark?.fundingTime}
          />
          <LastFee
            symbol={stateCurrSymbol}
            time={stateFuturesLastTrade?.time}
            side={stateFuturesLastTrade?.side}
            price={stateFuturesLastTrade?.price}
            totalValue={stateFuturesLastTrade?.totalValue}
            lastCommission={stateFuturesLastTrade?.commission}
            realizedPnl={stateFuturesLastTrade?.realizedPnl}
            marginAsset={stateFuturesLastTrade?.marginAsset}
            commissionAsset={stateFuturesLastTrade?.marginAsset}
          />
          <Margin
            positionSide={stateInternal.expectedPosSide}
            onSwitchLongShort={switchExpectedPosSide}
            leverage={currentPosition?.leverage}
            isolated={currentPosition?.isolated}
            liquidation={stateInternal.liquidationPrice}
          />
          <Divider className='py-1' />
          <Fee
            symbol={stateCurrSymbol}
            value={stateInternal.expectedPosRatio}
            setValue={onChangePosRatio}
            lastPrice={stateFuturesPrices?.last?.price}
            leverage={currentPosition?.leverage}
            availableBalance={currentAsset?.availableBalance}
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