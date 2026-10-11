import { useEffect, useRef, useState } from 'react';
import { CircleHelp, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { Button, PageHeader } from '../../components/ui';
import { importJson } from '../../services/storage';
import { isCloudConfigured, loadRemoteWorkspaceFromCloud, supabase, syncLocalWorkspace } from '../../services/supabase';
import type { SharedProps } from '../../types';

function DatabaseIcon() { return <Database size={15} />; }

export function SettingsPage(props: SharedProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(isCloudConfigured ? 'Checking account…' : 'Not connected');
  const [accountEmail, setAccountEmail] = useState('');
  const [syncing, setSyncing] = useState(false);
  const localeOptions = [
    { value: 'en', label: '🇬🇧 EN', description: 'English' },
    { value: 'ru', label: '🇷🇺 RU', description: 'Русский' },
  ] as const;

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setCloudStatus('Not connected');
      setAccountEmail('');
      return;
    }

    let active = true;
    const syncStatus = async () => {
      const { data } = await client.auth.getSession();
      if (!active) return;
      const session = data.session;
      setAccountEmail(session?.user.email ?? '');
      setCloudStatus(session ? 'Connected' : 'Not connected');
    };

    void syncStatus();
    const { data: authState } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAccountEmail(session?.user.email ?? '');
      setCloudStatus(session ? 'Connected' : 'Not connected');
    });

    return () => {
      active = false;
      authState.subscription.unsubscribe();
    };
  }, []);

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    setImportBusy(true);
    if (file.size > 5 * 1024 * 1024) {
      props.onToast('File is too large. The limit is 5 MB.');
      setImportBusy(false);
      return;
    }

    const result = importJson(await file.text(), props.data);
    if (result.error) props.onToast(result.error);
    else {
      props.onDataChange(result.data);
      props.onToast(`${result.imported} prompt${result.imported === 1 ? '' : 's'} imported.`);
    }
    setImportBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) props.onToast(error.message);
    else {
      setCloudStatus('Not connected');
      setAccountEmail('');
      props.onToast('Signed out. Local prompts remain on this device.');
    }
  };

  const syncToCloud = async () => {
    if (!supabase) {
      props.onToast('Cloud sync is not configured. Add the Supabase values in .env.local to enable it.');
      return;
    }

    const allowed = window.confirm('Upload the current local library to your cloud account? This skips newer remote records and keeps local-first data available on this device.');
    if (!allowed) return;

    setSyncing(true);
    const result = await syncLocalWorkspace(props.data);
    setSyncing(false);

    if (result.error) {
      props.onToast(result.error);
      return;
    }

    props.onToast(`Cloud sync complete: ${result.uploaded} prompts uploaded, ${result.conflicts} conflicts skipped.`);
  };

  const downloadFromCloud = async () => {
    if (!supabase) {
      props.onToast('Cloud sync is not configured. Add the Supabase values in .env.local to enable it.');
      return;
    }

    const allowed = window.confirm('Replace the current local workspace with the cloud copy? Cancel to keep your local data and review first.');
    if (!allowed) return;

    setSyncing(true);
    const result = await loadRemoteWorkspaceFromCloud();
    setSyncing(false);

    if (result.error) {
      props.onToast(result.error);
      return;
    }

    props.onDataChange(result.data);
    props.onToast(`Loaded ${result.imported} cloud items.`);
  };

  return <div className="page-content"><PageHeader eyebrow="MAKE IT YOURS" title="Settings" description="Manage your workspace, data, and preferences." /><div className="settings-layout"><aside className="settings-nav"><a href="#appearance" className="settings-nav-active"><Sparkles size={15} /> Appearance</a><a href="#data"><DatabaseIcon /> Data & backups</a><a href="#account"><ShieldCheck size={15} /> Account & cloud</a><a href="#privacy"><CircleHelp size={15} /> Privacy</a></aside><div className="settings-main"><section id="appearance" className="panel settings-panel"><div className="panel-heading"><div><h2>Appearance</h2><p>Set the mood for the workspace.</p></div></div>  <div className="settings-toggle-row"><span>Theme</span><div className="segmented-control"><button type="button" className={props.theme === 'dark' ? 'selected' : ''} onClick={() => props.onThemeChange('dark')}>Dark</button><button type="button" className={props.theme === 'light' ? 'selected' : ''} onClick={() => props.onThemeChange('light')}>Light</button></div></div>
  <div className="settings-toggle-row"><span>Language</span><div className="segmented-control" aria-label="Choose interface language" role="group">
    {localeOptions.map((option) => (
      <button
        key={option.value}
        type="button"
        className={props.locale === option.value ? 'selected' : ''}
        aria-label={option.description}
        aria-pressed={props.locale === option.value}
        onClick={() => props.onLocaleChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div></div>
      </section><section id="data" className="panel settings-panel"><div className="panel-heading"><div><h2>Data & backups</h2><p>Keep a copy of your library and restore it later.</p></div></div><div className="settings-actions"><Button onClick={() => { const json = JSON.stringify({ ...props.data, exportedAt: new Date().toISOString() }, null, 2); download(json, 'promptlab-backup.json', 'application/json'); props.onToast('Backup downloaded.'); }}>Export workspace JSON</Button><label className="button button-secondary upload-button" htmlFor="promptlab-import"><input id="promptlab-import" type="file" accept="application/json" ref={fileRef} onChange={(e) => void handleImport(e.target.files?.[0])} />{importBusy ? 'Importing…' : 'Import workspace JSON'}</label></div><div className="settings-note"><ShieldCheck size={14} /> JSON backups include prompts, collections, and stored feedback in this browser.</div></section><section id="account" className="panel settings-panel"><div className="panel-heading"><div><h2>Account & cloud</h2><p>Optional Supabase access for cloud features.</p></div></div><div className="settings-cloud-box"><div><strong>{cloudStatus}</strong><small>{accountEmail || 'No synced account'}</small></div>{supabase && <Button variant="ghost" onClick={() => void signOut()}>Sign out</Button>}</div><div className="settings-actions" style={{ marginTop: '1rem' }}><Button variant="primary" onClick={() => void syncToCloud()} disabled={syncing || !isCloudConfigured}>{syncing ? 'Syncing…' : 'Sync local data to account'}</Button><Button variant="secondary" onClick={() => void downloadFromCloud()} disabled={syncing || !isCloudConfigured}>Load cloud data</Button></div><div className="settings-note"><ShieldCheck size={14} /> Local-first mode continues to work without an account, and cloud sync is explicit rather than automatic.</div></section><section id="privacy" className="panel settings-panel"><div className="panel-heading"><div><h2>Privacy</h2><p>Keep your workspace under your control.</p></div></div><ul className="privacy-list"><li>Prompt content stays in the browser unless you explicitly choose to sync it.</li><li>Feedback is saved locally and is not sent to a cloud endpoint in this version.</li><li>Do not paste secrets, API keys, or private data into prompts or feedback.</li></ul></section></div></div></div>;}
