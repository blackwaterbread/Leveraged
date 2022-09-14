import { Text } from "@chakra-ui/react";

interface Props {
  asset?: string,
  availableBalance?: string
}

function Wallet(props: Props) {
  return (
    <div>
      <Text
        fontSize='sm'
        fontWeight='normal'
        textColor='gray.400'
      >
        마진 잔고
      </Text>
      <Text
        fontSize='2xl'
        fontWeight='bold'
        textColor='white'
      >
        {props.availableBalance ? Number(props.availableBalance).toFixed(2) : '-'} {props.asset ?? '-'}
      </Text>
    </div>
  )
}

export default Wallet;