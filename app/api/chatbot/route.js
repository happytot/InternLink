import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { studentId, message } = await req.json();

    if (!studentId || !message) {
      return NextResponse.json(
        { reply: "Missing studentId or message." },
        { status: 400 }
      );
    }

    // SERVER-SIDE SUPABASE CLIENT
    const supabase = createRouteHandlerClient({ cookies });

    const { data: student, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", studentId)
      .single();

    if (error || !student) {
      console.error("Profile error:", error);
      return NextResponse.json(
        { reply: "Student profile not found." },
        { status: 404 }
      );
    }

    // Ensure skills becomes an array
    const skillsList = Array.isArray(student.skills)
      ? student.skills
      : typeof student.skills === "string"
      ? student.skills.split(",").map((s) => s.trim())
      : [];

    const prompt = `
You are an AI Internship Assistant.
Student skills: ${skillsList.join(", ") || "none"}.
Student asked: "${message}"
Reply in a friendly and helpful way.
    `;

    // Validate API key
    if (!process.env.AIMLAPI_KEY) {
      console.error("Missing AIMLAPI_KEY in env!");
      return NextResponse.json(
        { reply: "AI service not configured." },
        { status: 500 }
      );
    }

    // Call AIMLAPI
    const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIMLAPI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful AI internship assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("AIMLAPI error:", await response.text());
      return NextResponse.json(
        { reply: "AI service unavailable." },
        { status: 200 }
      );
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "No response.";

    return NextResponse.json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { reply: "Internal server error." },
      { status: 500 }
    );
  }
}
