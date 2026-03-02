import { useEffect, useState } from 'react';
import {
  Stat,
  StatLabel,
  StatNumber,
  StatArrow,
  StatGroup,
  StatLabelProps,
  StatNumberProps
} from '@chakra-ui/react';
import { getFixedNumber } from '../lib/calculation';
import { Colors } from '../lib/theme';
import { usePrevious } from 'lib/hooks';
import { DateTime } from 'luxon';
import Stats from './Stats';

const Header = (props: StatLabelProps) => (
  <StatLabel
    fontSize='sm'
    fontWeight='normal'
    textColor='gray.400'
    fontFamily='NanumSquare'
    borderColor='#1E2329'
    paddingX={0}
    {...props}
  />
);

const Value = (props: StatNumberProps) => (
  <StatNumber
    fontSize='sm'
    fontWeight='bold'
    textColor='white'
    fontFamily='NanumSquare'
    borderColor='#1E2329'
    paddingX={0}
    paddingY={0}
    {...props}
  />
);

interface ScreenerProp {
  markPrice?: string,
  lastPrice?: string,
  lastPriceChange?: string,
  lastPriceChangePercent?: string,
  fundingRate?: string,
  fundingTime?: number
}

function PriceScrenner(props: ScreenerProp) {
  const lastPrice = Number(props.lastPrice);
  const markPrice = Number(props.markPrice);
  const prevLastPrice = usePrevious(lastPrice);
  const [colorPrice, setColorPrice] = useState('');
  const priceArrow = Math.sign(Number(props.lastPriceChangePercent)) === 1 ? <StatArrow type='increase' /> : <StatArrow type='decrease' />;
  const colorChange = Math.sign(Number(props.lastPriceChangePercent)) === 1 ? Colors.bull : Colors.bear;
  const change = getFixedNumber(Number(props.lastPriceChange));
  const changePercent = getFixedNumber(Number(props.lastPriceChangePercent), 2);
  const fundingRate = props.fundingRate ? `${(Number(props.fundingRate) * 100)?.toFixed(4)}%` : '-';
  const fundingTime = props.fundingTime ? DateTime.fromMillis(props.fundingTime).diffNow().toFormat('hh:mm:ss') : '-';
  useEffect(() => {
    if (prevLastPrice) {
      if (prevLastPrice < lastPrice) setColorPrice(Colors.bull);
      else if (prevLastPrice > lastPrice) setColorPrice(Colors.bear);
    }
  }, [props.lastPrice, prevLastPrice, lastPrice]);
  return (
    <div className='space-y-2'>
      <Stats
        className='flex space-x-2 justify-start items-center'
        title='현재가'
        titleProps={{ fontSize: 'sm' }}
        value={props.lastPrice ? getFixedNumber(lastPrice) : '-'}
        valueProps={{ fontSize: '2xl', textColor: colorPrice }}
      />
      <StatGroup>
        <Stat>
          <Header>시장 평균</Header>
          <Value>{props.markPrice ? getFixedNumber(markPrice) : '-'}</Value>
        </Stat>
        <Stat>
          <Header>전일 대비</Header>
          <Value textColor={colorChange}>
            {change} ({changePercent}%) {priceArrow}
          </Value>
        </Stat>
      </StatGroup>
      <StatGroup>
        <Stat>
          <Header>펀딩 비율</Header>
          <Value textColor={Colors.funding}>{fundingRate}</Value>
        </Stat>
        <Stat>
          <Header>카운트다운</Header>
          <Value>{fundingTime}</Value>
        </Stat>
      </StatGroup>
    </div>
  )
}

export default PriceScrenner;