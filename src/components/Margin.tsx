import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableColumnHeaderProps,
  TableCellProps,
  Tooltip,
  Text,
  Button,
} from '@chakra-ui/react';
import { Colors } from 'lib/theme';
import { FcBearish, FcBullish } from "react-icons/fc";

interface Props {
  positionSide: TypePositionSide,
  onSwitchLongShort?: () => void,
  leverage?: string,
  isolated?: boolean,
  liquidation?: number
}

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
    fontSize='xl'
    fontWeight='bold'
    textColor='white'
    fontFamily='NanumSquare'
    borderColor='#1E2329'
    paddingX={0}
    paddingY={0}
    {...props}
  />
);

function Margin(props: Props) {
  const mode = props.isolated === undefined ? '없음' : props.isolated ? '격리' : '교차';
  const isCross = mode === '교차';
  const posSide = props.positionSide === 'BUY' ? '롱 청산 가격' : '숏 청산 가격';
  const posSideColor = props.positionSide === 'BUY' ? Colors.bull : Colors.bear;
  const posSideIcon = props.positionSide === 'BUY' ? <FcBullish size={36} /> : <FcBearish size={36} />
  const liqPriceTooltip = (
    <div className='flex justify-center items-center space-x-2'>
      {posSideIcon}
      <Text textAlign='center' fontWeight='bold' fontSize='lg' textColor={posSideColor}>{posSide}</Text>
    </div>
  );

  return (
    <div>
      <Table size='sm'>
        <Thead>
          <Tr>
            <Header>마진 모드</Header>
            <Header>레버리지</Header>
            <Header>예상 청산가</Header>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Cell>{mode}</Cell>
            <Cell textColor='white'>{props.leverage === undefined ? '없음' : `${props.leverage}x`}</Cell>
            <Cell textColor={isCross ? 'gray.600' : 'white'}>
              <Tooltip
                hasArrow
                padding={2}
                bgColor='gray.700'
                placement='bottom'
                textColor='white'
                label={isCross ? '추후 지원 예정' : liqPriceTooltip}
                fontWeight='bold'
              >
                {
                  isCross ? 
                    '미지원' : 
                    <Button 
                      className='m-0' 
                      onClick={props.onSwitchLongShort} 
                      variant='link' 
                      textColor='orange.400'
                      fontSize='xl'
                    >
                      {
                        props.liquidation ? 
                          (props.liquidation === 0 ? 
                            '--' : 
                            props.liquidation.toLocaleString('ko-KR', { maximumFractionDigits: 1 })) : 
                          '0'
                      }
                    </Button>
                }
              </Tooltip>
            </Cell>
          </Tr>
        </Tbody>
      </Table>
    </div>
  )
}

export default Margin;