// src/app/company/layout.js
import CompanyNav from '../components/CompanyNav';

export default function CompanyLayout({ children }) {
  return (
    <>
      <CompanyNav />
      <main className="company-main">{children}</main>
    </>
  );
}
