import { useEffect, useRef, useState } from 'react';
import Main from './containers/Main';
import Register from 'containers/Register';
import { AuthenticationStore } from 'services/store';

function App() {
  const authentication = useRef<IAuthentication>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const initalizeComponent = () => {
    const auth = AuthenticationStore.get();
    if (auth) {
      authentication.current = auth;
      setIsAuthenticated(true);
    }
  }

  const onLogout = () => {
    setIsAuthenticated(false);
  }

  useEffect(() => { initalizeComponent() }, []);
  return (
    <div className="overflow-hidden p-4 bg-[#161A1E] w-screen h-screen">
      {
        isAuthenticated ? 
          <Main authentication={authentication.current} onLogout={onLogout} /> : 
          <Register onReloadApplication={initalizeComponent} />
      }
    </div>
  );
}

export default App;