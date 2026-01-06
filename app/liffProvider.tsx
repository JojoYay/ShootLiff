'use client';
import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { Liff } from '@line/liff';

// LIFFの状態を管理するコンテキスト
const LiffContext = createContext<{
  liff: Liff | null;
  liffError: string | null;
  isInitialized: boolean;
}>({ 
  liff: null, 
  liffError: null,
  isInitialized: false 
});

export const useLiff = () => useContext(LiffContext);

export const LiffProvider: FC<PropsWithChildren<{ liffId: string }>> = ({
  children,
  liffId,
}) => {
  const [liff, setLiff] = useState<Liff | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();

  // LIFFを無効化する条件をチェック
  const shouldDisableLiff = () => {
    // 特定のパスで無効化（例：/name）
    if (pathname === '/name') {
      return true;
    }

    return false;
  };

  const isDisabled = shouldDisableLiff();

  useEffect(() => {
    // LIFFが無効化されている場合は初期化をスキップ
    if (isDisabled) {
      console.log('LIFF is disabled for this page');
      setIsInitialized(true);
      return;
    }

    if (isInitialized) return;

    // 現在のURL情報を保存
    const currentUrl = new URL(window.location.href);
    const currentPath = currentUrl.pathname;
    const urlSearchParams = new URLSearchParams(currentUrl.search);

    // LIFF SDKの読み込みと初期化
    import('@line/liff')
      .then(liffModule => {
        const liff = liffModule.default;
        console.log('LIFF initializing...', { liffId });

        return liff.init({
          liffId,
          // withLoginOnExternalBrowser: true
        }).then(() => {
          console.log('LIFF initialized successfully');
          setLiff(liff);
          setIsInitialized(true);

          // liff.stateパラメータを取得（LINEブラウザからのアクセスの場合）
          const liffState = urlSearchParams.get('liff.state');
          
          // ログインが必要な場合
          if (!liff.isLoggedIn()) {
            // リダイレクトURLを構築（現在のパスを保持）
            const redirectUri = `${currentUrl.origin}${currentPath}`;
            console.log('Redirecting to:', redirectUri);
            return liff.login({ redirectUri });
          } else if (liffState) {
            // ログイン済みでliff.stateがある場合
            console.log('Redirecting to target path:', liffState);
            window.location.replace(liffState);
          }
        });
      })
      .catch(error => {
        console.error('LIFF initialization failed:', error);
        setLiffError((error as Error).toString());
      });
  }, [liffId, isDisabled, isInitialized]); // isDisabledを依存配列に追加

  return (
    <LiffContext.Provider
      value={{
        liff,
        liffError,
        isInitialized
      }}
    >
      {children}
    </LiffContext.Provider>
  );
};