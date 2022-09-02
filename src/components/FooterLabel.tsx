import { Text, TextProps } from "@chakra-ui/react";

interface Props extends TextProps {
  label: string,
}

function FooterLabel(props: Props) {
  return (
    <Text
      textColor='gray.600' 
      fontSize='sm' 
      fontWeight='bold' 
      textAlign='end'
      {...props}
    >
      {props.label}
    </Text>
  )
}

export default FooterLabel;