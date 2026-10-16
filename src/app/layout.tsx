import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mahima Sweets | Sweet tooth? We get you.',
  description: 'Discover mithai, crunchy namkeens, hot samosas and pakodi at Mahima Sweets, Gangavathi, Karnataka. A sample storefront with a layered animated product experience.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

