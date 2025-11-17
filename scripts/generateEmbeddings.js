import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oxdyxyqopanvsttfoxny.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZHl4eXFvcGFudnN0dGZveG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI5MDc1NywiZXhwIjoyMDc2ODY2NzU3fQ.IqEdk19tAYiMVb-c9VuE6aiLW-6RZ2Vuumdrl-x04t0";

const API_URL = "http://localhost:3000/api/embedding/job";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateAllEmbeddings() {
  const { data: jobs, error } = await supabase.from("job_posts").select("id");
  if (error || !jobs) return console.error(error);

  for (const job of jobs) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id }),
      });

      const result = await response.json();
      console.log(result.success ? `✅ ${job.id}` : `⚠️ ${job.id}: ${result.error}`);
    } catch (err) {
      console.error(`❌ ${job.id}: ${err.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

generateAllEmbeddings();
