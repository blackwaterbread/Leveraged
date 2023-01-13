import {
  Stat,
  StatLabel,
  StatNumber,
  StatArrow,
  StatGroup,
  StatLabelProps,
  StatNumberProps,
} from '@chakra-ui/react';
import { judgeLeverage } from 'lib/calculation';

interface Props {
  positionSide: TypePositionSide,
  onSwitchLongShort?: () => void,
  leverage?: string,
  isolated?: boolean,
  liquidation?: number
}

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
  const posSideArrow = props.positionSide === 'BUY' ? <StatArrow ml={1} type='increase' /> : <StatArrow ml={1} type='decrease' />;
  const leverageColor = judgeLeverage(Number(props.leverage));

  return (
    <div>
      <StatGroup>
        <Stat>
          <Header>마진 모드</Header>
          <Value>{mode}</Value>
        </Stat>
        <Stat>
          <Header>레버리지</Header>
          <Value textColor={leverageColor}>{props.leverage === undefined ? '없음' : `${props.leverage}x`}</Value>
        </Stat>
        <Stat>
          <Header>예상 청산가</Header>
          {
            isCross ?
              <Value textColor='gray.700'>미지원</Value> :
              <>
              <Value 
                as={'button'}
                onClick={props.onSwitchLongShort} 
                textColor='orange.400'
                >
                {
                  props.liquidation ?
                    (props.liquidation === 0 ?
                      '--' :
                      props.liquidation.toLocaleString('ko-KR', { maximumFractionDigits: 1 })) :
                    '-'
                }
                {posSideArrow}
              </Value>
              </>
          }
        </Stat>
      </StatGroup>
    </div>
  )
}

export default Margin;