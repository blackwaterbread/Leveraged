import { useEffect, useState } from 'react';
import { Text, Tooltip } from '@chakra-ui/react';
import { getFixedNumber, getFloatFixed } from '../lib/calculation';
import { Colors } from '../lib/theme';
import { usePrevious } from 'lib/hooks';
import { DateTime } from 'luxon';
import Stats from './Stats';

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
  const prefix = Math.sign(Number(props.lastPriceChangePercent)) === 1 ? '+' : '';
  const colorChange = Math.sign(Number(props.lastPriceChangePercent)) === 1 ? Colors.bull : Colors.bear;
  const fixed = getFloatFixed(lastPrice);
  const change = Number(props.lastPriceChange);
  const changePercent = Number(props.lastPriceChangePercent);
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
      <div className='flex space-x-6 justify-start'>
        <div>
          {/* 여기 Stats Component로 정리하면 Tooltip이 안나오길래 일단 걍 냅둠. */}
          <Text fontSize='md' fontWeight='normal' textColor='gray.400'>
            현재가
          </Text>
          <Tooltip
            hasArrow
            padding={2}
            bgColor='gray.700'
            placement='bottom-start'
            textColor={colorChange}
            label={props.lastPriceChange ? `전일대비 (${prefix}${getFixedNumber(change, 2)}, ${prefix}${getFixedNumber(changePercent, 2)}%)` : ''}
            fontWeight='bold'
          >
            <Text fontSize='sm' fontWeight='bold' textColor={colorPrice}>
              {props.lastPrice ? getFixedNumber(lastPrice) : '-'}
            </Text>
          </Tooltip>
        </div>
        <Stats
          title='시장평균가'
          value={props.markPrice ? getFixedNumber(markPrice) : '-'}
        />
        <Stats
          title='펀딩비'
          value={fundingRate}
          valueProps={{ textColor: Colors.funding }}
        />
        <Stats
          title='카운트다운'
          value={fundingTime}
        />
      </div>
    </div>
  )
}

export default PriceScrenner;