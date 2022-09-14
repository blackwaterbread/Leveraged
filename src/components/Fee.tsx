import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableColumnHeaderProps,
  TableCellProps,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  RadioGroup,
  Stack,
  Radio,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import FooterLabel from './FooterLabel';
import Stats from './Stats';

const Ratio = [25, 50, 75, 100];
const Header = (props: TableColumnHeaderProps) => (
  <Th
    fontSize='md'
    fontWeight='normal'
    textColor='gray.400'
    fontFamily='NanumSquare'
    borderColor='#1E2329'
    paddingX={0}
    {...props}
  />
);
const Cell = (props: TableCellProps) => (
  <Td
    fontSize='sm'
    fontWeight='bold'
    textColor='white'
    fontFamily='NanumSquare'
    borderColor='#1E2329'
    paddingX={0}
    paddingY={1}
    {...props}
  />
);

interface Props {
  symbol?: string,
  value: number,
  setValue: React.Dispatch<React.SetStateAction<number>>,
  lastPrice?: string,
  leverage?: string,
  availableBalance?: string
}

function Fee(props: Props) {
  // const [sliderValue, setSliderValue] = useState(25);
  const [showTooltip, setShowTooltip] = useState(false);
  const [feeLevel, setFeeLevel] = useState<string>('maker');
  const [fee, setFee] = useState(0);
  const fSymbol = props.symbol?.replace('USDT', '').replace('BUSD', '');
  const leverage = Number(props.leverage);
  const lastPrice = Number(props.lastPrice);
  const availableBalance = Number(props.availableBalance);
  const getSize = (x: number) => availableBalance * (x / 100) / lastPrice * leverage;
  const getFee = (ratio: number, size: number) => ((ratio / 100) * size * feeRate) * 2;
  const stableSize = leverage * availableBalance;
  const cryptoSize = getSize(props.value);
  const feeRate = feeLevel === 'taker' ? 0.0004 : 0.0002;

  const onChange = (value: number) => {
    props.setValue(value);
    setShowTooltip(true);
  }

  const onChangeEnd = (value: number) => {
    props.setValue(value);
    setShowTooltip(false);
  }

  const setVisibleTooltip = () => { setShowTooltip(true) }
  const setHiddenTooltip = () => { setShowTooltip(false) }

  useEffect(() => {
    setFee(getFee(props.value, leverage * availableBalance));
  }, [availableBalance, leverage, feeLevel]);

  return (
    <div>
      <div className='flex flex-col space-y-2'>
        <RadioGroup className='pt-1' onChange={setFeeLevel} value={feeLevel}>
          <Stack direction='row'>
            <Radio size='sm' value='maker'>지정가</Radio>
            <Radio size='sm' value='taker'>시장가</Radio>
          </Stack>
        </RadioGroup>
        <Table size='sm'>
          <Thead>
            <Tr>
              <Header>진입 비율</Header>
              <Header>예상 사이즈</Header>
              <Header>수수료</Header>
            </Tr>
          </Thead>
          <Tbody>
            {
              Ratio.map(x => {
                const cSize = getSize(x);
                const fee = getFee(x, stableSize);
                return (
                  <Tr key={`feeKey_${x}`}>
                    <Cell key={`feeKey_per_${x}`}>{x}%</Cell>
                    <Cell key={`feeKey_size_${x}`}>{isNaN(cSize) ? '-' : cSize.toFixed(4)} {fSymbol}</Cell>
                    <Cell key={`feeKey_value_${x}`}>{isNaN(fee) ? '-' : fee.toLocaleString()} USDT</Cell>
                  </Tr>
                )
              })
            }
          </Tbody>
        </Table>
        <Slider
          id='slider'
          isDisabled={isNaN(fee)}
          defaultValue={props.value}
          min={0}
          max={100}
          colorScheme='messenger'
          onChange={onChange}
          onChangeEnd={onChangeEnd}
          onMouseOver={setHiddenTooltip}
          onMouseEnter={setVisibleTooltip}
          onMouseLeave={setHiddenTooltip}
        >
          <SliderMark value={0} mt='2' fontSize='sm' textColor='gray.500' fontWeight='bold'>
            0%
          </SliderMark>
          <SliderMark value={25} mt='2' ml='-3' fontSize='sm' textColor='gray.500' fontWeight='bold'>
            25%
          </SliderMark>
          <SliderMark value={50} mt='2' ml='-3' fontSize='sm' textColor='gray.500' fontWeight='bold'>
            50%
          </SliderMark>
          <SliderMark value={75} mt='2' ml='-3' fontSize='sm' textColor='gray.500' fontWeight='bold'>
            75%
          </SliderMark>
          <SliderMark value={100} mt='2' ml='-8' fontSize='sm' textColor='gray.500' fontWeight='bold'>
            100%
          </SliderMark>
          <SliderMark
            hidden={!showTooltip}
            value={props.value}
            className='rounded-md'
            textAlign='center'
            bg='#F0B90B'
            color='black'
            fontWeight='bold'
            mt='-10'
            ml='-5'
            w='12'
          >
            {props.value}%
          </SliderMark>
          <SliderTrack>
            <SliderFilledTrack bg='#F0B90B' />
          </SliderTrack>
          <SliderThumb />
        </Slider>
        <div className='flex justify-between pt-5'>
          <Stats title='예상 사이즈' value={`${isNaN(cryptoSize) ? '-' : cryptoSize.toFixed(4)} ${fSymbol ?? ''}`} />
          <Stats title='예상 수수료' value={`${isNaN(fee) ? '-' : fee.toFixed(3)} USDT`} />
        </div>
      </div>
      <FooterLabel label='포지션 오픈/청산까지의 수수료 합계' />
    </div>
  );
}

export default Fee;