import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin"; // Use the admin client!

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const { internId } = params;

    // 1. Get the intern's embedding
    const { data: internEmbedding, error: embedError } = await supabaseAdmin
      .from("intern_embeddings")
      .select("embedding")
      .eq("intern_id", internId)
      .single();

    if (embedError || !internEmbedding?.embedding) {
      throw new Error("Intern embedding not found or is null.");
    }

    // 2. Call the 'match_jobs' function
    const { data: matches, error: rpcError } = await supabaseAdmin.rpc(
      "match_jobs",
      {
        query_embedding: internEmbedding.embedding,
      }
    );

    if (rpcError) {
      throw new Error(`RPC Error: ${rpcError.message}`);
    }
    
    if (!matches || matches.length === 0) {
      return NextResponse.json([]);
    }

    // 3. Get the job details for the matched IDs
    const jobIds = matches.map((match) => match.job_id);

    // ✨--- THIS IS THE UPGRADED PART ---✨
    // We now select everything your modal needs, just like your Listings page
    const { data: jobs, error: jobError } = await supabaseAdmin
      .from("job_posts")
      .select(`
        id,
        title,
        location,
        created_at,
        salary,
        description,
        responsibilities, 
        requirements,
        work_setup,
        work_schedule,
        company_id,
        companies (name),
        job_applications:job_applications!fk_job_applications_job (intern_id)
      `)
      .in("id", jobIds);

    if (jobError) {
      throw new Error(`Job fetch error: ${jobError.message}`);
    }

    // 4. Combine the job details with their similarity scores
    const finalResults = jobs.map((job) => ({
      ...job,
      // Add the company name field, just like your Listings page
      company: job.companies ? job.companies.name : 'Unknown Company',
      companies: undefined, // Clean up the object
      similarity: matches.find((m) => m.job_id === job.id).similarity,
    }));

    // Sort by similarity (descending)
    finalResults.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json(finalResults);

  } catch (err) {
    console.error("Error in match API:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}