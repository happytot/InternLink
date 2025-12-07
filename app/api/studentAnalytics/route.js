// pages/api/studentAnalytics.js
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ error: "Missing studentId" });

    // Fetch weekly evaluations
    const { data: evaluations, error: evalError } = await supabase
      .from("weekly_evaluations")
      .select("*")
      .eq("student_id", studentId)
      .order("week_start_date", { ascending: true });

    if (evalError) throw evalError;

    // Fetch student profile
    const { data: student, error: studentError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Fetch job posts
    const { data: jobs, error: jobsError } = await supabase
      .from("job_post")
      .select("*");

    if (jobsError) throw jobsError;

    // Calculate top matches based on skill overlap
    const matches = (jobs || [])
      .map(job => {
        let score = 0;

        if (job.requirements && Array.isArray(student.skills)) {
          const jobSkills = job.requirements.split(",").map(s => s.trim().toLowerCase());
          const studentSkills = student.skills.map(s => s.toLowerCase());

          // Count number of matching skills
          score = jobSkills.filter(skill => studentSkills.includes(skill)).length;
        }

        return { title: job.title, company: job.company_name, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // top 5 matches

    res.status(200).json({ evaluations, matches });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
