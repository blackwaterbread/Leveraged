import { Button, Input, Text } from "@chakra-ui/react";
import { Colors } from "lib/theme";
import { useEffect, useRef, useState } from "react";
import BinanceClass from 'node-binance-api';
import BinanceLogo from '../assets/logos/Binance.svg';
import { AuthenticationStore } from 'services/store';
const { Application, Binance } = window;

interface Props {
  onReloadApplication: () => void
}

function Register(props: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isShowErrorMessage, setIsShowErrorMessage] = useState<boolean>(false);
  const [errorCode, setErrorCode] = useState<string>('');

  const refAPIKey = useRef<HTMLInputElement>(null);
  const refAPISecret = useRef<HTMLInputElement>(null);

  const initalizeComponent = () => {
    Application.setSize(1024, 800);
    Application.setResizable(true);
  }

  const verifyAPIKey = async () => {
    setIsLoading(true);
    if (refAPIKey.current && refAPISecret.current) {
      const apiKey = refAPIKey.current?.value;
      const apiSecret = refAPISecret.current?.value;
      if (apiKey && apiSecret) {
        const binance: BinanceClass = Binance.getBinance(apiKey, apiSecret);
        await binance.useServerTime();
        const account = await binance.futuresAccount();
        if (account.code) {
          setIsShowErrorMessage(true);
          setErrorCode(`Code ${account.code}, ${account.msg}`);
        }
        else {
          AuthenticationStore.set({ apiKey: apiKey, apiSecret: apiSecret });
          props.onReloadApplication();
        }
      }
      else {
        setIsShowErrorMessage(true);
        setErrorCode('API Key, Secret 입력 칸이 비어 있습니다.');
      }
    }
    setIsLoading(false);
  }

  useEffect(() => { initalizeComponent(); }, []);

  return (
    <div className='flex flex-col justify-center overflow-hidden items-center p-4 bg-[#161A1E] w-screen h-screen'>
      <div className='flex flex-col space-y-2 w-3/4'>
        <div className='flex justify-between'>
          <Text className='flex justify-start items-center font-bold text-4xl'>
            로그인
          </Text>
          <Button fontSize='xl' variant='ghost'>
            <a href='https://github.com/blackwaterbread/Leveraged' rel="noopener noreferrer" target="_blank">
              ?
            </a>
          </Button>
        </div>
        <div className='flex justify-start items-center'>
          <img src={BinanceLogo} alt='Binance' />
          <Text fontSize='md' fontWeight='bold' textColor='gray.400'>
            에서 발급받은 API Key를 입력해 주세요.
          </Text>
        </div>
        <Input ref={refAPIKey} disabled={isLoading} variant='filled' placeholder='API Key' />
        <Input ref={refAPISecret} disabled={isLoading} variant='filled' placeholder='API Secret' />
        <Text hidden={!isShowErrorMessage} fontSize='md' fontWeight='normal' textColor={Colors.bear} textAlign='end'>
          연결 실패 ({errorCode})
        </Text>
        <Button
          isLoading={isLoading}
          loadingText='연결 중'
          onClick={verifyAPIKey}
          paddingX={8}
          className='self-end'
        >
          확인
        </Button>
      </div>
    </div>
  )
}

export default Register;