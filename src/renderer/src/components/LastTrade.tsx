import Stats from './Stats';
import { Colors } from 'lib/theme';
import { convertMillisTime, getFixedNumber } from 'lib/calculation';

interface LastFeeProp {
  symbol?: string,
  side?: 'BUY' | 'SELL',
  price?: number,
  time?: number,
  lastCommission?: number,
  realizedPnl?: number,
  totalValue?: number,
  marginAsset?: string,
  commissionAsset?: string
}

function LastTrade(props: LastFeeProp) {
  const fSymbol = props.symbol?.replace('USDT', '').replace('BUSD', '');
  const side = props.side === 'BUY' ? '' : '-';
  const sideColor = props.side ? (props.side === 'BUY' ? Colors.bull : Colors.bear) : 'white';
  return (
    <div>
      <Stats
        className='flex space-x-2 justify-start'
        title='직전 거래'
        value={props.time ? convertMillisTime(props.time) : '-'}
      />
      <div className='flex space-x-12 items-center -mt-1'>
        <div className='flex flex-col py-1 justify-start'>
          <Stats
            title={`${props.totalValue ? `${side}${getFixedNumber(props.totalValue, 4)}` : '-'} ${fSymbol ?? ''}`}
            titleProps={{ textColor: sideColor, fontWeight: 'bold' }}
            value={`(${props.totalValue && props.price ? getFixedNumber(props.totalValue * props.price, 1) : '-'} ${props.marginAsset ?? ''})`}
            valueProps={{ textColor: sideColor }}
          />
        </div>
        <div>
          <Stats
            className='flex space-x-2 justify-start'
            title='손익'
            titleProps={{ fontSize: 'sm' }}
            value={`${props.realizedPnl ? getFixedNumber(props.realizedPnl, 4) : '-'} ${props.marginAsset ?? ''}`}
            valueProps={{ textColor: props.realizedPnl ? (props.realizedPnl > 0 ? Colors.bull : Colors.bear) : 'white' }}
          />
          <Stats
            className='flex space-x-2 justify-start'
            titleProps={{ fontSize: 'sm' }}
            title='수수료'
            value={`${props.lastCommission ? getFixedNumber(props.lastCommission, 4) : '-'} ${props.commissionAsset ?? ''}`}
          />
        </div>
      </div>
    </div>
  )
}

export default LastTrade;