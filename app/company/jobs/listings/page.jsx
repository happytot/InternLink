// app/company/jobs/listings/page.jsx
// (This is a SERVER COMPONENT - no 'use client')

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CompanyJobListingsClient from './CompanyJobListingsClient';
import '../../../globals.css'

// This page is now 'async'
export default async function CompanyJobListingsPage() {
  const supabase = createServerComponentClient({ cookies });

  // 1. Get the user on the server
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // 2. If no user, redirect to login on the server
    redirect('/auth/companyAuthPage');
  }

  // 3. Fetch the data on the server. This is fast.
  const { data: jobs, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('company_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error.message);
  }

  // 4. Pass the fetched jobs as a prop to the client component
  // The client component will now load instantly with this data.
  return (
    <CompanyJobListingsClient initialJobs={jobs || []} />
  );
}