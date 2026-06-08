import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GuideRoom',
  description: 'Create a live audio room. Visitors scan and listen with their own phones.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
