import './globals.css';
import { Inter } from 'next/font/google';
import RootLayoutClient from './layout-client';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Evoline MedSlot — UAE Healthcare Platform',
  description: 'Book appointments, buy clinics, or invest in healthcare across the UAE.',
  keywords: 'UAE healthcare, clinic booking, medical appointments Dubai',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
