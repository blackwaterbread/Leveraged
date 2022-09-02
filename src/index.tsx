import React from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import Theme from './lib/theme';
import './index.css';
import App from './App';
import { createRoot } from "react-dom/client";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ChakraProvider theme={Theme}>
      <ColorModeScript initialColorMode='dark' />
      <App />
    </ChakraProvider>
  </React.StrictMode>
);