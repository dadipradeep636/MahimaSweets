import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mahima Sweets | Sweet tooth? We get you.',
  description: 'Mithai, crunchy namkeens, hot samosas, pakodi and festive gift boxes from Mahima Sweets, opposite Amar Hospitals, Gangavathi, Karnataka. Open 8 AM – 9:30 PM. Call or WhatsApp to order.',
};

/* Dark "royal" theme is the default; a visitor's saved choice from the toggle wins. */
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('mahima-theme')==='light'?'light':'dark'}catch{document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
