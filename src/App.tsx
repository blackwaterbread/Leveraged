import { useEffect, useRef, useState } from 'react';
import Main from './pages/Main';
import Register from 'pages/Register';

const { Application } = window;

function App() {
  const authentication = useRef<IAuthentication>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const initalizeComponent = () => {
    const auth = Application.getStore('authentication');
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