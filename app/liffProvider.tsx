'use client';
import React, {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Liff } from '@line/liff';

const LiffContext = createContext<{
  liff: Liff | null;
  liffError: string | null;
}>({ liff: null, liffError: null });

export const useLiff = () => useContext(LiffContext);

export const LiffProvider: FC<PropsWithChildren<{ liffId: string }>> = ({
  children,
  liffId,
}) => {
  const [liff, setLiff] = useState<Liff | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initLiff = useCallback(async () => {
    try {
      const liffModule = await import('@line/liff');
      const liff = liffModule.default;
      console.log('LIFF init...' + liffId);
      
      // キャッシュを無効化するためのタイムスタンプを追加
      const timestamp = new Date().getTime();
      const redirectUri = new URL(window.location.href);
      redirectUri.searchParams.set('_t', timestamp.toString());
      
      await liff.init({ 
        liffId,
        withLoginOnExternalBrowser: true // 外部ブラウザでもログインを有効化
      });

      if (!liff.isLoggedIn()) {
        liff.login({ 
          redirectUri: redirectUri.toString()
        });
        return;
      }

      setLiff(liff);
      setIsInitialized(true);
    } catch (error) {
      console.error('LIFF init failed:', error);
      setLiffError((error as Error).toString());
    }
  }, [liffId]);

  // init Liff
  useEffect(() => {
    if (!isInitialized) {
      initLiff();
    }
  }, [initLiff, isInitialized]);

  return (
    <LiffContext.Provider
      value={{
        liff,
        liffError,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
};