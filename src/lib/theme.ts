import { extendTheme, ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
    initialColorMode: 'dark',
    useSystemColorMode: false,
};

export const Colors = {
    background: '#222222',
    inner: '#282a36',
    title: '#ffffff',
    text: '#d1d5db',
    bull: '#68D391',
    bear: '#F56565',
    funding: '#DD6B20'
}

const theme = extendTheme({ config });
export default theme;