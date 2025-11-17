// Supabase client added automatically
import { supabase } from '../../lib/supabaseClient';
// src/firestore/jobService.js (Final Correct Version)

import { db } from '../firebase';
// REMOVED firebase import (converted to Supabase)

export const postNewJob = async (jobData, companyId) => {
    try {
        // 1. MUST MATCH COLLECTION NAME IN FIREBASE RULES
        await // Converted addDoc -> supabase.from('listings').insert([...])
await supabase.from('listings').insert([{ 
            ...jobData,
            
            // 2. MUST MATCH FIELD NAME IN FIREBASE RULES
            companyUID: companyId, // <-- CRITICAL FIELD
            
            status: 'Active',
            applicantsCount: 0,
            createdAt: serverTimestamp(]),
        });
        console.log("Job posted successfully!");
    } catch (error) {
        console.error("Error posting job: ", error);
        throw new Error('Failed to post job due to a database error.');
    }
};