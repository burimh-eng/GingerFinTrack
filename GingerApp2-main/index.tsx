import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Login from './components/Login';
import './i18n';
import { OptionProvider } from './OptionContext';

// Authentication context
interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  role: string | null;
  login: (username: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: null,
  role: null,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    if (storedUsername && storedRole) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      setRole(storedRole);
    }
  }, []);

  const login = async (username: string, role: string) => {
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    setIsAuthenticated(true);
    setUsername(username);
    setRole(role);
    
    // Log the login action
    try {
      await fetch('/api/audit/log-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
    } catch (error) {
      console.error('Failed to log login:', error);
    }
  };

  const logout = async () => {
    const currentUsername = username;
    
    // Log the logout action before clearing state
    if (currentUsername) {
      try {
        await fetch('/api/audit/log-logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUsername }),
        });
      } catch (error) {
        console.error('Failed to log logout:', error);
      }
    }
    
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setUsername(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Main component with conditional rendering
const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <OptionProvider>
        <MainApp />
      </OptionProvider>
    </AuthProvider>
  </React.StrictMode>
);