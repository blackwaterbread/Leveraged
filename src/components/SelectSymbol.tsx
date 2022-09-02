import { Select, SelectProps } from "@chakra-ui/react";

interface Props extends SelectProps {
  onChange?: React.ChangeEventHandler<HTMLSelectElement>,
  symbols?: string[]
}

function SelectSymbol(props: Props) {
  return (
    <Select
      onChange={props.onChange}
      bg='blackAlpha.600'
      size='md'
      variant='filled'
      fontWeight='bold'
      placeholder='계약 선택'
    >
      {props.symbols?.map((v, i) => {
        return <option key={`symbol_${i}`} value={v}>{v}</option>
      })}
    </Select>
  );
}

export default SelectSymbol;