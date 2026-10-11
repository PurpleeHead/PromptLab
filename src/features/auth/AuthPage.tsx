import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Command, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui';
import { isCloudConfigured, supabase } from '../../services/supabase';

export function AuthPage({ onToast }: { onToast: (message: string) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;
    const syncSession = async () => {
      const { data } = await client.auth.getSession();
      if (active) setSessionEmail(data.session?.user.email ?? '');
    };

    void syncSession();
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      if (active) setSessionEmail(session?.user.email ?? '');
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Cloud authentication is not configured. Local mode is available without an account.');
      return;
    }
    if (password.length < 8) {
      setMessage('Use a password with at least 8 characters.');
      return;
    }

    setLoading(true);
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === 'signup' && !result.data.session) {
      setMessage('Account created. Check your email to confirm your account before signing in.');
      return;
    }

    setSessionEmail(result.data.session?.user.email ?? '');
    setMessage('You are signed in. Cloud data sync is explicit and local data remains on this device unless you choose to upload it.');
    onToast('Authentication succeeded.');
  };

  return <div className="auth-page"><div className="auth-card"><Link to="/" className="brand-mark auth-brand"><span className="brand-icon"><Command size={20} /></span><span className="brand-word">prompt<span>lab</span><sup>✳</sup></span></Link><span className="auth-icon"><ShieldCheck size={22} /></span><h1>{mode === 'signin' ? 'Welcome back.' : 'Create your account.'}</h1><p>{mode === 'signin' ? 'Sign in to access your cloud workspace.' : 'Set up an optional account for cloud features.'}</p><div className="auth-mode-toggle"><button className={mode === 'signin' ? 'selected' : ''} type="button" onClick={() => { setMode('signin'); setMessage(''); }}>Sign in</button><button className={mode === 'signup' ? 'selected' : ''} type="button" onClick={() => { setMode('signup'); setMessage(''); }}>Create account</button></div><form onSubmit={submit} className="auth-form"><label className="field-label">Email address<input className="text-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label className="field-label">Password<input className="text-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} placeholder="At least 8 characters" required /></label>{message && <div className="auth-message" role="status">{message}</div>}{sessionEmail && <div className="auth-message auth-message-inline">Signed in as {sessionEmail}</div>}<Button type="submit" variant="primary" className="auth-submit" disabled={loading || !isCloudConfigured}>{loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={15} /></Button></form><div className="auth-footnote"><ShieldCheck size={14} /> Your local prompts remain available without signing in.</div><Link to="/" className="auth-back"><ArrowLeft size={13} /> Back to workspace</Link></div><div className="auth-side-note"><span className="auth-side-spark">✳</span><h2>Your thinking,<br />beautifully organized.</h2><p>A calm, focused space for the instructions you come back to.</p><div className="auth-side-pills"><span><Check size={12} /> Local-first</span><span><Check size={12} /> No paid API</span><span><Check size={12} /> Your workflow</span></div></div></div>;
}
