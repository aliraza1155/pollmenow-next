// app/layout.tsx
import './globals.css';
import { DM_Sans, DM_Mono } from 'next/font/google';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccountProvider } from '@/contexts/AccountContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata = {
  title: 'PollMeNow – Create AI‑powered polls, get real‑time insights',
  description: 'Create, share, and vote on polls with real-time analytics and AI assistance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AccountProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
            </AccountProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}