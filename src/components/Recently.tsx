import { HStack, Tag, TagLabel, TagCloseButton } from "@chakra-ui/react";
import { Colors } from "lib/theme";
import { nanoid } from "nanoid";

interface Props {
  pairs: string[],
  onChangeSymbol: React.Dispatch<React.SetStateAction<string>>,
  onDeleteRecently: (pair: string) => void
}

function Recently(props: Props) {
  const onDelete = (pair: string): React.MouseEventHandler<HTMLButtonElement> => {
    return function (e) {
      e.stopPropagation();
      props.onDeleteRecently(pair);
    }
  }
  return (
    <HStack className='pt-2' justify='flex-start' spacing={4}>
      {props.pairs.map((pair, i) =>
        <Tag
          size='md'
          onClick={() => props.onChangeSymbol(pair)}
          key={`${nanoid()}_${pair}`}
          borderRadius='md'
          variant='solid'
          fontWeight={'bold'}
          colorScheme='gray'
          bgColor={Colors.binance}
          textColor='black'
        >
          <TagLabel as='button'>{pair}</TagLabel>
          <TagCloseButton
            onClick={onDelete(pair)}
          />
        </Tag>
      )}
    </HStack>
  );
}

export default Recently;