import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Raccoon Inc. - Air Quality Monitor',
  description: 'Monitor your home air quality in real-time',
};

export default function RootLayout({ children }) {
  return (
    
      {children}
    
  );
}