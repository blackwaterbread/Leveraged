import { Select } from "@chakra-ui/react";
import { nanoid } from "nanoid";

interface Props {
  value?: string,
  onChangeSymbol: React.Dispatch<React.SetStateAction<string>>,
  symbols?: string[]
}

function SelectSymbol(props: Props) {
  const selectHandler: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const symbol = e.target.value;
    props.onChangeSymbol(symbol);
  }
  return (
    <Select
      onChange={selectHandler}
      bg='blackAlpha.600'
      size='md'
      variant='filled'
      fontWeight='bold'
      placeholder='계약 선택'
      value={props.value}
    >
      {props.symbols?.map((v, i) => {
        // return <option key={`${nanoid()}`} value={v}>{v}</option>
        return <option key={`symbol_${i}`} value={v}>{v}</option>
      })}
    </Select>
  );
}

export default SelectSymbol;