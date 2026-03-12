'use client';

import React, { createContext, FC, PropsWithChildren, useContext } from 'react';

const CONTEXT_ROOT_URLS_ENV = 'NEXT_PUBLIC_CONTEXT_ROOT_URLS';

function parseContextRootUrls(): Record<string, string> {
  const raw = process.env[CONTEXT_ROOT_URLS_ENV];
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getServerUrlFromContext(contextRoot: string | null): string {
  const defaultUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? '';
  if (!contextRoot) return defaultUrl;
  const key = contextRoot.toLowerCase();
  const urls = parseContextRootUrls();
  return (urls[key] as string) ?? defaultUrl;
}

const ServerUrlContext = createContext<string | null>(null);

export const useServerUrl = (): string => {
  const contextRoot = useContext(ServerUrlContext);
  return getServerUrlFromContext(contextRoot);
};

export const useContextRoot = (): string | null => useContext(ServerUrlContext);

export const ServerUrlProvider: FC<PropsWithChildren<{ contextRoot: string | null }>> = ({
  children,
  contextRoot,
}) => (
  <ServerUrlContext.Provider value={contextRoot}>
    {children}
  </ServerUrlContext.Provider>
);

export { getServerUrlFromContext };
