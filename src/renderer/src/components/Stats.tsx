import { Text, TextProps } from "@chakra-ui/react";

type DivProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
interface Props extends DivProps {
  title: string,
  titleProps?: TextProps,
  value: string,
  valueProps?: TextProps
}

function Stats(props: Props) {
  return (
    <div className={props.className}>
      <Text
        fontSize='sm'
        fontWeight='normal'
        textColor='gray.400'
        {...props.titleProps}
      >
        {props.title}
      </Text>
      <Text
        fontSize='sm'
        fontWeight='bold'
        textColor='white'
        {...props.valueProps}
      >
        {props.value}
      </Text>
    </div>
  );
}

export default Stats;