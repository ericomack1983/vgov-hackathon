'use client';

import { useState } from 'react';
import { MarketplaceHero } from './_components/MarketplaceHero';
import { SignInPage } from './_components/SignInPage';
import { SignUpPage } from './_components/SignUpPage';
import { PortalApp } from './_components/PortalApp';

export type PageState = 'hero' | 'signin' | 'signup' | 'app';

export default function SupplierPortalPage() {
  const [page, setPage] = useState<PageState>('hero');

  return (
    <>
      {page === 'hero'   && <MarketplaceHero onSignIn={() => setPage('signin')} onSignUp={() => setPage('signup')} />}
      {page === 'signin' && <SignInPage  onSignedIn={() => setPage('app')} onSignUp={() => setPage('signup')} onBack={() => setPage('hero')} />}
      {page === 'signup' && <SignUpPage  onComplete={() => setPage('signin')} onBack={() => setPage('signin')} />}
      {page === 'app'    && <PortalApp   onSignOut={() => setPage('hero')} />}
    </>
  );
}
