import { useEffect, useRef, useState } from 'react';
import { Text } from '@chakra-ui/react';
import { Colors } from '../lib/theme';

interface InterestsProp {
  price?: string,
  interests?: number,
}

function Interests(props: InterestsProp) {
  const refBeforePrice = useRef(0);
  const [colorPrice, setColorPrice] = useState('white');
  useEffect(() => {
    if (props.interests) {
      if (refBeforePrice.current < props.interests) setColorPrice(Colors.bull);
      else if (refBeforePrice.current > props.interests) setColorPrice(Colors.bear);
      refBeforePrice.current = props.interests;
    }
  }, [props]);
  return (
    <div>
      <div className='flex space-x-2'>
        <Text
          fontSize='md'
          fontWeight='bold'
          textColor='gray.400'
        >
          실시간 미결제 약정
        </Text>
      </div>
      <div className='flex flex-col'>
        <Text
          fontSize='2xl'
          fontWeight='bold'
          textColor={colorPrice}
        >
          {props.interests ? `${(props.interests / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 4 })}K` : '-'}
        </Text>
        <Text
          fontSize='sm'
          fontWeight='bold'
          textColor={colorPrice}
        >
          (≒ ${props.interests ? (Number(props.price) * props.interests).toLocaleString('ko-KR', { maximumFractionDigits: 0 }) : '-'})
        </Text>
      </div>
    </div>
  )
}

export default Interests;