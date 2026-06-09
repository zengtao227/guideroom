import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const metadata: Metadata = {
  title: 'GuideRoom',
  description: 'Create a live audio room. Visitors scan and listen with their own phones.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <header className="fixed right-4 top-4 z-50">
            <LanguageSwitcher />
          </header>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
