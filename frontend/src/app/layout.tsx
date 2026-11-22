import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'ClipForge AI — Long Video to Viral Shorts',
  description: 'AI-powered YouTube Long Video to 9:16 Viral Shorts Clipper with Smart Subject Tracking, Hindi Captions, and Voice-Over.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-slate-100 min-h-screen flex antialiased selection:bg-brand-500 selection:text-white">
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
