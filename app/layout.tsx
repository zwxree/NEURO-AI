import type {Metadata} from 'next';
import { Inter, Caveat } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-handwriting',
});

export const metadata: Metadata = {
  title: 'Neuro Learning Book',
  description: 'An educational teaching application for neuroscience.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
