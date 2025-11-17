import './globals.css';
import './index.css';
import LayoutWrapper from './components/LayoutWrapper';

export const metadata = {
  title: 'Internship Portal',
  description: 'A platform connecting interns and companies',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
