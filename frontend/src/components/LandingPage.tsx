import { ArrowRight, BarChart3, Check, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardCheck, LockKeyhole, Menu, ShieldCheck, Sparkles, TrendingUp, Wallet, X } from 'lucide-react';
import { useState } from 'react';

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
  onDemo: () => void;
}

const features = [
  { icon: ClipboardCheck, title: 'Build habits that stick', description: 'Create routines, check in each day, and follow your consistency without losing sight of the bigger picture.', tint: 'violet' },
  { icon: Wallet, title: 'Know where your money goes', description: 'Record expenses, organize spending by category, and keep your day-to-day finances in view.', tint: 'blue' },
  { icon: BarChart3, title: 'See your progress clearly', description: 'Turn habit activity and spending history into simple visual summaries that help you reflect and adjust.', tint: 'green' },
];

function ProductPreview() {
  return (
    <div className="landing-preview" aria-label="Illustrative TrackWise application preview">
      <div className="preview-window-bar"><div className="preview-dots"><i /><i /><i /></div><span>TrackWise / Overview</span><span className="preview-live"><span /> Preview</span></div>
      <div className="preview-app">
        <aside className="preview-sidebar"><div className="preview-brand"><span className="preview-brand-mark">T</span><b>TrackWise</b></div><div className="preview-nav active"><BarChart3 size={14}/> Overview</div><div className="preview-nav"><CheckCircle2 size={14}/> My habits</div><div className="preview-nav"><Wallet size={14}/> Expenses</div><div className="preview-nav"><TrendingUp size={14}/> Analytics</div><div className="preview-side-bottom"><span className="preview-avatar">S</span><span><b>Sample workspace</b><small>Demo preview</small></span></div></aside>
        <div className="preview-main"><div className="preview-heading"><div><small>YOUR SPACE</small><h3>A little progress, every day.</h3><p>A snapshot of habits and spending.</p></div><span className="preview-date">This month⌄</span></div>
          <div className="preview-metrics"><div className="preview-metric"><span>Habits tracked</span><b>06</b><small className="positive">Across your routines</small><div className="metric-spark spark-violet"><i/><i/><i/><i/><i/><i/><i/><i/></div></div><div className="preview-metric"><span>Completed today</span><b>4 <em>/ 6</em></b><small className="positive">Keep your rhythm</small><div className="mini-progress"><span /></div></div><div className="preview-metric"><span>Expenses logged</span><b>24</b><small>Across 5 categories</small><div className="metric-spark spark-blue"><i/><i/><i/><i/><i/><i/><i/><i/></div></div></div>
          <div className="preview-lower"><div className="preview-panel"><div className="preview-panel-head"><b>Today's habits</b><span>View all ↗</span></div>{[['Morning walk',true],['Read for 20 minutes',true],['Drink enough water',true],['Practice a skill',false]].map(([label,done])=><div className="preview-habit" key={String(label)}><span className={`preview-check ${done?'done':''}`}>{done?'✓':''}</span><span>{label}</span><small>{done?'Done':'Pending'}</small></div>)}</div><div className="preview-panel"><div className="preview-panel-head"><b>Spending overview</b><span>Sample</span></div><div className="preview-chart-total"><span>Sample monthly spend</span><b>₹12,480</b></div><div className="preview-bars">{[38,58,43,77,52,68,46,86,61,72,49,64].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div><div className="preview-chart-labels"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span></div></div></div>
        </div>
      </div>
      <div className="preview-floating-note"><span><ShieldCheck size={16}/></span><div><b>Your data stays yours</b><small>Personal tracking, in one place</small></div><Check size={16}/></div>
    </div>
  );
}

export default function LandingPage({ onSignIn, onSignUp, onDemo }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <div className="landing-page">
      <header className="landing-header"><a href="#top" className="landing-brand" aria-label="TrackWise home" onClick={closeMenu}><span className="landing-brand-mark">T</span><span>TrackWise</span></a>
        <button className="landing-mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen?'Close menu':'Open menu'}>{menuOpen?<X size={20}/>:<Menu size={20}/>}</button>
        <nav className={`landing-nav ${menuOpen?'open':''}`}><a href="#features" onClick={closeMenu}>Features</a><a href="#preview" onClick={closeMenu}>Product tour</a><button className="landing-nav-login" onClick={()=>{closeMenu();onSignIn();}}>Log in</button><button className="landing-nav-cta" onClick={()=>{closeMenu();onSignUp();}}>Get started <ArrowRight size={15}/></button></nav>
      </header>
      <main id="top">
        <section className="landing-hero"><div className="hero-glow hero-glow-one"/><div className="hero-glow hero-glow-two"/><div className="hero-copy"><div className="landing-eyebrow"><Sparkles size={14}/> A calmer way to stay on track</div><h1>Small steps.<br/><span>Meaningful progress.</span></h1><p className="hero-description">Bring your habits and everyday spending into one clear space. Build consistency, understand your patterns, and make progress that feels like yours.</p><div className="hero-actions"><button className="primary-cta" onClick={onSignUp}>Start tracking for free <ArrowRight size={17}/></button><button className="secondary-cta" onClick={onDemo}><span className="play-icon">▶</span> Explore the demo</button></div><div className="hero-trust"><span><Check size={13}/> Habit tracking</span><span><Check size={13}/> Expense insights</span><span><Check size={13}/> Interactive sample</span></div></div><div className="hero-visual"><ProductPreview/></div><div className="hero-bottom-note"><span className="hero-note-line"/><span>One space for the things you want to do more intentionally.</span><span className="hero-note-line"/></div></section>
        <section className="landing-features" id="features"><div className="section-kicker">MADE FOR YOUR EVERYDAY</div><div className="features-heading-row"><h2>Your routines and finances,<br/><span>working together.</span></h2><p>Less scattered tracking. More clarity on the small choices that shape your days.</p></div><div className="feature-grid">{features.map(({icon:Icon,title,description,tint},i)=><article className="feature-card" key={title}><div className={`feature-icon ${tint}`}><Icon size={21}/></div><div className="feature-number">0{i+1}</div><h3>{title}</h3><p>{description}</p><a href="#preview">Take a look <ChevronRight size={15}/></a></article>)}</div></section>
        <section className="landing-preview-section" id="preview"><div className="preview-section-copy"><div className="section-kicker">TAKE A LOOK AROUND</div><h2>Get a feel for it<br/>before you sign up.</h2><p>Explore an isolated sample workspace. Create and change habits and expenses, then reset your workspace whenever you like. Changes are temporary and stay separate from personal accounts.</p><ul><li><ShieldCheck size={17}/> No account needed to explore</li><li><LockKeyhole size={17}/> Separate, temporary workspace</li><li><BarChart3 size={17}/> Habits, expenses and analytics</li></ul><button className="primary-cta" onClick={onDemo}>Explore the demo <ArrowRight size={17}/></button></div><div className="preview-section-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-center"><span className="orbit-mark">T</span><b>TrackWise</b><small>Make progress visible</small></div><div className="orbit-chip chip-habit"><CheckCircle2 size={17}/><span><b>Daily habits</b><small>One check-in at a time</small></span></div><div className="orbit-chip chip-money"><CircleDollarSign size={18}/><span><b>Mindful spending</b><small>Know your patterns</small></span></div><div className="orbit-chip chip-chart"><TrendingUp size={18}/><span><b>Progress insights</b><small>Look back, move forward</small></span></div></div></section>
        <section className="landing-cta"><div className="cta-sparkle"><Sparkles size={19}/></div><h2>Make room for better habits<br/>and clearer money choices.</h2><p>Your next small step starts here.</p><div className="hero-actions centered"><button className="primary-cta light" onClick={onSignUp}>Create your account <ArrowRight size={17}/></button><button className="secondary-cta cta-secondary" onClick={onSignIn}>I already have an account</button></div></section>
      </main>
      <footer className="landing-footer"><a href="#top" className="landing-brand"><span className="landing-brand-mark">T</span><span>TrackWise</span></a><p>Make progress visible. One day at a time.</p><div className="footer-links"><a href="#features">Features</a><button onClick={onDemo}>Explore demo</button><button onClick={onSignIn}>Log in</button></div><small>© {new Date().getFullYear()} TrackWise. Built for everyday progress.</small></footer>
    </div>
  );
}
