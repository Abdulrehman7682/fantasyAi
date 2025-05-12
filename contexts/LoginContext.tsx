// contexts/LoginContext.tsx
import React, { createContext, useEffect, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainerRef, createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef(); // 👈 yeh bahar hona chahiye

const LoginContext = createContext<any>(null);

export const LoginProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLogin, setIsLogin] = useState<boolean>(false);

  useEffect(() => {
    const checkLogin = async () => {
      const stored = await AsyncStorage.getItem('isLogin');
      if (stored === 'true') {
        setIsLogin(true);
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    };

    checkLogin();
  }, []);

  return (
    <LoginContext.Provider value={{ isLogin, setIsLogin }}>
      {children}
    </LoginContext.Provider>
  );
};

export const useLogin = () => useContext(LoginContext);
