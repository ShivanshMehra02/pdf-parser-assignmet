import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tamil PDF Translator - Real Estate Transaction Parser',
  description: 'Upload and translate Tamil real estate documents to English',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {children}
      </body>
    </html>
  );
}
