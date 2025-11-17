import { NextResponse } from "next/server";
// ✨ FIXED: Using the admin client
import { supabaseAdmin } from "../../../../lib/supabaseAdmin"; 
// ✨ FIXED: Using the correct alias path
import { generateEmbedding } from "../../../../server/generateEmbedding";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { job_id } = await req.json();

    // ✨ FIXED: Must use supabaseAdmin to fetch data (bypasses RLS)
    const { data: job, error } = await supabaseAdmin
      .from("job_posts")
      .select("title, description, requirements, responsibilities")
      .eq("id", job_id)
      .single();

    if (error || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const text = `
      ${job.title}
      ${job.description}
      Requirements: ${(job.requirements || []).join(", ")}
      Responsibilities: ${(job.responsibilities || []).join(", ")}
    `;

    const embedding = await generateEmbedding(text);

    // ✨ FIXED: Must use supabaseAdmin to write to the embeddings table (bypasses RLS)
    const { error: upsertError } = await supabaseAdmin.from("job_embeddings").upsert({
      job_id,
      text_data: text,
      embedding,
    });

    if (upsertError) {
      // If it fails, report the error!
      throw upsertError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}