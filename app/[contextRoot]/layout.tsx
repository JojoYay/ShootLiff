import React from 'react';
import { ServerUrlProvider } from '../context/serverUrlContext';

function getContextRoots(): string[] {
  const raw = process.env.NEXT_PUBLIC_CONTEXT_ROOT_URLS;
  if (!raw || typeof raw !== 'string') return ['bvs', 'shoot', 'cs'];
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.keys(parsed || {}).filter(Boolean);
  } catch {
    return ['bvs', 'shoot', 'cs'];
  }
}

export function generateStaticParams() {
  return getContextRoots().map((contextRoot) => ({ contextRoot }));
}

export default function ContextRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { contextRoot: string };
}) {
  return (
    <ServerUrlProvider contextRoot={params.contextRoot}>
      {children}
    </ServerUrlProvider>
  );
}
