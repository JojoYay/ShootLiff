'use client';

import React, { createContext, FC, PropsWithChildren, useContext } from 'react';
import { usePathname } from 'next/navigation';

function parseContextRootUrls(): Record<string, string> {
  const raw = process.env.NEXT_PUBLIC_CONTEXT_ROOT_URLS;
  console.log('raw', raw);
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    console.log('parsed', parsed);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getServerUrlFromContext(contextRoot: string | null): string {
  const defaultUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? '';
  if (!contextRoot) return defaultUrl;
  const key = contextRoot.toLowerCase();
  const urls = parseContextRootUrls();
  const url = urls[key];
  return typeof url === 'string' ? url : defaultUrl;
}

const ServerUrlContext = createContext<string | null>(null);

function getContextRootFromPathname(pathname: string | null): string | null {
  if (!pathname || pathname === '/') return null;
  const segment = pathname.replace(/^\//, '').split('/')[0]?.toLowerCase();
  if (!segment) return null;
  const urls = parseContextRootUrls();
  return urls[segment] !== undefined ? segment : null;
}

export const useServerUrl = (): string => {
  const contextRootFromProvider = useContext(ServerUrlContext);
  const pathname = usePathname();
  const contextRootFromPath = getContextRootFromPathname(pathname);
  console.log('contextRootFromPath', contextRootFromPath);
  const effectiveContext = contextRootFromPath ?? contextRootFromProvider;
  return getServerUrlFromContext(effectiveContext);
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
