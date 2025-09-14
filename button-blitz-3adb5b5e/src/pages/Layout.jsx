
import React from 'react';
import { SettingsProvider } from './components/SettingsProvider';
import TermsCheck from './components/auth/TermsCheck';

export default function Layout({ children }) {
  return (
    <SettingsProvider>
      <TermsCheck />
      {children}
    </SettingsProvider>
  );
}
