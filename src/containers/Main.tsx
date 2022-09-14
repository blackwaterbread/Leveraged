import React, { useRef, useState, useEffect } from 'react';
import { Button, Divider, Text, Tooltip } from '@chakra-ui/react';
import { usePrevious } from '../lib/hooks';
import { getLiquidationPrice } from '../lib/calculation';
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

function Main(props: Props) {
  const stream = useRef<WebSocket>();
  const binance = useRef<BinanceClass>();
  const [account, setAccount] = useState<IBinanceFuturesAccount>();
  const [currentSymbol, setCurrentSymbol] = useState<string>();
  const [priceMark, setPriceMark] = useState<IBinanceMarkPrice>();
  const [priceLast, setPriceLast] = useState<IStateLastPrice>();
  const [lastTrade, setLastTrade] = useState<IStateLastTrade>();
  const [liqPrice, setLiqPrice] = useState<number>();
  const [expectedPosSide, setExpectedPosSide] = useState<TypePositionSide>('BUY');
  const [expectedOpenPosRatio, setExpectedOpenPosRatio] = useState<number>(25);
  const prevSymbol = usePrevious(currentSymbol);
  const refCurrentSymbolPos = account?.positions?.find((x: any) => x.symbol === currentSymbol);
  const currentAsset = account?.assets.find(x => x.asset === currentSymbol?.slice(-4));

  const initalizeComponent = async () => {
    Application.setSize(425, 900);
    Application.setResizable(true);
    if (props.authentication) {
      const { apiKey, apiSecret } = props.authentication;
      binance.current = Binance.getBinance(apiKey, apiSecret);
      await binance.current!.useServerTime();
      const account = await binance.current!.futuresAccount();
      const streamKey = (await binance.current!.futuresGetDataStream()).listenKey;
      stream.current = new WebSocket(`${URL_WSS}${streamKey}`);
      stream.current.onopen = () => {
        console.log('[Stream] Successfully Connected');
      }
      setAccount(account);
    }
  }

  const registerSubscribe = () => {
    if (currentSymbol && stream.current) {
      if (prevSymbol) {
        const requestUnsubscribe = JSON.stringify({
          method: "UNSUBSCRIBE",
          params: [
            `${prevSymbol.toLowerCase()}@ticker`,
            `${prevSymbol.toLowerCase()}@markPrice@1s`
          ],
        });
        stream.current.send(requestUnsubscribe);
      }
      const requestSubscribe = JSON.stringify({
        method: "SUBSCRIBE",
        params: [
          `${currentSymbol.toLowerCase()}@ticker`,
          `${currentSymbol.toLowerCase()}@markPrice@1s`
        ],
      });
      stream.current.send(requestSubscribe);
    }
  }

  const requestLastTrades = async (symbol?: string) => {
    if (!symbol) return;
    if (!binance.current) return;
    await binance.current!.useServerTime();
    const trades: IBinanceFuturesUserTrade[] = await binance.current.futuresUserTrades(symbol);
    const lastOrder = trades.pop();
    if (lastOrder) {
      const sameOrders = trades.filter(trade => trade.orderId === lastOrder.orderId);
      sameOrders.push(lastOrder);
      if (sameOrders.length > 0) {
        const commission = sameOrders.map(x => x.commission).reduce((p, c) => Number(p) + Number(c), 0);
        const realizedPnl = sameOrders.map(x => x.realizedPnl).reduce((p, c) => Number(p) + Number(c), 0);
        const totalValue = sameOrders.map(x => x.qty).reduce((p, c) => Number(p) + Number(c), 0);
        setLastTrade({
          side: lastOrder.side, totalValue: totalValue, price: Number(lastOrder.price),
          commission: commission, realizedPnl: realizedPnl, time: lastOrder.time,
          commissionAsset: lastOrder.commissionAsset, marginAsset: lastOrder.marginAsset,
        });
      }
    }
    else {
      setLastTrade({
        side: undefined, totalValue: 0, price: 0,
        commission: 0, realizedPnl: 0, time: 0,
        commissionAsset: '', marginAsset: '',
      });
    }
  }

  const refreshStreamMessageHandler = () => {
    if (stream.current) stream.current.onmessage = onUpdateAccount;
  }

  const switchExpectedPosSide = () => {
    setExpectedPosSide(expectedPosSide === 'BUY' ? 'SELL' : 'BUY');
  }

  const refreshLiqPrice = (price?: number) => {
    if (expectedOpenPosRatio === 0) {
      setLiqPrice(0);
      return;
    }
    // 교차는 아직 계산 안됨.
    if (refCurrentSymbolPos && !refCurrentSymbolPos.isolated) {
      setLiqPrice(0);
      return;
    }
    if (currentAsset && currentSymbol && refCurrentSymbolPos && price) {
      const availableBalance = Number(currentAsset.availableBalance);
      const leverage = Number(refCurrentSymbolPos.leverage);
      const initalMargin = availableBalance * expectedOpenPosRatio;
      const liqP = getLiquidationPrice(currentSymbol,
        {
          walletBalance: availableBalance,
          side: expectedPosSide,
          positionAmount: initalMargin / price * leverage,
          entryPrice: price
        }
      );
      console.log({
        availableBalance: availableBalance,
        initalMargin: initalMargin,
        leverage: leverage,
        walletBalance: initalMargin,
        entryPrice: price,
        positionAmount: initalMargin / price * leverage,
        side: expectedPosSide,
      })
      console.log(liqP);
      setLiqPrice(liqP);
    }
  }

  const onUpdateAccount = async (message: MessageEvent) => {
    const response = JSON.parse(message.data);
    console.log(response);
    if (account) {
      const pos = Array.from(account.positions);
      switch (response.e) {
        case 'ACCOUNT_CONFIG_UPDATE':
          const p = pos.findIndex(v => v.symbol === response.ac.s);
          pos[p].leverage = response.ac.l;
          setAccount({ ...account, positions: pos });
          break;
        case 'ACCOUNT_UPDATE':
          if (response.a.P.length > 0) {
            const account = response.a.P[0];
            const p = pos.findIndex(v => v.symbol === account.s);
            pos[p].isolated = account.mt === 'isolated';
          }
          refreshLiqPrice();
          await requestLastTrades(currentSymbol);
          setAccount({ ...account, positions: pos, availableBalance: response.a.B[0].cw });
          break;
        case 'markPriceUpdate':
          setPriceMark({
            ...priceMark,
            symbol: response.s, eventTime: response.E, markPrice: response.p,
            eventType: response.e, fundingRate: response.r, fundingTime: response.T
          });
          break;
        case '24hrTicker':
          setPriceLast({ price: response.c, priceChange: response.p, priceChangePercent: response.P });
          refreshLiqPrice(Number(response.c));
          break;
      }
    }
  }

  const onSymbolChanged: React.ChangeEventHandler<HTMLSelectElement> = async (e) => {
    if (!binance.current) return;
    const symbol = e.target.value;
    await binance.current!.useServerTime();
    const [account, prices, mPrices] = await Promise.all([
      binance.current.futuresAccount(), 
      binance.current.futuresPrices(symbol), 
      binance.current.futuresMarkPrice(symbol)
    ]);
    const lastPrice = prices[symbol];
    setAccount(account);
    setCurrentSymbol(symbol);
    setPriceLast({ price: lastPrice, priceChange: '0', priceChangePercent: '0' });
    setPriceMark({
      symbol: symbol, markPrice: mPrices.markPrice, eventTime: mPrices.time,
      eventType: '', fundingRate: mPrices.lastFundingRate, fundingTime: mPrices.nextFundingTime
    });
    await requestLastTrades(symbol);
    refreshLiqPrice(Number(lastPrice));
  };

  useEffect(() => { initalizeComponent(); }, []);
  useEffect(() => { registerSubscribe(); }, [currentSymbol]);
  useEffect(() => { refreshLiqPrice(); }, [expectedPosSide, expectedOpenPosRatio]);
  useEffect(() => { refreshLiqPrice(); refreshStreamMessageHandler(); }, [account, currentSymbol, priceLast])

  const onLogout = () => {
    AuthenticationStore.clear();
    props.onLogout();
  }

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
            symbols={account?.positions?.map((x: any) => x.symbol).sort()}
          />
          <Divider className='pt-2 mb-1' />
        </header>
        <main className='flex flex-col py-1 space-y-2'>
          <PriceScrenner
            markPrice={priceMark?.markPrice}
            lastPrice={priceLast?.price}
            lastPriceChange={priceLast?.priceChange}
            lastPriceChangePercent={priceLast?.priceChangePercent}
            fundingRate={priceMark?.fundingRate}
            fundingTime={priceMark?.fundingTime}
          />
          <LastFee
            symbol={currentSymbol}
            time={lastTrade?.time}
            side={lastTrade?.side}
            price={lastTrade?.price}
            totalValue={lastTrade?.totalValue}
            lastCommission={lastTrade?.commission}
            realizedPnl={lastTrade?.realizedPnl}
            marginAsset={lastTrade?.marginAsset}
            commissionAsset={lastTrade?.marginAsset}
          />
          <Margin
            positionSide={expectedPosSide}
            onSwitchLongShort={switchExpectedPosSide}
            leverage={refCurrentSymbolPos?.leverage}
            isolated={refCurrentSymbolPos?.isolated}
            liquidation={liqPrice}
          />
          <Divider className='py-1' />
          <Fee
            symbol={currentSymbol}
            value={expectedOpenPosRatio}
            setValue={setExpectedOpenPosRatio}
            lastPrice={priceLast?.price}
            leverage={refCurrentSymbolPos?.leverage}
            availableBalance={currentAsset?.availableBalance}
          />
        </main>
        <Divider className='py-1' />
        <footer className='pt-4'>
          <Text className='flex justify-center items-center font-bold text-sm text-gray-500'>
            Powered by <img className='-ml-1' src={BinanceLogo} alt='Binance' />
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
          Node-{Application.versions.node()}, Electron-{Application.versions.electron()}, Chrome-{Application.versions.chrome()}
        </Text>
        <Text
          textColor='gray.600'
          textAlign='center'
          fontSize='xs'
          fontWeight='bold'
        >
          Leveraged.App - @dayrain
        </Text>
      </div>
    </div>
  );
}

export default Main;