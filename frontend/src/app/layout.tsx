import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ClickSpark } from '@/components/reactbits';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ClipForge AI — Studio Shorts Engine',
  description: 'AI-powered Long Video to 9:16 Viral Shorts Clipper with Smart Subject Tracking, Hindi Captions, and Voice-Over.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-surface text-slate-900 min-h-screen flex antialiased selection:bg-brand-600 selection:text-white">
        <AuthProvider>
          <ClickSpark sparkColor="#e11d48" sparkRadius={18} sparkSize={8} sparkCount={8}>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
                {children}
              </main>
            </div>
          </ClickSpark>
        </AuthProvider>
      </body>
    </html>
  );
}
