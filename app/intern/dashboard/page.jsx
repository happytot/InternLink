'use client';
import './Dashboard.css';
import InternNav from '../../components/InternNav';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { toast } from 'sonner';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useSearchParams } from 'next/navigation';
import FloatingAIChatWithCharts from '../../components/chatbot';

import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  Calendar, 
  Star, 
  MessageSquare,
  ClipboardList,
  User,
  ExternalLink,
  ChevronRight,
  Loader2,
  Sun,   // Added for Theme Toggle
  Moon   // Added for Theme Toggle
} from 'lucide-react';


const isNewAnnouncement = (createdAt) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const announcementDate = new Date(createdAt);
    return announcementDate > twentyFourHoursAgo;
};
// --- Helper: Get Date for Welcome Box ---
const getCurrentDate = () => {
  const date = new Date();
  return {
    day: date.toLocaleDateString('en-US', { weekday: 'long' }),
    dateStr: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  };
};

// --- SKELETON COMPONENTS (Unchanged) ---
const SkeletonBox = ({ width = '100%', height = '20px', className = '' }) => (
  <div className={`skeleton-box ${className}`} style={{ width, height }}></div>
);

const StatsSkeleton = () => (
  <section className="bento-grid-stats">
    {[...Array(4)].map((_, i) => (
      <div key={i} className={`stat-card stat-skeleton`}>
        <SkeletonBox width="48px" height="48px" className="rounded-full" />
        <div className="stat-content">
          <SkeletonBox width="60px" height="24px" className="mb-1" />
          <SkeletonBox width="80px" height="16px" />
        </div>
      </div>
    ))}
  </section>
);

const SliderSkeleton = () => {
  const isMobile = useMediaQuery('(max-width: 600px)');
  const pageSize = isMobile ? 1 : 2;

  return (
    <section className="card dashboard-slider-card">
      <div className="slider-header">
        <SkeletonBox width="180px" height="26px" />
      </div>
      <div className="slider-container">
        <div className="slider-track">
          <div className="slider-page">
            {[...Array(pageSize)].map((_, i) => (
              <div key={i} className="app-card skeleton-card">
                <SkeletonBox width="80px" height="20px" className="mb-3" />
                <div className="flex-grow">
                  <SkeletonBox width="90%" height="22px" className="mb-2" />
                  <SkeletonBox width="60%" height="18px" />
                </div>
                <SkeletonBox width="100px" height="14px" className="self-end" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <SkeletonBox width="100px" height="16px" className="view-all-link-skeleton" />
    </section>
  );
};

const WidgetSkeleton = () => (
  <div className="dashboard-sidebar">
    <section className="card profile-card skeleton-widget">
      <SkeletonBox width="150px" height="24px" className="mx-auto mb-3" />
      <SkeletonBox width="80%" height="16px" className="mx-auto mb-5" />
      <SkeletonBox width="120px" height="38px" className="mx-auto" />
    </section>
    <section className="card dashboard-announcements skeleton-widget">
      <SkeletonBox width="180px" height="26px" className="mb-3" />
      <div className="announcement-list">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="announcement-card">
            <SkeletonBox width="60px" height="60px" className="rounded-sm" />
            <div className="announcement-content">
              <SkeletonBox width="80%" height="18px" className="mb-1" />
              <SkeletonBox width="95%" height="14px" className="mb-1" />
              <SkeletonBox width="70%" height="14px" />
            </div>
          </div>
        ))}
      </div>
      <SkeletonBox width="100px" height="16px" className="view-all-link-skeleton mt-3 ml-auto" />
    </section>
  </div>
);

// --- 1. Stats Summary (Unchanged) ---
const StatsSummary = ({ applications }) => {
  const totalApplied = applications.length;
  const interviews = applications.filter(a => a.status && a.status.toLowerCase().includes('interview')).length;
  const offers = applications.filter(a => a.status && a.status.toLowerCase() === 'accepted').length;

  return (
    <section className="bento-grid-stats">
      <Link href="/intern/history" className="stat-card stat-total-applied">
        <div className="stat-icon-bg"><ClipboardList size={20} strokeWidth={2.5} /></div>
        <div className="stat-content">
          <span className="stat-value">{totalApplied}</span>
          <span className="stat-label">Applied</span>
        </div>
      </Link>
      <Link href="/intern/history?status=Interview" className="stat-card stat-interviews">
        <div className="stat-icon-bg"><Users size={20} strokeWidth={2.5} /></div>
        <div className="stat-content">
          <span className="stat-value">{interviews}</span>
          <span className="stat-label">Interviews</span>
        </div>
      </Link>
      <Link href="/intern/history?status=Accepted" className="stat-card stat-offers">
        <div className="stat-icon-bg"><CheckCircle size={20} strokeWidth={2.5} /></div>
        <div className="stat-content">
          <span className="stat-value">{offers}</span>
          <span className="stat-label">Offers</span>
        </div>
      </Link>
      <Link href="/intern/listings" className="stat-card stat-find-jobs">
        <div className="stat-icon-bg"><Briefcase size={20} strokeWidth={2.5} /></div>
        <div className="stat-content">
          <span className="stat-value">Find</span>
          <span className="stat-label">New Jobs</span>
        </div>
      </Link>
    </section>
  );
};

// --- 2. Reusable Slider (Unchanged) ---
const HorizontalSlider = ({ title, children, pageCount }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const sliderRef = useRef(null);

  const handleScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      const newPage = Math.round(scrollLeft / clientWidth);
      if (newPage !== currentPage) setCurrentPage(newPage);
    }
  };

  const slideBy = (direction) => {
    if (sliderRef.current) {
      const { clientWidth } = sliderRef.current;
      sliderRef.current.scrollBy({ left: clientWidth * direction, behavior: 'smooth' });
    }
  };

  const slideTo = (i) => {
    if (sliderRef.current) {
      const { clientWidth } = sliderRef.current;
      sliderRef.current.scrollTo({ left: clientWidth * i, behavior: 'smooth' });
    }
  }

  useEffect(() => { slideTo(0); }, [pageCount]);

return (
    <section className="card dashboard-slider-card">
      <div className="slider-header">
        <h2>{title}</h2>
        <div className="slider-controls">
          <button onClick={() => slideBy(-1)} disabled={pageCount <= 1}>‹</button>
          <button onClick={() => slideBy(1)} disabled={pageCount <= 1}>›</button>
        </div>
      </div>
      <div className="slider-container" ref={sliderRef} onScroll={handleScroll}>
        <div className="slider-track">{children}</div>
      </div>
      <div className="slider-dots">
        {Array.from({ length: pageCount }).map((_, i) => (
          <button key={i} className={`dot ${i === currentPage ? 'active' : ''}`} onClick={() => slideTo(i)} />
        ))}
      </div>
      
    </section>
  );
};

// --- 3. Application Slider (Unchanged) ---
const ApplicationSlider = ({ applications }) => {
  const isMobile = useMediaQuery('(max-width: 600px)');
  const pageSize = isMobile ? 1 : 2;

  const pages = applications.reduce((acc, _, i) => {
    if (i % pageSize === 0) acc.push(applications.slice(i, i + pageSize));
    return acc;
  }, []);

  if (!applications || applications.length === 0) {
    return (
      <section className="card dashboard-applications">
        <h2><Calendar size={20} className="card-title-icon"/> Application History</h2>
        <div className="no-applications">
          <p>No applications yet.</p>
          <Link href="/intern/listings" className="btn-primary">Find an Internship</Link>
        </div>
      </section>
    );
  }

  return (
    <>
    <HorizontalSlider 
      title={<><Calendar size={20} className="card-title-icon"/> Application History</>} 
      viewAllLink="/intern/history" 
      pageCount={pages.length}
    >
      {pages.map((page, pageIndex) => (
        <div  className="slider-page" key={pageIndex}>
          {page.map(app => (
            <div  key={app.id} className="app-card">
              <span className={`status-badge status-${(app.status || 'pending').toLowerCase().replace(/\s/g, '-')}`}>
                {app.status || 'Pending'}
              </span>
              <div>
                <h3 className="app-card-title">{app.job_posts?.title || 'Unknown Job'}</h3>
                <p className="app-card-company">{app.companies?.name || 'Unknown Company'}</p>
              </div>
              <small className="app-card-date">Applied: {new Date(app.created_at).toLocaleDateString()}</small>
            </div>
          ))}
          {page.length < pageSize && <div className="app-card-empty" />}
        </div>
      ))}
    </HorizontalSlider>
   
    </>
  );
};

// --- 4. Recommended Matches (Unchanged) ---
const RecommendedMatches = ({ user, openModal }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 600px)');
  const pageSize = isMobile ? 1 : 2;
  const searchParams = useSearchParams();
const jobId = searchParams.get("jobId");

useEffect(() => {
  if (!jobId) return;

  const el = document.getElementById(`job-${jobId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add('highlight-job');
  }
}, [jobId, matches]);


  useEffect(() => {
    if (!user?.id) return;
    const fetchMatches = async () => {
      try {
        const res = await fetch(`/api/match/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchMatches();
  }, [user]);

  if (loading) {
     return (
        <section className="card dashboard-slider-card">
            <div className="slider-header">
                <h2><Star size={20} className="card-title-icon"/> Recommended for You</h2>
            </div>
            <div className="slider-container">
                <div className="slider-page">
                    {[...Array(pageSize)].map((_, i) => (
                      <div key={i} className="job-card skeleton-card">
                        <div className="flex-grow">
                          <SkeletonBox width="90%" height="22px" className="mb-2" />
                          <SkeletonBox width="60%" height="18px" />
                        </div>
                        <SkeletonBox width="100px" height="38px" className="self-end" />
                      </div>
                    ))}
                </div>
            </div>
        </section>
     );
  }

  const pages = matches.reduce((acc, _, i) => {
    if (i % pageSize === 0) acc.push(matches.slice(i, i + pageSize));
    return acc;
  }, []);

  return (
    <HorizontalSlider 
      title={<><Star size={20} className="card-title-icon"/> Recommended for You</>} 
      viewAllLink="/intern/matches" 
      pageCount={pages.length}
    >
      {!loading && matches.length === 0 && <div className="slider-page"><p>No matches found yet.</p></div>}
      {pages.map((page, idx) => (
        <div className="slider-page" key={idx}>
         {page.map(job => (
        <div id={`job-${job.id}`} key={job.id} className="job-card">
   <div>
      <h3>{job.title}</h3>
      <p className="job-location">{job.company}</p>

      {/* NEW: Date Posted */}
      <small className="job-posted-date">
        Posted on: {new Date(job.created_at).toLocaleDateString()}
      </small>

      <span className="match-score">
        {(job.similarity * 100).toFixed(0)}% Match
      </span>
    </div>
    
  </div>
))}

           {page.length < pageSize && <div className="app-card-empty" />}
        </div>
      ))}
    </HorizontalSlider>
    
  );
  
};

// --- 5. Announcements (Unchanged) ---
const Announcements = () => {
  const supabase = createClientComponentClient();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        setAnnouncements(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [supabase]);

  if (loading) {
    return (
      <section className="card dashboard-announcements skeleton-widget">
        <SkeletonBox width="180px" height="26px" className="mb-3" />

        <div className="announcement-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="announcement-card">
              <SkeletonBox width="60px" height="60px" className="rounded-sm" />

              <div className="announcement-content">
                <SkeletonBox width="80%" height="18px" className="mb-1" />
                <SkeletonBox width="95%" height="14px" className="mb-1" />
                <SkeletonBox width="70%" height="14px" />
              </div>
            </div>
          ))}
        </div>

        <SkeletonBox
          width="100px"
          height="16px"
          className="view-all-link-skeleton mt-3 ml-auto"
        />
      </section>
    );
  }

  return (
    <section className="card dashboard-announcements">
      <h2>
        <MessageSquare size={20} className="card-title-icon" /> Announcements
      </h2>

      <div className="announcement-list">
        {announcements.length === 0 ? (
          <p>No announcements.</p>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="announcement-card">
              {ann.image_url && (
                <img
                  src={ann.image_url}
                  alt={ann.title}
                  className="announcement-image"
                />
              )}

              <div className="announcement-content">
                <div className="announcement-title-row">
                  <h3>{ann.title}</h3>
                  {isNewAnnouncement(ann.created_at) && (
                    <span className="new-badge">NEW</span>
                  )}
                </div>

                <p>{ann.content}</p>
                <small>
                  {new Date(ann.created_at).toLocaleDateString()}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};


// --- 6. Profile Widget (Unchanged) ---
const ProfileWidget = ({ loading }) => (
  <section className="card profile-card">
    <h3><User size={20} className="card-title-icon"/> Your Profile</h3>
    {loading ? (
      <>
        <SkeletonBox width="80%" height="16px" className="mx-auto mb-5" />
        <SkeletonBox width="120px" height="38px" className="mx-auto" />
      </>
    ) : (
      <>
        <p>Keep your profile up-to-date to attract recruiters.</p>
        <Link href="/intern/profile" className="btn-secondary">
          Manage Profile <ExternalLink size={16}/>
        </Link>
      </>
    )}
  </section>
);

// --- 7. Main Component (UPDATED with Theme Logic) ---
export default function InternDashboard() {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [animateClose, setAnimateClose] = useState(false);
  
  // --- NEW: Theme State Logic ---
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Load saved theme on mount
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
  }, []);

  useEffect(() => {
    // Apply class to HTML tag (required for CSS to switch modes)
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  // -------------------------------

  const dateInfo = getCurrentDate();

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase.from('profiles').select('fullname').eq('id', userId).single();
    setUserName(data?.fullname || '');
  }, [supabase]);

  const fetchApplications = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id, 
          created_at, 
          status, 
          job_posts:job_posts!fk_job_applications_job ( title ), 
          companies:companies!fk_job_applications_company ( name )
        `)
        .eq('intern_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
      
    } catch (err) {
      console.error('Supabase Error fetching applications:', err.message);
    }
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        await Promise.all([fetchProfile(currentUser.id), fetchApplications(currentUser.id)]);
      }
      setLoading(false);
    };
    init();
  }, [supabase, fetchProfile, fetchApplications]);

  const closeModal = () => {
    setAnimateClose(true);
    setTimeout(() => {
      setSelectedJob(null);
      setAnimateClose(false);
      document.body.classList.remove('modal-open');
    }, 300);
  };

  const openJobDetailModal = async (job) => {
    try {
      const { data, error } = await supabase
        .from('job_posts')
        .select('*, companies (name)')
        .eq('id', job.id)
        .single();
        
      if (error) throw error;

      setSelectedJob({
        ...data,
        company: data.companies?.name || 'Unknown',
        similarity: job.similarity
      });
      document.body.classList.add('modal-open');
    } catch (err) {
      console.error("Error opening job:", err);
      toast.error("Could not load details");
    }
  };

  const applyToJob = async (jobId) => {
    if (!user) return;
    
    const { data: profile } = await supabase.from('profiles').select('resume_url').eq('id', user.id).single();
    if (!profile?.resume_url) {
      toast.error("Please upload a resume first.");
      return;
    }

    const { error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        intern_id: user.id,
        company_id: selectedJob.company_id,
        resume_url: profile.resume_url,
        status: 'Pending'
      });

    if (error) {
      if(error.code === "23505") toast.info("You already applied here.");
      else toast.error("Failed to apply.");
    } else {
      toast.success("Applied successfully!");
      fetchApplications(user.id);
      closeModal();
    }
  };

  // --- Loading Return ---
  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <section className="welcome-banner skeleton-banner">
            <div className="welcome-text">
              <SkeletonBox width="250px" height="30px" className="mb-2" />
              <SkeletonBox width="400px" height="20px" />
            </div>
            <div className="welcome-date">
              <SkeletonBox width="80px" height="20px" className="mb-1 ml-auto" />
              <SkeletonBox width="100px" height="24px" />
            </div>
          </section>
          <StatsSkeleton />
          <div className="dashboard-grid">
            <main className="dashboard-main">
              <SliderSkeleton />
              <SliderSkeleton />
            </main>
            <WidgetSkeleton />
          </div>
        </div>
        <InternNav />
      </>
    );
  }

  // --- Main Render ---
  return (
    <>
      <div className="dashboard-container">
        <section className="welcome-banner">
          <div className="welcome-text">
            <h1>Welcome Back, {userName.split(' ')[0] || 'Ace'}!</h1>
            <p>Ready to manage your journey and find your next role?</p>
          </div>
          
          {/* UPDATED: Wrapper for Date + Toggle Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Theme Toggle Button */}
          

            <div className="welcome-date">
              <span className="date-day">{dateInfo.day}</span>
              <span className="date-full">{dateInfo.dateStr}</span>
            </div>

          </div>
        </section>

        <StatsSummary applications={applications} />

        <div className="dashboard-grid">
          <main className="dashboard-main">
            <ApplicationSlider applications={applications} />
            <RecommendedMatches user={user} openModal={openJobDetailModal} />
          </main>

          <aside className="dashboard-sidebar">
            <ProfileWidget loading={false} />
            <Announcements />
          </aside>
        </div>
      </div>
      {user?.id && <FloatingAIChatWithCharts studentId={user.id} />}
      <InternNav className={selectedJob ? 'hidden' : ''} />

      {selectedJob && (
        <div className={`modal-overlay active ${animateClose ? 'modal-closing-overlay' : ''}`} onClick={closeModal}>
          <div className={`modal-content ${animateClose ? 'modal-closing' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedJob.title}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="job-detail-group">
                <h3 className="job-detail-title">{selectedJob.title}</h3>
                <p className="job-detail-company">{selectedJob.company}</p>
              </div>
              <div className="job-detail-group">
                 <span className="job-detail-label">Description</span>
                 <p className="job-detail-description">{selectedJob.description}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={closeModal}>Close</button>
              <button className="primary-btn" onClick={() => applyToJob(selectedJob.id)}>Apply Now</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}