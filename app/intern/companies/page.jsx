// app/intern/companies/page.jsx
// (This is a SERVER COMPONENT - no 'use client')
import './companies.css'; // Import the CSS here
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import CompaniesClient from './CompaniesClient'; // Import our client file
import InternNav from '../../components/InternNav';



// This is the (slow) data-fetching logic from your old file.
// But now it runs on the server, which is much faster.
const fetchCompanies = async (supabase) => {
  try {
    let { data: companiesData, error } = await supabase
      .from('companies')
      .select('id, name, description, logo_url, star_rating, email, phone, ceo');

    if (error) throw error;

    const companiesWithJobs = await Promise.all(
      (companiesData || []).map(async (company) => {
        const { data: jobs } = await supabase
          .from('job_posts')
          .select('id, title, description, location, work_setup, salary, responsibilities, company_id') // Added company_id
          .eq('company_id', company.id);

        const { count: applicationsCount } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id);

        return {
          ...company,
          job_posts: jobs || [],
          applications_count: applicationsCount || 0,
        };
      })
    );
    return companiesWithJobs;
  } catch (err) {
    console.error('Error fetching companies on server:', err);
    return [];
  }
};

// This is the new Server Component page
export default async function CompaniesPage() {
  const supabase = createServerComponentClient({ cookies });

  // 1. We fetch all the data on the server first.
  const initialCompanies = await fetchCompanies(supabase);

  // 2. We render the static layout and pass the data to the client.
  return (
    <div className="companies-page">
      
      <InternNav />
      <h1> Companies</h1>
      
      {/* The client component is only for the *interactive* parts 
        (search, modal, and applying). It gets the data as a prop.
      */}
      <CompaniesClient initialCompanies={initialCompanies} />
    </div>
  );
}