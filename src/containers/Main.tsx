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

  const [currSymbol, setCurrSymbol] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<any>();
  const [isRequireRefreshTrades, setIsRequireRefreshTrades] = useState(false);
  const [isRequireCalculateLiqPrice, setIsRequireCalculateLiqPrice] = useState(false);

  const [futuresAccount, setFuturesAccount] = useState<IBinanceFuturesAccount>();
  const [futuresPrices, setFuturesPrices] = useState<IStateFuturesPrices>();
  const [futuresLastTrade, setFuturesLastTrade] = useState<IStateLastTrade>();
  const [state, setState] = useState<IState>({
    expectedPosSide: 'BUY',
    expectedPosRatio: 25,
    liquidationPrice: 0,
  });

  const prevSymbol = usePrevious(currSymbol);
  const currentPosition = futuresAccount?.positions?.find((x: any) => x.symbol === currSymbol);
  const currentAsset = futuresAccount?.assets.find(x => x.asset === currSymbol?.slice(-4));

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
        setFuturesAccount(account);
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
    setFuturesAccount(account);
    setFuturesPrices({
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
    setState({ ...state, liquidationPrice: getLiquidationPrice(Number(lastPrice)) });
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
        setFuturesLastTrade({
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
      setFuturesLastTrade({
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
    setState({
      ...state,
      expectedPosSide: state.expectedPosSide === 'BUY' ? 'SELL' : 'BUY'
    });
    setIsRequireCalculateLiqPrice(true);
  }

  const getLiquidationPrice = (entryPrice?: number) => {
    if (state.expectedPosRatio === 0) {
      return 0;
    }
    else if (currentPosition && !currentPosition.isolated) {
      return 0;
    }
    else if (currentAsset && currentPosition && entryPrice) {
      const availableBalance = Number(currentAsset?.availableBalance);
      const leverage = Number(currentPosition.leverage);
      const initalMargin = availableBalance * (state.expectedPosRatio / 100);
      const size = initalMargin * leverage / entryPrice;
      const liquidationPrice = calculateLiquidationPrice(currSymbol,
        {
          // in isolated mode, wb = margin.
          walletBalance: initalMargin,
          positionSize: size,
          positionSide: state.expectedPosSide,
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

  const handleStream = (response: any) => {
    if (!futuresAccount) return;
    const positions = [...futuresAccount.positions];
    switch (response.e) {
      case 'ACCOUNT_CONFIG_UPDATE':
        const current = positions.findIndex(v => v.symbol === response.ac.s);
        positions[current].leverage = response.ac.l;
        setFuturesAccount({
          ...futuresAccount,
          positions: positions
        });
        setIsRequireCalculateLiqPrice(true);
        break;
      case 'ACCOUNT_UPDATE':
        if (response.a.P.length > 0) {
          const account = response.a.P[0];
          const p = positions.findIndex(v => v.symbol === account.s);
          positions[p].isolated = account.mt === 'isolated';
        }
        const tAssets = futuresAccount.assets;
        tAssets[futuresAccount.assets.findIndex(x => x.asset === response.a.B[0].a)].availableBalance = response.a.B[0].cw;
        setIsRequireRefreshTrades(true);
        setFuturesAccount({
          ...futuresAccount,
          assets: tAssets,
        });
        break;
      case 'markPriceUpdate':
        setFuturesPrices({
          ...futuresPrices,
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
        setIsRequireCalculateLiqPrice(true);
        setFuturesPrices({
          ...futuresPrices,
          last: {
            price: response.c,
            priceChange: response.p,
            priceChangePercent: response.P
          }
        });
        break;
    }
  }

  const onLogout = () => {
    AuthenticationStore.clear();
    props.onLogout();
  }

  const onStreamUpdate = async (message: MessageEvent) => {
    const response = JSON.parse(message.data);
    console.log(response);
    setLastResponse(response);
  }

  const onSymbolChanged: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (!binance.current) return;
    const symbol = e.target.value;
    setCurrSymbol(symbol);
  }

  const onChangePosRatio = (value: number) => {
    setState({
      ...state,
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

    refreshSymbolMarket(currSymbol);
    refreshLastTrades(currSymbol);
    // setIsRequireRefreshTrades(true);

    const requestSubscribe = JSON.stringify({
      method: 'SUBSCRIBE',
      params: [
        `${currSymbol.toLowerCase()}@ticker`,
        `${currSymbol.toLowerCase()}@markPrice@1s`
      ],
    });
    stream.current.send(requestSubscribe);
    console.log('[Stream] Subscribe: ', requestSubscribe);
  }, [currSymbol]);

  useEffect(() => {
    handleStream(lastResponse);
  }, [lastResponse]);

  useEffect(() => {
    if (isRequireRefreshTrades) {
      refreshLastTrades(currSymbol);
      setIsRequireRefreshTrades(false);
    }
  }, [isRequireRefreshTrades]);

  useEffect(() => {
    if (isRequireCalculateLiqPrice) {
      setState({
        ...state,
        liquidationPrice: getLiquidationPrice(Number(futuresPrices?.last?.price))
      });
      setIsRequireCalculateLiqPrice(false);
    }
  }, [isRequireCalculateLiqPrice]);

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
            symbols={futuresAccount?.positions?.map((x: any) => x.symbol).sort()}
          />
          <Divider className='pt-2 mb-1' />
        </header>
        <main className='flex flex-col py-1 space-y-2'>
          <PriceScrenner
            markPrice={futuresPrices?.mark?.markPrice}
            lastPrice={futuresPrices?.last?.price}
            lastPriceChange={futuresPrices?.last?.priceChange}
            lastPriceChangePercent={futuresPrices?.last?.priceChangePercent}
            fundingRate={futuresPrices?.mark?.fundingRate}
            fundingTime={futuresPrices?.mark?.fundingTime}
          />
          <LastFee
            symbol={currSymbol}
            time={futuresLastTrade?.time}
            side={futuresLastTrade?.side}
            price={futuresLastTrade?.price}
            totalValue={futuresLastTrade?.totalValue}
            lastCommission={futuresLastTrade?.commission}
            realizedPnl={futuresLastTrade?.realizedPnl}
            marginAsset={futuresLastTrade?.marginAsset}
            commissionAsset={futuresLastTrade?.marginAsset}
          />
          <Margin
            positionSide={state.expectedPosSide}
            onSwitchLongShort={switchExpectedPosSide}
            leverage={currentPosition?.leverage}
            isolated={currentPosition?.isolated}
            liquidation={state.liquidationPrice}
          />
          <Divider className='py-1' />
          <Fee
            symbol={currSymbol}
            value={state.expectedPosRatio}
            setValue={onChangePosRatio}
            lastPrice={futuresPrices?.last?.price}
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