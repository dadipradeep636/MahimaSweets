import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mahima Sweets | Sweet tooth? We get you.',
  description: 'Discover mithai, crunchy namkeens, hot samosas and pakodi at Mahima Sweets, Gangavathi, Karnataka. A sample storefront with a layered animated product experience.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{var t=localStorage.getItem('mahima-theme');document.documentElement.dataset.theme=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch{document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}`}}/></head><body>{children}</body></html>;
}

