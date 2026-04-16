import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Link2, QrCode, Settings, Download, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase.js';
import { extractActivityId } from '../utils/parseLinkedin.js';

const QR_BASE = 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=';

export default function HostPanel({ onLogout }) {
  const [open, setOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);

  const [linkUrl, setLinkUrl] = useState('');
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);

  const guideUrl = `${window.location.origin}/guide`;
  const qrSrc = `${QR_BASE}${encodeURIComponent(guideUrl)}`;

  const downloadQr = async () => {
    try {
      const r = await fetch(qrSrc);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vibecon-guide-qr.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const onAddPost = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess(false);
    if (!linkUrl.trim()) {
      setLinkError('LinkedIn URL is required.');
      return;
    }

    const activityId = extractActivityId(linkUrl.trim());
    if (!activityId) {
      setLinkError('Could not extract post ID from URL.');
      return;
    }

    setLinkSubmitting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        name: 'Admin',
        linkedin_url: linkUrl.trim(),
        activity_id: activityId,
        composed_text: '',
        scraped_meta: null,
      });
      if (error) throw new Error(error.message);
      setLinkSuccess(true);
      setLinkUrl('');
      setTimeout(() => setLinkSuccess(false), 2000);
    } catch (err) {
      setLinkError(err.message || 'Failed to add post.');
    } finally {
      setLinkSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-16 right-4 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2 w-80 rounded-2xl backdrop-blur-xl bg-black/70 text-white border border-white/10 shadow-2xl p-4 space-y-2"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-widest opacity-80">Host Panel</span>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={14} />
              </button>
            </div>

            <button
              onClick={() => setShowAddPost((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold transition"
            >
              <Link2 size={14} /> Add Post
            </button>

            {showAddPost && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={onAddPost}
                className="bg-white/10 rounded-lg p-3 space-y-2"
              >
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Paste LinkedIn post URL"
                  className="w-full px-3 py-1.5 rounded-md bg-white/10 border border-white/20 text-sm font-semibold placeholder:text-white/40 focus:outline-none focus:border-white/50"
                />
                {linkError && (
                  <p className="text-[11px] font-bold text-red-400">{linkError}</p>
                )}
                <button
                  type="submit"
                  disabled={linkSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-vibe-orange text-white text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {linkSubmitting ? (
                    <><Loader2 size={12} className="animate-spin" /> Adding...</>
                  ) : linkSuccess ? (
                    <><Check size={12} /> Added!</>
                  ) : (
                    'Add to Wall'
                  )}
                </button>
              </motion.form>
            )}

            <button
              onClick={() => setShowQr((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold transition"
            >
              <QrCode size={14} /> QR Code for Printing
            </button>

            {showQr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-lg p-2 text-center"
              >
                <img src={qrSrc} alt="Guide QR" className="mx-auto rounded" />
                <p className="mt-1 text-[10px] font-bold text-gray-700 truncate">{guideUrl}</p>
                <button
                  onClick={downloadQr}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-black text-vibe-orange hover:underline"
                >
                  <Download size={12} /> Download PNG
                </button>
              </motion.div>
            )}

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-sm font-bold transition"
            >
              <LogOut size={14} /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-full bg-black/80 backdrop-blur text-white text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition flex items-center gap-1.5"
      >
        <Settings size={14} /> Host
      </button>
    </div>
  );
}
