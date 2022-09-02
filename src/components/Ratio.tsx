import { Box, Text } from '@chakra-ui/react';
import { DateTime } from 'luxon';
import { Colors } from '../lib/theme';

interface InterestsProp {
  longAccount?: string,
  longShortRatio?: string,
  shortAccount?: string,
  timestamp?: number
}

function Ratio(props: InterestsProp) {
  const percentLong = props.longAccount ? `${(Number(props.longAccount) * 100).toFixed(2)}%` : '50%';
  const percentShort = props.shortAccount ? `${(Number(props.shortAccount) * 100).toFixed(2)}%` : '50%';
  return (
    <div>
      <Text
        fontSize='md'
        fontWeight='bold'
        textColor='gray.400'
      >
        롱/숏 비율
      </Text>
      <div className='flex flex-row justify-between'>
        <Text
          fontSize='md'
          fontWeight='bold'
        >
          {props.longShortRatio ?? '-'}
        </Text>
        <Text
          fontSize='sm'
          fontWeight='bold'
          textColor='gray.500'
        >
          {props.timestamp ?
            DateTime.fromMillis(props.timestamp).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS) :
            '-'
          }
        </Text>
      </div>
      <div className='flex'>
        <Box className='rounded-l-sm' bg={Colors.bull} height='2' width={percentLong} />
        <Box className='rounded-r-sm' bg={Colors.bear} height='2' width={percentShort} />
      </div>
      <div className='flex justify-between'>
        <Text
          fontSize='md'
          fontWeight='bold'
        >
          {percentLong}
        </Text>
        <Text
          fontSize='md'
          fontWeight='bold'
        >
          {percentShort}
        </Text>
      </div>
    </div>
  )
}

export default Ratio;