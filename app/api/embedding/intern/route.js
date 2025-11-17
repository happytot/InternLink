import { NextResponse } from "next/server";
// ✨ FIXED: Using the admin client
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
// ✨ FIXED: Using the correct alias path
import { generateEmbedding } from "../../../../server/generateEmbedding";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { intern_id } = await req.json();

    // ✨ FIXED: Must use supabaseAdmin to fetch profile (bypasses RLS)
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("summary, skills")
      .eq("id", intern_id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    const text = `
      Skills: ${(profile.skills || []).join(", ")}
      Summary: ${profile.summary}
    `;

    const embedding = await generateEmbedding(text);

    // ✨ FIXED: Must use supabaseAdmin to write to the embeddings table (bypasses RLS)
    const { error: upsertError } = await supabaseAdmin.from("intern_embeddings").upsert({
      intern_id,
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