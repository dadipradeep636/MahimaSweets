import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mahima Sweets | A little sweetness. A lot of heart.',
  description: 'Explore Indian sweets and thoughtful gift boxes at Mahima Sweets, Gangavathi, Karnataka. Sample storefront with an interactive 3D experience.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
