import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DataGov — Controlled Data Exchange Platform',
  description:
    'Publish, govern, and share datasets with fine-grained access control and secure insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="bg-white border-t border-gray-200 py-6 mt-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
                DataGov &copy; {new Date().getFullYear()} — Controlled Data Exchange Platform
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
