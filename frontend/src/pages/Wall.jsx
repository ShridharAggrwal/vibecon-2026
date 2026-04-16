import { useEffect, useRef, useState } from 'react';
import PostCard from '../components/PostCard.jsx';
import { useWallPosts } from '../hooks/useWallPosts.js';
import { THEMES, DEFAULT_THEME_KEY } from '../themes/themes.js';
import vibeconLogo from '../assets/vibecon-logo.svg';

const SPONSORS = [
  'Emergent', 'Polaris School of Technology', 'OpenAI', 'MongoDB', 'AWS', 'Razorpay',
  'Stripe', 'Anthropic', 'Wispr Flow', 'Linear', 'Vercel', 'Supabase',
];

const CARD_WIDTH = 380;
const CARD_GAP = 20;
const SCROLL_PX_PER_SEC = 35;

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{now.toTimeString().slice(0, 8)}</span>;
}

function ScrollBanner({ posts, theme }) {
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const prevTimeRef = useRef(null);

  useEffect(() => {
    if (posts.length < 4) return;

    let raf;
    const tick = (timestamp) => {
      if (!trackRef.current) { raf = requestAnimationFrame(tick); return; }
      if (prevTimeRef.current === null) prevTimeRef.current = timestamp;

      const delta = (timestamp - prevTimeRef.current) / 1000;
      prevTimeRef.current = timestamp;

      offsetRef.current += SCROLL_PX_PER_SEC * delta;

      const setWidth = posts.length * (CARD_WIDTH + CARD_GAP);
      if (offsetRef.current >= setWidth) {
        offsetRef.current -= setWidth;
      }

      trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [posts.length]);

  if (posts.length === 0) {
    return (
      <div className="w-full text-center">
        <p className="text-lg font-black uppercase tracking-widest opacity-30" style={{ color: theme.headerText }}>
          Waiting for posts...
        </p>
      </div>
    );
  }

  if (posts.length < 4) {
    return (
      <div
        className="flex items-stretch justify-center w-full"
        style={{ gap: `${CARD_GAP}px`, padding: `0 ${CARD_GAP}px` }}
      >
        {posts.map((post) => (
          <div
            key={post.id}
            className="shrink-0"
            style={{ width: `${CARD_WIDTH}px`, height: 'calc(100vh - 56px - 48px - 40px)' }}
          >
            <PostCard post={post} theme={theme} onDelete={null} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className="flex items-stretch"
      style={{
        gap: `${CARD_GAP}px`,
        paddingLeft: `${CARD_GAP}px`,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {[...posts, ...posts].map((post, i) => (
        <div
          key={`${post.id}-${i}`}
          className="shrink-0"
          style={{ width: `${CARD_WIDTH}px`, height: 'calc(100vh - 56px - 48px - 40px)' }}
        >
          <PostCard post={post} theme={theme} onDelete={null} />
        </div>
      ))}
    </div>
  );
}

export default function Wall() {
  const [themeKey] = useState(() =>
    localStorage.getItem('vibecon_theme') || DEFAULT_THEME_KEY
  );
  const theme = THEMES[themeKey] || THEMES[DEFAULT_THEME_KEY];
  const { posts } = useWallPosts();

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col relative"
      style={{ backgroundColor: theme.bg, backgroundImage: theme.bgGradient }}
    >
      {/* Header bar */}
      <header
        className="relative z-30 h-14 px-6 flex items-center justify-between border-b shrink-0"
        style={{ backgroundColor: theme.header, color: theme.headerText, borderColor: theme.cardBorder }}
      >
        <div className="flex items-center gap-3">
          <img src={vibeconLogo} alt="VibeCon" className="h-7" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: theme.live }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.live }}>
              LIVE
            </span>
          </div>
          <span className="text-xs font-bold opacity-70">300 BUILDERS</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold">
          <Clock />
          <span className="opacity-60">Emergent x Polaris</span>
          <span className="px-2 py-0.5 rounded-full bg-vibe-orange text-white">16 APR 2026</span>
        </div>
      </header>

      {/* Scrolling post banner */}
      <main className="relative z-10 flex-1 flex items-center overflow-hidden">
        <ScrollBanner posts={posts} theme={theme} />
      </main>

      {/* Sponsor ticker — GPU-composited layer */}
      <div
        className="relative z-20 h-12 flex items-center overflow-hidden border-t shrink-0"
        style={{
          backgroundColor: theme.ticker,
          color: theme.tickerText,
          borderColor: theme.cardBorder,
          transform: 'translateZ(0)',
        }}
      >
        <div className="px-4 py-1 mr-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 flex items-center gap-1 shrink-0">
          ★ Sponsors
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="flex animate-marquee whitespace-nowrap"
            style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
          >
            {[...SPONSORS, ...SPONSORS].map((s, i) => (
              <span key={i} className="px-6 text-xs font-black uppercase tracking-widest">
                {s} ·
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
