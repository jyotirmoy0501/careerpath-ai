import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, BriefcaseBusiness, Check, ChevronDown, CircleHelp, Clock3, FileText, GraduationCap, History, LayoutDashboard, LoaderCircle, LockKeyhole, LogIn, LogOut, Menu, MessageSquareText, Plus, Radar, Sparkles, Target, Trash2, Upload, User, X } from 'lucide-react'

type Result = { id?: string; resume_skills: string[]; job_skills: string[]; matched_skills: string[]; missing_skills: string[]; coverage_percent: number; roadmap: { week: string; focus: string }[]; summary: string; created_at?: string; job_description?: string; resume_text?: string }
type UserProfile = { name: string; email: string }

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const sampleResume = 'Computer science student with experience building web applications and data projects. Skills: Python, React, SQL, Git, Pandas, JavaScript, REST APIs. Built a student dashboard and a data analysis notebook. Interested in scalable software and cloud deployment.'
const sampleJob = 'Junior Software Engineer. Requirements: Python, React, SQL, REST APIs, FastAPI, Docker, AWS, TypeScript, and MongoDB. Build reliable product features, collaborate with engineers, and deploy services to cloud infrastructure.'

function App() {
  const [resume, setResume] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Auth & Saved Queries State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyList, setHistoryList] = useState<Result[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load user session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('careerpath_user')
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)) } catch {}
    }
  }, [])

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault()
    if (!authEmail.trim() || !authName.trim()) return
    const user = { name: authName.trim(), email: authEmail.trim().toLowerCase() }
    setCurrentUser(user)
    localStorage.setItem('careerpath_user', JSON.stringify(user))
    setShowAuthModal(false)
  }

  const handleSignOut = () => {
    setCurrentUser(null)
    localStorage.removeItem('careerpath_user')
    setShowHistoryModal(false)
  }

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const url = currentUser ? `${API}/api/analyses?user_email=${encodeURIComponent(currentUser.email)}` : `${API}/api/analyses`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setHistoryList(data)
      }
    } catch {}
    finally { setLoadingHistory(false) }
  }

  const openHistory = () => {
    fetchHistory()
    setShowHistoryModal(true)
  }

  const loadSavedAnalysis = (saved: Result) => {
    setResult(saved)
    if (saved.job_description) setJobDescription(saved.job_description)
    if (saved.resume_text) setResumeText(saved.resume_text)
    setShowHistoryModal(false)
    setTimeout(() => {
      document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const deleteSavedAnalysis = async (id?: string) => {
    if (!id) return
    try {
      await fetch(`${API}/api/analyses/${id}`, { method: 'DELETE' })
      setHistoryList(prev => prev.filter(item => item.id !== id))
    } catch {}
  }

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { setResume(file); setResumeText('') } }

  const analyze = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const body = new FormData()
      body.append('job_description', jobDescription)
      body.append('resume_text', resumeText)
      if (currentUser) body.append('user_email', currentUser.email)
      if (resume) body.append('resume_file', resume)

      const response = await fetch(`${API}/api/analyze`, { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Analysis could not be completed.')
      setResult(data)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not connect to the API. Start the FastAPI server and try again.') }
    finally { setLoading(false) }
  }

  const hasAnalysis = Boolean(result)
  const fillDemo = () => { setResume(null); setResumeText(sampleResume); setJobDescription(sampleJob); setError('') }

  return <div className="min-h-screen bg-paper text-ink">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <a href="#home" className="brand"><span className="brand-icon"><Sparkles size={19}/></span><span>careerpath<span className="brand-ai">.ai</span></span></a>
      <div className="workspace">
        <div className="workspace-avatar"><User size={15}/></div>
        <div className="workspace-text">
          <strong>{currentUser ? `${currentUser.name}'s space` : 'My Workspace'}</strong>
          <span>{currentUser ? currentUser.email : 'Free workspace'}</span>
        </div>
        <ChevronDown size={15}/>
      </div>
      <p className="nav-label">WORKSPACE</p>
      <nav className="nav-list">
        <a className="nav-link active" href="#dashboard"><LayoutDashboard size={17}/>Dashboard<span className="nav-indicator"/></a>
        <button className="nav-link" onClick={openHistory} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
          <History size={17}/>Saved Queries
        </button>
        <a className="nav-link" href="#roadmap"><Target size={17}/>My roadmap</a>
        <a className="nav-link" href="#resources"><BookOpen size={17}/>Learning library</a>
      </nav>
      <div className="sidebar-bottom">
        <div className="upgrade-card">
          <div className="upgrade-icon"><Sparkles size={16}/></div>
          <strong>Your next role is closer.</strong>
          <p>Turn skill gaps into a plan you can actually follow.</p>
          <a href="#analyze">Build my roadmap <ArrowRight size={14}/></a>
        </div>
        <a className="nav-link help-link" href="#how-it-works"><CircleHelp size={17}/>How it works</a>
        <div className="profile">
          <div className="profile-avatar"><User size={15}/></div>
          <div className="profile-text">
            <strong>{currentUser ? currentUser.name : 'Guest User'}</strong>
            <span>{currentUser ? currentUser.email : 'Signed out'}</span>
          </div>
          {currentUser ? (
            <button onClick={handleSignOut} title="Sign Out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <LogOut size={16}/>
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} title="Sign In" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a' }}>
              <LogIn size={16}/>
            </button>
          )}
        </div>
      </div>
    </aside>

    <main id="home" className="main-area">
      <header className="topbar">
        <button className="mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen?<X size={19}/>:<Menu size={19}/>}</button>
        <div className="breadcrumbs">Workspace <span>/</span> <strong>Dashboard</strong></div>
        <div className="top-actions">
          <span className="private-badge"><LockKeyhole size={12}/> Your data stays private</span>
          <button className="user-badge-btn" onClick={openHistory}>
            <History size={14}/> Saved Queries
          </button>
          {currentUser ? (
            <button className="user-badge-btn" onClick={() => setShowAuthModal(true)}>
              <User size={14}/> {currentUser.name}
            </button>
          ) : (
            <button className="auth-nav-btn" onClick={() => setShowAuthModal(true)}>
              <LogIn size={14}/> Sign In to Save
            </button>
          )}
        </div>
      </header>

      <div className="page-content">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot"/> YOUR CAREER, WITH DIRECTION</div>
            <h1>A clearer path to<br/> <span>your next role.</span></h1>
            <p>See how your skills line up with the job you want — then get a plan to close the distance.</p>
            <a href="#analyze" className="hero-button">Build my roadmap <ArrowRight size={16}/></a>
            <div className="hero-proof">
              <div className="proof-avatars"><i><User size={12}/></i><i><User size={12}/></i><i><User size={12}/></i></div>
              <span>Made for students figuring out what's next.</span>
            </div>
          </div>
          <div className="hero-art" aria-label="A roadmap showing steps towards a career goal">
            <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/>
            <div className="art-sun"><ArrowUpRight size={29}/></div>
            <div className="art-pin pin-one"><span/><b>01</b></div>
            <div className="art-pin pin-two"><span/><b>02</b></div>
            <div className="art-pin pin-three"><span/><b>03</b></div>
            <div className="art-road road-a"/><div className="art-road road-b"/>
            <div className="art-card"><span>YOUR NEXT STOP</span><strong>Target Role</strong><small><span/> You're making progress</small></div>
            <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✳</div>
          </div>
          <div className="hero-blob"/>
        </section>

        <section className="metrics" aria-label="Overview">
          <Metric label="TARGET ROLE" value={hasAnalysis?'Target Role':'Not specified'} icon={<BriefcaseBusiness size={16}/>} note="Your goal, your pace"/>
          <Metric label="SKILLS IN COMMON" value={result ? `${result.matched_skills.length} of ${result.job_skills.length}` : '—'} icon={<BadgeCheck size={16}/>} note="From your latest analysis"/>
          <Metric label="ROADMAP PROGRESS" value={hasAnalysis?'Week 1 of 4':'Not started'} icon={<Radar size={16}/>} note="Small steps add up"/>
          <Metric label="TIME TO INVEST" value="4 weeks" icon={<Clock3 size={16}/>} note="A plan built around you"/>
        </section>

        <section id="analyze" className="analysis-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot"/> START WITH THE ROLE</div>
              <h2>Let's find your starting point.</h2>
              <p>Share your resume and a job description. We'll map the skills between them.</p>
            </div>
            <button className="demo-button" onClick={fillDemo}><Sparkles size={14}/> Try a sample</button>
          </div>
          <form className="input-grid" onSubmit={analyze}>
            <div className="input-card">
              <div className="input-card-head">
                <div className="input-icon resume-icon"><FileText size={17}/></div>
                <div><strong>Your resume</strong><span>PDF or paste your experience</span></div>
                <span className="step-number">01</span>
              </div>
              <button className={`dropzone ${resume?'file-selected':''}`} type="button" onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const file=e.dataTransfer.files[0];if(file){setResume(file);setResumeText('')}}}>
                <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={chooseFile} hidden/>
                <div className="upload-circle">{resume?<Check size={19}/>:<Upload size={19}/>}</div>
                <strong>{resume?resume.name:'Drop your resume here'}</strong>
                <span>{resume?'Ready to analyze':'or click to browse · PDF up to 10 MB'}</span>
              </button>
              <div className="or-divider"><span/> OR PASTE YOUR RESUME <span/></div>
              <textarea className="input-textarea" value={resumeText} onChange={e=>{setResumeText(e.target.value);setResume(null)}} placeholder="Paste your experience, skills, or LinkedIn summary..." rows={3}/>
            </div>
            <div className="input-card">
              <div className="input-card-head">
                <div className="input-icon job-icon"><BriefcaseBusiness size={17}/></div>
                <div><strong>Target job description</strong><span>The role you're working towards</span></div>
                <span className="step-number">02</span>
              </div>
              <div className="job-field">
                <label htmlFor="job">JOB DESCRIPTION</label>
                <textarea id="job" className="input-textarea job-textarea" value={jobDescription} onChange={e=>setJobDescription(e.target.value)} placeholder="Paste the job description here. Include responsibilities, requirements, and skills..." rows={8}/>
                <span className="char-count">{jobDescription.length} characters</span>
              </div>
              <div className="input-tip"><Sparkles size={14}/><span>Tip: A detailed job post gives you a more useful skill map.</span></div>
            </div>
            <div className="form-footer">
              <div className="privacy-note"><LockKeyhole size={14}/> {currentUser ? `Signed in as ${currentUser.email} — results auto-saved to MongoDB` : 'Your resume is processed securely. Sign in to save your history.'}</div>
              <button className="analyze-button" type="submit" disabled={loading}>
                {loading?<><LoaderCircle size={16} className="spin"/> Finding your gaps...</>:<>Show me my skill gaps <ArrowRight size={16}/></>}
              </button>
            </div>
            {error&&<div className="error-message" role="alert">{error}</div>}
          </form>
        </section>

        {result&&<section id="roadmap" className="results-section">
          <div className="section-heading results-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot"/> YOUR SKILL MAP</div>
              <h2>A strong start. Here's the opportunity.</h2>
              <p>{result.summary}</p>
            </div>
            <button className="outline-button" onClick={()=>document.getElementById('analyze')?.scrollIntoView({behavior:'smooth'})}>Update my details <ArrowDown size={14}/></button>
          </div>
          <div className="results-grid">
            <div className="match-card">
              <div className="match-top">
                <div><span className="small-label">ROLE SKILL COVERAGE</span><h3>You're building on a foundation.</h3></div>
                <div className="score-ring" style={{'--score':`${result.coverage_percent*3.6}deg`} as React.CSSProperties}>
                  <div><strong>{result.coverage_percent}%</strong><span>matched</span></div>
                </div>
              </div>
              <div className="progress-track"><span style={{width:`${result.coverage_percent}%`}}/></div>
              <div className="skill-legend"><span><i className="legend-matched"/>In your toolkit <b>{result.matched_skills.length}</b></span><span><i className="legend-gap"/>Room to grow <b>{result.missing_skills.length}</b></span></div>
              <div className="skill-list">
                <div className="skill-row">
                  <div className="skill-row-label"><Check size={14}/><strong>Already in your toolkit</strong></div>
                  <div className="skill-tags">{result.matched_skills.length?result.matched_skills.map(s=><span className="skill-tag matched-tag" key={s}>{s}</span>):<span className="empty-skill">No matching skills detected yet.</span>}</div>
                </div>
                <div className="skill-row">
                  <div className="skill-row-label gap-label"><Plus size={14}/><strong>Room to grow</strong></div>
                  <div className="skill-tags">{result.missing_skills.length?result.missing_skills.map(s=><span className="skill-tag gap-tag" key={s}>{s}</span>):<span className="empty-skill">You're covering all detected role skills.</span>}</div>
                </div>
              </div>
              <div className="match-foot"><span><Sparkles size={13}/> Based on skills explicitly mentioned in both documents</span><button aria-label="About skill matching"><CircleHelp size={14}/></button></div>
            </div>

            <div className="roadmap-card">
              <div className="roadmap-card-head">
                <div><span className="small-label">A PLAN THAT MOVES YOU FORWARD</span><h3>Your four-week roadmap</h3></div>
                <span className="roadmap-icon"><GraduationCap size={18}/></span>
              </div>
              <div className="roadmap-list">
                {result.roadmap.length?result.roadmap.map((item,index)=><div className="roadmap-item" key={item.week}>
                  <div className={`roadmap-marker ${index===0?'current':''}`}>{index===0?<span/>:<span>{String(index+1).padStart(2,'0')}</span>}</div>
                  <div className="roadmap-item-content"><div><span className="roadmap-week">{item.week}</span>{index===0&&<span className="start-here">START HERE</span>}</div><p>{item.focus}</p></div>
                </div>):<div className="empty-roadmap"><BadgeCheck size={20}/> Your resume covers all the skills detected in this role. Choose a more advanced job description to find your next stretch goal.</div>}
              </div>
              <button className="roadmap-cta" onClick={()=>document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'})}>See how your roadmap works <ArrowRight size={15}/></button>
            </div>
          </div>
        </section>}

        <section id="how-it-works" className="how-section">
          <div className="how-heading"><div className="eyebrow"><span className="eyebrow-dot"/> A LITTLE STRUCTURE GOES A LONG WAY</div><h2>From "what now?" to a plan.</h2></div>
          <div className="steps">
            <Step number="01" icon={<FileText size={18}/>} title="Bring your starting point" text="We read your resume and the job you have in mind."/>
            <Step number="02" icon={<Radar size={18}/>} title="See the whole picture" text="Your experience meets the role's skills in one clear view."/>
            <Step number="03" icon={<GraduationCap size={18}/>} title="Make your next move" text="Turn the gaps into focused practice and portfolio work."/>
          </div>
        </section>

        <footer className="footer">
          <a className="brand footer-brand" href="#home"><span className="brand-icon"><Sparkles size={16}/></span><span>careerpath<span className="brand-ai">.ai</span></span></a>
          <span>Thoughtful steps. A future that fits.</span>
          <a href="#analyze">Back to your roadmap ↑</a>
        </footer>
      </div>
    </main>

    {/* SIGN IN MODAL */}
    {showAuthModal && (
      <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <div className="modal-head">
            <h3 className="modal-title">{currentUser ? 'Your Profile' : 'Sign In to CareerPath AI'}</h3>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}><X size={18}/></button>
          </div>

          {currentUser ? (
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>
                You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.email}).
              </p>
              <button className="auth-submit-btn" style={{ background: '#ef4444' }} onClick={handleSignOut}>
                <LogOut size={16}/> Sign Out
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSignIn}>
              <div className="auth-field">
                <label>Your Name</label>
                <input className="auth-input" type="text" placeholder="e.g. Alex Johnson" value={authName} onChange={e => setAuthName(e.target.value)} required />
              </div>
              <div className="auth-field">
                <label>Email Address</label>
                <input className="auth-input" type="email" placeholder="alex@example.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
              </div>
              <button className="auth-submit-btn" type="submit">
                <LogIn size={16}/> Sign In & Save My Searches
              </button>
            </form>
          )}
        </div>
      </div>
    )}

    {/* SAVED HISTORY MODAL */}
    {showHistoryModal && (
      <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
        <div className="modal-card modal-card-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-head">
            <div>
              <h3 className="modal-title">Saved Searches & Queries</h3>
              <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
                {currentUser ? `Saved for ${currentUser.email}` : 'All past saved searches'}
              </span>
            </div>
            <button className="modal-close" onClick={() => setShowHistoryModal(false)}><X size={18}/></button>
          </div>

          {loadingHistory ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <LoaderCircle size={24} className="spin" style={{ margin: '0 auto 0.5rem auto' }} />
              Fetching your saved roadmaps...
            </div>
          ) : historyList.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <History size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p>No saved searches found yet. Run an analysis to store your roadmaps in MongoDB!</p>
            </div>
          ) : (
            <div className="history-list">
              {historyList.map(item => (
                <div className="history-card" key={item.id}>
                  <div className="history-info">
                    <div className="history-title">
                      {item.job_description ? item.job_description.slice(0, 75) + '...' : 'Saved Job Analysis'}
                    </div>
                    <div className="history-meta">
                      <span>Coverage: <strong>{item.coverage_percent}%</strong></span>
                      <span>Matched: {item.matched_skills.length} skills</span>
                      <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                  <div className="history-actions">
                    <button className="load-btn" onClick={() => loadSavedAnalysis(item)}>Load</button>
                    <button className="delete-btn" onClick={() => deleteSavedAnalysis(item.id)} title="Delete search">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

  </div>
}

function Metric({label,value,icon,note}:{label:string;value:string;icon:React.ReactNode;note:string}){return <div className="metric-card"><div className="metric-top"><span>{label}</span><i>{icon}</i></div><strong className="metric-value">{value}</strong><span className="metric-note">{note}</span></div>}
function Step({number,icon,title,text}:{number:string;icon:React.ReactNode;title:string;text:string}){return <div className="step-card"><span className="step-number-label">{number}</span><span className="step-icon">{icon}</span><h3>{title}</h3><p>{text}</p></div>}
function MoreIcon(){return <span className="more-dots">···</span>}

export default App
