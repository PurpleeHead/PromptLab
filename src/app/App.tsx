import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowDownUp, ArrowLeft, ArrowRight, BarChart3, Check, ChevronDown, CircleHelp, Command, Copy, Download, FileText, Filter, Folder, FolderPlus, Heart, LayoutDashboard, LifeBuoy, ListFilter, Menu, MoreHorizontal, Plus, Search, Settings, ShieldCheck, Sparkles, Star, Trash2, Upload, WandSparkles, X, Zap } from 'lucide-react';
import type { AppData, AppLocale, FeedbackEntry, Prompt, PromptCategory, PromptCollection, PromptSort } from '../types';
import { createId, exportCsv, exportJson, importJson, readData, readSettings, savePrompt, writeData, writeSettings } from '../services/storage';
import { extractVariables, renderTemplate } from '../features/prompts/variables';
import { isCloudConfigured, supabase } from '../services/supabase';
import { categoryLabel, formatRelativeDate, pluralizeCount, translateText, type Locale } from '../i18n';
import { LocaleSwitch } from '../components/LocaleSwitch';
const categories: PromptCategory[] = ['Writing', 'Development', 'Marketing', 'Research', 'Productivity', 'Design', 'General'];
const blankPrompt = { title: '', description: '', body: '', category: 'General' as PromptCategory, tags: [] as string[] };
const relativeDate = (date: string) => formatRelativeDate(date, currentLocale());
const countWords = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;
function currentLocale(): Locale { return typeof document !== 'undefined' && document.documentElement.lang.toLowerCase().startsWith('ru') ? 'ru' : 'en'; }
function localized(text: string): string { const leading = text.match(/^\s*/)?.[0] ?? ''; const trailing = text.match(/\s*$/)?.[0] ?? ''; return leading + translateText(text.trim(), currentLocale()) + trailing; }
export default function App() {
    const [data, setData] = useState<AppData>(() => readData());
    const [toast, setToast] = useState('');
    const [mobileNav, setMobileNav] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => readSettings().theme);
    const [locale, setLocale] = useState<AppLocale>(() => { const initialLocale = readSettings().locale; document.documentElement.lang = initialLocale; return initialLocale; });
    const location = useLocation();
    useEffect(() => {
        try {
            writeData(data);
        }
        catch {
            setToast('Storage is unavailable. Export your prompts to avoid losing changes.');
        }
    }, [data]);
    useEffect(() => { document.documentElement.dataset.theme = theme; writeSettings({ theme }); }, [theme]);
    useEffect(() => { document.documentElement.lang = locale; writeSettings({ locale }); }, [locale]);
    useEffect(() => { setMobileNav(false); }, [location.pathname]);
    useEffect(() => {
        if (!mobileNav) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMobileNav(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mobileNav]);
    useEffect(() => {
        if (!toast)
            return;
        const timeout = window.setTimeout(() => setToast(''), 3200);
        return () => window.clearTimeout(timeout);
    }, [toast]);
    const updateData = (updater: (current: AppData) => AppData) => setData((current) => updater(current));
    const toggleFavorite = (id: string) => updateData((current) => ({ ...current, prompts: current.prompts.map((p) => p.id === id ? { ...p, favorite: !p.favorite, updatedAt: new Date().toISOString() } : p) }));
    const deletePrompt = (id: string) => { updateData((current) => ({ ...current, prompts: current.prompts.filter((p) => p.id !== id), collections: current.collections.map((c) => ({ ...c, promptIds: c.promptIds.filter((promptId) => promptId !== id) })) })); setToast('Prompt deleted.'); };
    const addPrompt = (input: typeof blankPrompt, id?: string) => { updateData((current) => savePrompt(current, input, id)); setToast(id ? 'Changes saved.' : 'Prompt created.'); };
    const duplicatePrompt = (prompt: Prompt) => { const copy = savePrompt(data, { title: `${prompt.title} copy`, description: prompt.description, body: prompt.body, category: prompt.category, tags: [...prompt.tags] }); setData(copy); setToast('Prompt duplicated.'); };
    const addCollection = (name: string, description: string) => { const collection: PromptCollection = { id: createId(), name, description, promptIds: [], createdAt: new Date().toISOString() }; updateData((current) => ({ ...current, collections: [collection, ...current.collections] })); setToast('Collection created.'); };
    const navProps = { data, onToggleFavorite: toggleFavorite, onDeletePrompt: deletePrompt, onDuplicatePrompt: duplicatePrompt, onSavePrompt: addPrompt, onToast: setToast, onAddCollection: addCollection, onDataChange: setData, theme, onThemeChange: setTheme, locale, onLocaleChange: (nextLocale: AppLocale) => { document.documentElement.lang = nextLocale; writeSettings({ locale: nextLocale }); setLocale(nextLocale); } };
    return <div className="app-shell"><Sidebar data={data} mobileOpen={mobileNav} onClose={() => setMobileNav(false)}/>  <div className="main-shell"><Topbar mobileOpen={mobileNav} onMenu={() => setMobileNav((open) => !open)}/><main className="main-content"><Routes>    <Route path="/" element={<Dashboard {...navProps}/>}/>
    <Route path="/library" element={<Library {...navProps}/>}/>
    <Route path="/prompts/new" element={<Editor {...navProps}/>}/>
    <Route path="/prompts/:id" element={<Editor {...navProps}/>}/>
    <Route path="/collections" element={<Collections {...navProps}/>}/>
    <Route path="/favorites" element={<Favorites {...navProps}/>}/>
    <Route path="/settings" element={<SettingsPage {...navProps}/>}/>
    <Route path="/feedback" element={<FeedbackPage {...navProps}/>}/>
    <Route path="/auth" element={<AuthPage onToast={setToast}/>}/>
    <Route path="*" element={<NotFound />}/>
  </Routes></main><footer className="app-footer"><span>{localized("Made for thoughtful prompting ")}<span className="footer-sparkle">{localized("\u2733")}</span></span><span>{localized("PromptLab ")}<span className="footer-dot">{localized("\u00B7")}</span>{localized(" Local-first workspace")}</span></footer></div>{toast && <div className="toast" role="status"><span className="toast-icon"><Check size={16}/></span>{localized(toast)}<button aria-label={localized("Dismiss notification")} onClick={() => setToast('')}><X size={15}/></button></div>}</div>;
}
type SharedProps = {
    data: AppData;
    onToggleFavorite: (id: string) => void;
    onDeletePrompt: (id: string) => void;
    onDuplicatePrompt: (prompt: Prompt) => void;
    onSavePrompt: (input: typeof blankPrompt, id?: string) => void;
    onToast: (message: string) => void;
    onAddCollection: (name: string, description: string) => void;
    onDataChange: (data: AppData) => void;
    theme: 'dark' | 'light';
    onThemeChange: (theme: 'dark' | 'light') => void;
    locale: AppLocale;
    onLocaleChange: (locale: AppLocale) => void;
};
function Sidebar({ data, mobileOpen, onClose }: {
    data: AppData;
    mobileOpen: boolean;
    onClose: () => void;
}) {
    const primary = [{ to: '/', label: localized('Overview'), icon: LayoutDashboard }, { to: '/library', label: localized('Prompt library'), icon: FileText }, { to: '/collections', label: localized('Collections'), icon: Folder }, { to: '/favorites', label: localized('Favorites'), icon: Heart }];
    const bottom = [{ to: '/settings', label: localized('Settings'), icon: Settings }, { to: '/feedback', label: localized('Send feedback'), icon: LifeBuoy }];
    return <><div className={`mobile-overlay ${mobileOpen ? 'is-visible' : ''}`} onClick={onClose}/><aside id="app-sidebar" className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><div className="brand-row"><Link to="/" className="brand-mark"><span className="brand-icon"><Command size={20} strokeWidth={2.3}/></span><span className="brand-word">prompt<span>lab</span><sup>{localized("\u2733")}</sup></span></Link><button type="button" className="icon-button mobile-close" aria-label={localized("Close navigation")} onClick={onClose}><X size={18}/></button></div><button className="workspace-switcher"><span className="workspace-avatar">{localized("P")}</span><span className="workspace-meta"><strong>{localized("Personal workspace")}</strong><small>{localized("Free plan")}</small></span><ChevronDown size={15} className="muted-icon"/></button><div className="sidebar-label">{localized("WORKSPACE")}</div><nav className="nav-list">{primary.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} strokeWidth={1.8}/><span>{label}</span>{to === '/library' && <span className="nav-count">{data.prompts.length}</span>}{to === '/favorites' && data.prompts.some((p) => p.favorite) && <span className="nav-count">{data.prompts.filter((p) => p.favorite).length}</span>}</NavLink>)}</nav><div className="sidebar-label collections-label"><span>{localized("YOUR COLLECTIONS")}</span><span>{data.collections.length}</span></div><div className="sidebar-collections">{data.collections.slice(0, 5).map((collection, i) => <NavLink key={collection.id} to={`/collections?open=${collection.id}`} className="collection-nav"><span className={`collection-color color-${i % 4}`}/><span>{collection.name}</span><span className="collection-num">{collection.promptIds.length}</span></NavLink>)}{data.collections.length === 0 && <span className="sidebar-empty">{localized("No collections yet")}</span>}<NavLink to="/collections" className="add-collection-link"><Plus size={14}/>{localized(" New collection")}</NavLink></div><div className="sidebar-bottom"><div className="upgrade-card"><span className="upgrade-orb"><Sparkles size={17}/></span><strong>{localized("Your ideas, organized.")}</strong><p>{localized("A calm space for your best prompts.")}</p><Link to="/library">{localized("Explore library ")}<ArrowRight size={13}/></Link></div>{bottom.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `nav-link bottom-link ${isActive ? 'active' : ''}`}><Icon size={17}/><span>{label}</span></NavLink>)}<div className="sidebar-user"><div className="user-avatar">{localized("PL")}</div><div className="user-meta"><strong>{localized("Local workspace")}</strong><small>{localized("Data stored on this device")}</small></div><MoreHorizontal size={17} className="muted-icon"/></div></div></aside></>;
}
function Topbar({ onMenu, mobileOpen }: {
    onMenu: () => void;
    mobileOpen: boolean;
}) {
    const location = useLocation();
    const titleMap: Record<string, string> = { '/': 'Overview', '/library': 'Prompt library', '/collections': 'Collections', '/favorites': 'Favorites', '/settings': 'Settings', '/feedback': 'Feedback', '/auth': 'Account' };
    const currentTitle = titleMap[location.pathname] ?? (location.pathname.includes('/prompts/') ? 'Prompt studio' : 'Workspace');
    return <header className="topbar"><div className="topbar-left"><button type="button" className="icon-button mobile-menu" aria-label={localized(mobileOpen ? "Close navigation" : "Open navigation")} aria-expanded={mobileOpen} aria-controls="app-sidebar" onClick={onMenu}><Menu size={19}/></button><div className="breadcrumbs"><span>{localized("Workspace")}</span><span className="crumb-slash">{localized("/")}</span><strong>{currentTitle}</strong></div></div><div className="topbar-actions"><Link to="/feedback" className="topbar-help" aria-label={localized("Help and feedback")}><CircleHelp size={17}/></Link><span className="topbar-divider"/><div className="topbar-avatar" title={localized("Local workspace")}>{localized("PL")}</div><Link to="/auth" className="account-link">{localized("Sign in ")}<ArrowRight size={13}/></Link><Link to="/prompts/new" className="button button-primary button-small top-create"><Plus size={15}/>{localized(" New prompt")}</Link></div></header>;
}
function PageHeader({ eyebrow, title, description, action }: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) { return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>; }
function Button({ children, variant = 'secondary', className = '', ...props }: {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    className?: string;
    onClick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
}) { return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>; }
function Dashboard(props: SharedProps) {
    const { data } = props;
    const recent = [...data.prompts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
    const favorites = data.prompts.filter((p) => p.favorite).length;
    const wordCount = data.prompts.reduce((sum, p) => sum + countWords(p.body), 0);
    const categoriesCount = new Set(data.prompts.map((p) => p.category)).size;
    return <div className="page-content dashboard-page"><div className="welcome-strip"><div className="welcome-copy"><span className="welcome-kicker"><span className="live-dot"/>{localized(" YOUR CREATIVE WORKSPACE")}</span><h1>{localized("Good ideas deserve")}<br className="desktop-break"/> <span>{localized("a place to live.")}</span></h1><p>{localized("Capture your best thinking. Shape it into reusable prompts.")}</p><div className="welcome-actions"><Link className="button button-primary" to="/prompts/new"><Plus size={16}/>{localized(" Create a prompt ")}<ArrowRight size={15}/></Link><Link to="/library" className="text-link">{localized("Explore library ")}<ArrowRight size={14}/></Link></div></div><div className="welcome-art" aria-hidden="true"><div className="art-glow"/><div className="art-ring ring-one"/><div className="art-ring ring-two"/><div className="art-card art-card-back"><div className="art-line line-short"/><div className="art-line"/><div className="art-line line-mid"/><div className="art-chip">{localized("prompt.md")}</div></div><div className="art-card art-card-front"><div className="art-card-head"><span className="art-mini-icon"><Sparkles size={14}/></span><span>{localized("Prompt structure")}</span><MoreHorizontal size={15}/></div><div className="art-line line-short"/><div className="art-highlight">{'{{'}<span>{localized("your_idea")}</span>{'}}'}</div><div className="art-line line-mid"/><div className="art-line line-short"/><div className="art-bottom"><span className="art-dot"/><span>{localized("Ready to reuse")}</span><Check size={13}/></div></div><div className="floating-spark spark-one">{localized("\u2733")}</div><div className="floating-spark spark-two">{localized("\u2727")}</div></div></div>
    <div className="section-heading"><div><span className="section-kicker">{localized("AT A GLANCE")}</span><h2>{localized("Your workspace")}</h2></div><span className="subtle-meta">{localized("Updated just now")}</span></div>
    <div className="stats-grid"><StatCard icon={<FileText size={18}/>} label={localized("Total prompts")} value={data.prompts.length} note={localized("Ready to reuse")} tone="violet"/><StatCard icon={<Heart size={18}/>} label={localized("Favorites")} value={favorites} note={localized("Your go-to ideas")} tone="rose"/><StatCard icon={<Folder size={18}/>} label={localized("Collections")} value={data.collections.length} note={localized("Organized your way")} tone="blue"/><StatCard icon={<Activity size={18}/>} label={localized("Words saved")} value={wordCount.toLocaleString(currentLocale())} note={`${categoriesCount} ${pluralizeCount(categoriesCount, currentLocale(), 'active category', 'active categories', ['активная категория', 'активные категории', 'активных категорий'])}`} tone="green"/></div>
    <div className="dashboard-lower"><section className="panel recent-panel"><div className="panel-heading"><div><h2>{localized("Recently updated")}</h2><p>{localized("Pick up where you left off.")}</p></div><Link to="/library" className="panel-link">{localized("View library ")}<ArrowRight size={14}/></Link></div>{recent.length ? <div className="recent-list">{recent.map((prompt) => <PromptRow key={prompt.id} prompt={prompt} onToggleFavorite={props.onToggleFavorite}/>)}</div> : <EmptyState icon={<FileText size={21}/>} title={localized("Your next great prompt starts here")} text={localized("Create a prompt and it will show up here.")} action={<Link to="/prompts/new" className="button button-primary"><Plus size={15}/>{localized(" Create prompt")}</Link>}/>}</section><section className="panel shortcuts-panel"><div className="panel-heading"><div><h2>{localized("Quick actions")}</h2><p>{localized("A little momentum goes a long way.")}</p></div><span className="quick-spark"><Zap size={16}/></span></div><Link to="/prompts/new" className="shortcut-item"><span className="shortcut-icon violet"><Plus size={18}/></span><span><strong>{localized("Create a prompt")}</strong><small>{localized("Start with a blank canvas")}</small></span><ArrowRight size={15}/></Link><Link to="/library" className="shortcut-item"><span className="shortcut-icon blue"><Search size={18}/></span><span><strong>{localized("Find a prompt")}</strong><small>{localized("Search your whole library")}</small></span><ArrowRight size={15}/></Link><Link to="/collections" className="shortcut-item"><span className="shortcut-icon amber"><FolderPlus size={18}/></span><span><strong>{localized("Build a collection")}</strong><small>{localized("Group related ideas")}</small></span><ArrowRight size={15}/></Link><div className="tip-card"><span><Sparkles size={15}/>{localized(" A small tip")}</span><p>{localized("Use ")}<code>{'{{variable_name}}'}</code>{localized(" in a prompt to create reusable templates with fill-in fields.")}</p><Link to="/prompts/new">{localized("Try it in Prompt Studio ")}<ArrowRight size={12}/></Link></div></section></div>
  </div>;
}
function StatCard({ icon, label, value, note, tone }: {
    icon: ReactNode;
    label: string;
    value: number | string;
    note: string;
    tone: string;
}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note"><span className="stat-note-dot"/>{note}</div><div className={`stat-decoration ${tone}`}/></div>; }
function PromptRow({ prompt, onToggleFavorite }: {
    prompt: Prompt;
    onToggleFavorite: (id: string) => void;
}) { return <div className="recent-row"><Link to={`/prompts/${prompt.id}`} className="recent-main"><span className={`prompt-file-icon category-${prompt.category.toLowerCase()}`}><FileText size={16}/></span><span className="recent-text"><strong>{prompt.title}</strong><small>{prompt.description || prompt.body.slice(0, 70)}</small></span></Link><div className="recent-row-meta"><span className="category-pill">{categoryLabel(prompt.category, currentLocale())}</span><span className="recent-date">{relativeDate(prompt.updatedAt)}</span><button className={`icon-button favorite-button ${prompt.favorite ? 'is-favorite' : ''}`} aria-label={localized(prompt.favorite ? 'Remove from favorites' : 'Add to favorites')} onClick={() => onToggleFavorite(prompt.id)}><Heart size={16} fill={prompt.favorite ? 'currentColor' : 'none'}/></button></div></div>; }
function EmptyState({ icon, title, text, action }: {
    icon: ReactNode;
    title: string;
    text: string;
    action?: ReactNode;
}) { return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>; }
function Library(props: SharedProps) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All categories');
    const [tag, setTag] = useState('');
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sort, setSort] = useState<PromptSort>('updated');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const allTags = useMemo(() => [...new Set(props.data.prompts.flatMap((p) => p.tags))].sort(), [props.data.prompts]);
    const filtered = useMemo(() => props.data.prompts.filter((p) => { const q = query.toLowerCase().trim(); const matchQuery = !q || [p.title, p.description, p.body, ...p.tags].some((v) => v.toLowerCase().includes(q)); return matchQuery && (category === 'All categories' || p.category === category) && (!tag || p.tags.includes(tag)) && (!favoritesOnly || p.favorite); }).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.updatedAt.localeCompare(a.updatedAt)), [props.data.prompts, query, category, tag, favoritesOnly, sort]);
    const reset = () => { setQuery(''); setCategory('All categories'); setTag(''); setFavoritesOnly(false); setSort('updated'); };
    return <div className="page-content"><PageHeader eyebrow={localized("YOUR KNOWLEDGE BASE")} title={localized("Prompt library")} description={localized('Every good idea, one thoughtful workspace.')} action={<Link to="/prompts/new" className="button button-primary"><Plus size={16}/>{localized(" New prompt")}</Link>}/><div className="library-summary"><div className="library-count"><span className="library-count-number">{filtered.length}</span><span>{pluralizeCount(filtered.length, currentLocale(), 'prompt', 'prompts', ['промпт', 'промпта', 'промптов'])} <span className="muted-text">{localized("in your library")}</span></span></div><div className="library-controls"><label className="search-field"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={localized("Search prompts...")} aria-label={localized("Search prompts")}/><kbd>{localized("\u2318 K")}</kbd></label><button className={`button button-secondary filter-toggle ${showFilters || category !== 'All categories' || tag || favoritesOnly ? 'is-active' : ''}`} onClick={() => setShowFilters((v) => !v)}><Filter size={15}/>{localized(" Filters")}{(category !== 'All categories' || tag || favoritesOnly) && <span className="filter-dot"/>}</button><label className="sort-select"><ArrowDownUp size={14}/><select value={sort} onChange={(e) => setSort(e.target.value as PromptSort)} aria-label={localized("Sort prompts")}><option value="updated">{localized("Recently updated")}</option><option value="newest">{localized("Newest first")}</option><option value="oldest">{localized("Oldest first")}</option><option value="title">{localized("Title A\u2013Z")}</option></select><ChevronDown size={13}/></label><div className="view-toggle"><button aria-label={localized("Grid view")} className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')}><span className="grid-glyph"><i /><i /><i /><i /></span></button><button aria-label={localized("List view")} className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')}><ListFilter size={16}/></button></div></div></div>{showFilters && <div className="filter-panel"><label>{localized("Category")}<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="All categories">{localized("All categories")}</option>{categories.map((c) => <option key={c} value={c}>{categoryLabel(c, currentLocale())}</option>)}</select></label><label>{localized("Tag")}<select value={tag} onChange={(e) => setTag(e.target.value)}><option value="">{localized("All tags")}</option>{allTags.map((t) => <option key={t}>{t}</option>)}</select></label><label className="favorite-filter"><input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)}/>{localized(" Favorites only")}</label><button className="text-button" onClick={reset}>{localized("Reset filters")}</button></div>}
    {(query || category !== 'All categories' || tag || favoritesOnly) && <div className="active-filters"><span>{localized("Active filters")}</span>{query && <button onClick={() => setQuery('')}>{localized("Search: ")}{query} <X size={12}/></button>}{category !== 'All categories' && <button onClick={() => setCategory('All categories')}>{categoryLabel(category, currentLocale())} <X size={12}/></button>}{tag && <button onClick={() => setTag('')}>{localized("#")}{tag} <X size={12}/></button>}{favoritesOnly && <button onClick={() => setFavoritesOnly(false)}>{localized("Favorites ")}<X size={12}/></button>}<button className="clear-filters" onClick={reset}>{localized("Clear all")}</button></div>}
    {filtered.length ? <div className={view === 'grid' ? 'prompt-grid' : 'prompt-list'}>{filtered.map((prompt, index) => <PromptCard key={prompt.id} prompt={prompt} index={index} view={view} onToggleFavorite={props.onToggleFavorite} onDuplicate={props.onDuplicatePrompt} onDelete={props.onDeletePrompt} onToast={props.onToast}/>)}</div> : <EmptyState icon={<Search size={21}/>} title={props.data.prompts.length ? 'No prompts match your filters' : 'Your library is a blank canvas'} text={props.data.prompts.length ? 'Try another search or clear the filters to see more.' : 'Create your first prompt and start building a library you can reuse.'} action={props.data.prompts.length ? <Button onClick={reset}>{localized("Clear filters")}</Button> : <Link to="/prompts/new" className="button button-primary"><Plus size={15}/>{localized(" Create your first prompt")}</Link>}/>}
    <div className="library-footnote"><ShieldCheck size={14}/>{localized(" Your prompts are stored locally on this device. ")}<Link to="/settings">{localized("Manage your data")}</Link></div>
  </div>;
}
function PromptCard({ prompt, index, view, onToggleFavorite, onDuplicate, onDelete, onToast }: {
    prompt: Prompt;
    index: number;
    view: 'grid' | 'list';
    onToggleFavorite: (id: string) => void;
    onDuplicate: (prompt: Prompt) => void;
    onDelete: (id: string) => void;
    onToast: (s: string) => void;
}) {
    const [menu, setMenu] = useState(false);
    const preview = prompt.body.replace(/\{\{\s*([\w]+)\s*\}\}/g, '[$1]');
    return <article className={`prompt-card ${view === 'list' ? 'prompt-card-list' : ''}`} style={{ animationDelay: `${Math.min(index * 35, 210)}ms` }}><div className="prompt-card-top"><span className={`prompt-category-icon category-${prompt.category.toLowerCase()}`}><CategoryIcon category={prompt.category}/></span><div className="prompt-card-actions"><button className={`icon-button card-favorite ${prompt.favorite ? 'is-favorite' : ''}`} aria-label={prompt.favorite ? `Remove ${prompt.title} from favorites` : `Add ${prompt.title} to favorites`} onClick={() => onToggleFavorite(prompt.id)}><Star size={16} fill={prompt.favorite ? 'currentColor' : 'none'}/></button><div className="menu-anchor"><button className="icon-button" aria-label={`More actions for ${prompt.title}`} onClick={() => setMenu((v) => !v)}><MoreHorizontal size={18}/></button>{menu && <><button className="menu-dismiss" aria-label={localized("Close menu")} onClick={() => setMenu(false)}/><div className="action-menu"><Link to={`/prompts/${prompt.id}`} onClick={() => setMenu(false)}>{localized("Edit prompt")}</Link><button onClick={() => { onDuplicate(prompt); setMenu(false); }}>{localized("Duplicate")}</button><button onClick={async () => {
                try {
                    await navigator.clipboard.writeText(prompt.body);
                    onToast('Prompt copied to clipboard.');
                }
                catch {
                    onToast('Clipboard access is unavailable in this browser.');
                }
                setMenu(false);
            }}>{localized("Copy template")}</button><button className="menu-danger" onClick={() => {
                if (window.confirm(localized(`Delete “${prompt.title}”? This cannot be undone.`)))
                    onDelete(prompt.id);
                setMenu(false);
            }}>{localized("Delete")}</button></div></>}</div></div></div><Link to={`/prompts/${prompt.id}`} className="prompt-card-content"><div className="prompt-card-meta"><span>{categoryLabel(prompt.category, currentLocale())}</span><span className="meta-dot">{localized("\u00B7")}</span><span>{countWords(prompt.body)} {pluralizeCount(countWords(prompt.body), currentLocale(), 'word', 'words', ['слово', 'слова', 'слов'])}</span></div><h3>{prompt.title}</h3><p className="prompt-description">{prompt.description || localized('A reusable prompt template.')}</p><p className="prompt-preview">{preview}</p></Link><div className="prompt-card-footer"><div className="tag-list">{prompt.tags.slice(0, 3).map((t) => <span key={t} className="tag-chip">{t}</span>)}{prompt.tags.length > 3 && <span className="tag-more">{localized("+")}{prompt.tags.length - 3}</span>}</div><span className="card-updated">{relativeDate(prompt.updatedAt)}</span></div></article>;
}
function CategoryIcon({ category }: {
    category: string;
}) {
    if (category === 'Development')
        return <Command size={18}/>;
    if (category === 'Marketing')
        return <BarChart3 size={18}/>;
    if (category === 'Research')
        return <Search size={18}/>;
    if (category === 'Design')
        return <Sparkles size={18}/>;
    if (category === 'Productivity')
        return <Zap size={18}/>;
    return <FileText size={18}/>;
}
function Editor(props: SharedProps) {
    const { id } = useParams();
    const navigate = useNavigate();
    const existing = id ? props.data.prompts.find((p) => p.id === id) : undefined;
    const [form, setForm] = useState(() => existing ? { title: existing.title, description: existing.description, body: existing.body, category: existing.category, tags: [...existing.tags] } : { ...blankPrompt });
    const [tagInput, setTagInput] = useState('');
    const [values, setValues] = useState<Record<string, string>>({});
    const [showVersions, setShowVersions] = useState(false);
    const [showRendered, setShowRendered] = useState(true);
    const [savedAt, setSavedAt] = useState(existing?.updatedAt ?? '');
    const [errors, setErrors] = useState<string[]>([]);
    const originalRef = useRef(JSON.stringify(form));
    useEffect(() => {
        if (existing) {
            const next = { title: existing.title, description: existing.description, body: existing.body, category: existing.category, tags: [...existing.tags] };
            setForm(next);
            originalRef.current = JSON.stringify(next);
            setSavedAt(existing.updatedAt);
        }
    }, [id, existing]);
    const variables = extractVariables(form.body);
    const rendered = renderTemplate(form.body, values);
    const dirty = JSON.stringify(form) !== originalRef.current;
    const setField = <K extends keyof typeof blankPrompt>(key: K, value: (typeof blankPrompt)[K]) => setForm((current) => ({ ...current, [key]: value }));
    const addTag = () => {
        const clean = tagInput.trim().replace(/^#/, '');
        if (clean && !form.tags.some((t) => t.toLowerCase() === clean.toLowerCase()))
            setField('tags', [...form.tags, clean]);
        setTagInput('');
    };
    const save = (e?: FormEvent) => {
        e?.preventDefault();
        const nextErrors: string[] = [];
        if (!form.title.trim())
            nextErrors.push('Give your prompt a title.');
        if (!form.body.trim())
            nextErrors.push('Add some prompt content before saving.');
        if (form.title.trim().length > 160)
            nextErrors.push('Keep the title under 160 characters.');
        if (nextErrors.length) {
            setErrors(nextErrors);
            return;
        }
        props.onSavePrompt({ ...form, title: form.title.trim(), description: form.description.trim(), body: form.body, tags: form.tags }, id);
        originalRef.current = JSON.stringify(form);
        setSavedAt(new Date().toISOString());
        setErrors([]);
        if (!id)
            navigate('/library');
    };
    const restoreVersion = (version: Prompt['versions'][number]) => {
        if (!existing)
            return;
        const next = { title: version.title, description: version.description, body: version.body, category: version.category, tags: [...version.tags] };
        setForm(next);
        setShowVersions(false);
        props.onToast(localized(`Version ${version.version} loaded. Save to make it current.`));
    };
    return <div className="page-content editor-page"><div className="editor-breadcrumb"><Link to="/library"><ArrowLeft size={14}/>{localized(" Prompt library")}</Link><span>{localized("/")}</span><span>{localized(id ? 'Edit prompt' : 'New prompt')}</span><span className="editor-save-state"><span className={`save-dot ${dirty ? 'unsaved' : ''}`}/>{localized(dirty ? 'Unsaved changes' : savedAt ? `Saved ${relativeDate(savedAt).toLowerCase()}` : 'Draft')}</span></div><div className="editor-heading"><div><div className="eyebrow">{localized("PROMPT STUDIO")}</div><h1>{localized(id ? 'Shape your thinking.' : 'Start with an idea.')}</h1><p>{localized("Make your best instructions reusable, one prompt at a time.")}</p></div><div className="editor-heading-actions">{existing && existing.versions.length > 0 && <Button onClick={() => setShowVersions((v) => !v)}><Activity size={15}/>{localized(" History ")}<span className="history-count">{existing.versions.length}</span></Button>}<Button onClick={() => {
            if (dirty && !window.confirm(localized('Discard unsaved changes?')))
                return;
            navigate('/library');
        }}><X size={15}/>{localized(" Cancel")}</Button><Button variant="primary" onClick={() => save()}><Check size={15}/>{localized(" Save prompt")}</Button></div></div>
    {showVersions && existing && <section className="versions-panel"><div className="panel-heading"><div><h2>{localized("Version history")}</h2><p>{localized("Restoring a version loads it into the editor. Save it to make it current.")}</p></div><button className="icon-button" aria-label={localized("Close version history")} onClick={() => setShowVersions(false)}><X size={16}/></button></div>{[...existing.versions].reverse().map((version) => <div key={version.id} className="version-row"><span className="version-number">{localized("v")}{version.version}</span><span className="version-title">{version.title}<small>{relativeDate(version.createdAt)}{localized(" \u00B7 ")}{countWords(version.body)} {pluralizeCount(countWords(version.body), currentLocale(), 'word', 'words', ['слово', 'слова', 'слов'])}</small></span><Button onClick={() => restoreVersion(version)}>{localized("Restore")}</Button></div>)}</section>}
    {errors.length > 0 && <div className="form-errors" role="alert">{errors.map((error) => <span key={error}>{error}</span>)}</div>}
    <form className="editor-layout" onSubmit={save}><div className="editor-main-column"><section className="panel editor-details-panel"><div className="editor-section-head"><span className="section-number">{localized("01")}</span><div><h2>{localized("The essentials")}</h2><p>{localized("Give this prompt a clear identity.")}</p></div></div><label className="field-label">{localized("Prompt title ")}<span className="required-star">{localized("*")}</span><input className="text-input title-input" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder={localized("e.g. Thoughtful code reviewer")} maxLength={160}/></label><label className="field-label">{localized("Description ")}<span className="field-optional">{localized("OPTIONAL")}</span><input className="text-input" value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder={localized("What does this prompt help you do?")}/></label><div className="form-two-col"><label className="field-label">{localized("Category")}<select className="text-input" value={form.category} onChange={(e) => setField('category', e.target.value as PromptCategory)}>{categories.map((c) => <option key={c} value={c}>{categoryLabel(c, currentLocale())}</option>)}</select></label><div className="field-label">{localized("Tags ")}<span className="field-optional">{localized("OPTIONAL")}</span><div className="tag-input-wrap"><div className="tag-list tag-input-list">{form.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}<button type="button" aria-label={localized(`Remove tag ${tag}`)} onClick={() => setField('tags', form.tags.filter((t) => t !== tag))}><X size={11}/></button></span>)}<input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
            }
        }} onBlur={addTag} placeholder={form.tags.length ? 'Add another' : 'Add tags'}/></div><button type="button" className="tag-add-button" aria-label={localized("Add tag")} onClick={addTag}><Plus size={14}/></button></div></div></div></section>
      <section className="panel prompt-body-panel"><div className="editor-section-head"><span className="section-number">{localized("02")}</span><div><h2>{localized("Prompt instructions")}</h2><p>{localized("Use ")}<code>{'{{variable_name}}'}</code>{localized(" to make parts of your prompt reusable.")}</p></div><span className="word-count">{countWords(form.body)} {pluralizeCount(countWords(form.body), currentLocale(), 'word', 'words', ['слово', 'слова', 'слов'])} <span>{localized("\u00B7")}</span> {form.body.length}{localized(" characters")}</span></div><div className="editor-toolbar"><span className="editor-language"><span className="language-dot"/>{localized(" Plain text")}</span><span className="editor-toolbar-right"><span>{localized("Markdown-friendly")}</span><button type="button" className="icon-button" title={localized("Copy template")} onClick={async () => {
            try {
                await navigator.clipboard.writeText(form.body);
                props.onToast('Template copied.');
            }
            catch {
                props.onToast('Clipboard access is unavailable.');
            }
        }}><Copy size={15}/></button></span></div><textarea className="prompt-textarea" value={form.body} onChange={(e) => setField('body', e.target.value)} placeholder={localized('You are an expert in {{domain}}.\n\nHelp me create {{deliverable}} for {{audience}}.\n\nContext:\n{{context}}\n\nRequirements:\n- Be specific and actionable\n- State assumptions clearly')} spellCheck="false"/><div className="editor-body-footer"><span><Sparkles size={14}/> <strong>{variables.length}</strong> {localized(variables.length === 1 ? 'variable detected' : 'variables detected')}</span><span>{localized("Changes are saved when you click Save prompt.")}</span></div></section></div>
      <aside className="editor-side-column"><section className="panel preview-panel"><div className="preview-panel-head"><div className="preview-title"><span className="preview-icon"><WandSparkles size={16}/></span><div><h2>{localized("Live preview")}</h2><p>{localized("See your prompt take shape.")}</p></div></div><div className="preview-tabs"><button type="button" className={showRendered ? 'selected' : ''} onClick={() => setShowRendered(true)}>{localized("Rendered")}</button><button type="button" className={!showRendered ? 'selected' : ''} onClick={() => setShowRendered(false)}>{localized("Template")}</button></div></div>{variables.length > 0 && <div className="preview-variable-section"><div className="preview-subhead"><span>{localized("FILL IN VARIABLES")}</span><span>{variables.length}{localized(" fields")}</span></div>{variables.map((variable) => <label key={variable} className="variable-field"><span>{variable.replaceAll('_', ' ')}</span><input value={values[variable] ?? ''} onChange={(e) => setValues((current) => ({ ...current, [variable]: e.target.value }))} placeholder={`Enter ${variable.replaceAll('_', ' ')}...`}/></label>)}</div>}{variables.length === 0 && <div className="no-variables"><Sparkles size={16}/><span>{localized("Add ")}<code>{'{{variables}}'}</code>{localized(" to your template to make it dynamic.")}</span></div>}<div className="preview-output-head"><span>{localized(showRendered ? 'OUTPUT PREVIEW' : 'RAW TEMPLATE')}</span>{showRendered && rendered.missing.length > 0 && <span className="missing-count">{rendered.missing.length}{localized(" missing")}</span>}</div><pre className="preview-output">{showRendered ? rendered.output : form.body || localized('Your prompt will appear here...')}</pre>{showRendered && rendered.missing.length > 0 && <div className="preview-warning"><Activity size={13}/>{localized(" Fill in the highlighted variables to complete your prompt.")}</div>}<Button className="copy-output-button" variant="primary" onClick={async () => {
            try {
                await navigator.clipboard.writeText(showRendered ? rendered.output : form.body);
                props.onToast(showRendered ? 'Rendered prompt copied.' : 'Template copied.');
            }
            catch {
                props.onToast('Clipboard access is unavailable in this browser.');
            }
        }}><Copy size={15}/>{localized(" Copy ")}{localized(showRendered ? 'output' : 'template')} <span>{localized("\u2318 C")}</span></Button></section><div className="editor-tip"><span className="editor-tip-icon"><Sparkles size={16}/></span><div><strong>{localized("Make it reusable")}</strong><p>{localized("Clear instructions, useful context, and a defined output format make a prompt easier to reuse.")}</p></div></div>{existing && <Button className="delete-prompt-button" onClick={() => {
                if (window.confirm(localized(`Delete “${existing.title}”? This cannot be undone.`))) {
                    props.onDeletePrompt(existing.id);
                    navigate('/library');
                }
            }}><Trash2 size={14}/>{localized(" Delete this prompt")}</Button>}</aside></form>
  </div>;
}
function Favorites(props: SharedProps) { const favoritePrompts = props.data.prompts.filter((p) => p.favorite); return <div className="page-content"><PageHeader eyebrow={localized("YOUR SHORTLIST")} title={localized("Favorites")} description={localized("The prompts you reach for again and again.")} action={<Link to="/prompts/new" className="button button-primary"><Plus size={15}/>{localized(" New prompt")}</Link>}/>{favoritePrompts.length ? <div className="prompt-grid">{favoritePrompts.map((p, i) => <PromptCard key={p.id} prompt={p} index={i} view="grid" onToggleFavorite={props.onToggleFavorite} onDuplicate={props.onDuplicatePrompt} onDelete={props.onDeletePrompt} onToast={props.onToast}/>)}</div> : <EmptyState icon={<Heart size={22}/>} title={localized("Your favorites live here")} text={localized("Mark a prompt with the star to keep your best ideas close.")} action={<Link className="button button-primary" to="/library">{localized("Browse prompt library ")}<ArrowRight size={14}/></Link>}/>}</div>; }
function Collections(props: SharedProps) {
    const [dialog, setDialog] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [active, setActive] = useState<string | null>(new URLSearchParams(window.location.search).get('open'));
    const [addingPrompt, setAddingPrompt] = useState('');
    const selected = props.data.collections.find((c) => c.id === active);
    const create = (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim())
            return;
        props.onAddCollection(name.trim(), description.trim());
        setName('');
        setDescription('');
        setDialog(false);
    };
    const updateCollection = (id: string, update: Partial<PromptCollection>) => props.onDataChange({ ...props.data, collections: props.data.collections.map((c) => c.id === id ? { ...c, ...update } : c) });
    if (selected) {
        const collectionPrompts = selected.promptIds.map((id) => props.data.prompts.find((p) => p.id === id)).filter((p): p is Prompt => Boolean(p));
        const available = props.data.prompts.filter((p) => !selected.promptIds.includes(p.id));
        return <div className="page-content"><div className="editor-breadcrumb"><button className="breadcrumb-button" onClick={() => { setActive(null); window.history.replaceState({}, '', '/collections'); }}><ArrowLeft size={14}/>{localized(" Collections")}</button><span>{localized("/")}</span><span>{selected.name}</span></div><PageHeader eyebrow={localized("COLLECTION")} title={selected.name} description={selected.description || 'A curated collection of prompts.'} action={<Button onClick={() => {
                    const next = window.prompt(localized('Rename collection'), selected.name);
                    if (next?.trim())
                        updateCollection(selected.id, { name: next.trim() });
                }}>{localized("Rename")}</Button>}/><div className="collection-detail-toolbar"><span>{localized(`${collectionPrompts.length} prompts in this collection`)}</span>{available.length > 0 && <label className="sort-select"><Plus size={14}/><select value={addingPrompt} onChange={(e) => {
                    if (e.target.value) {
                        updateCollection(selected.id, { promptIds: [...selected.promptIds, e.target.value] });
                        props.onToast('Prompt added to collection.');
                        setAddingPrompt('');
                    }
                }} aria-label={localized("Add prompt to collection")}><option value="">{localized("Add a prompt\u2026")}</option>{available.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select><ChevronDown size={13}/></label>}</div>{collectionPrompts.length ? <div className="prompt-grid">{collectionPrompts.map((p, i) => <div className="collection-prompt-wrap" key={p.id}><PromptCard prompt={p} index={i} view="grid" onToggleFavorite={props.onToggleFavorite} onDuplicate={props.onDuplicatePrompt} onDelete={props.onDeletePrompt} onToast={props.onToast}/><button className="remove-from-collection" onClick={() => updateCollection(selected.id, { promptIds: selected.promptIds.filter((id) => id !== p.id) })}>{localized("Remove from collection")}</button></div>)}</div> : <EmptyState icon={<Folder size={22}/>} title={localized("This collection is ready for ideas")} text={localized("Add prompts from the menu above to build your own collection.")}/>}</div>;
    }
    return <div className="page-content"><PageHeader eyebrow={localized("ORGANIZE YOUR THINKING")} title={localized("Collections")} description={localized("Bring related prompts together into focused workspaces.")} action={<Button variant="primary" onClick={() => setDialog(true)}><Plus size={15}/>{localized(" New collection")}</Button>}/>{props.data.collections.length ? <div className="collections-grid">{props.data.collections.map((c, i) => <button key={c.id} className="collection-card" onClick={() => { setActive(c.id); window.history.replaceState({}, '', `/collections?open=${c.id}`); }}><div className="collection-card-top"><span className={`collection-big-icon color-${i % 4}`}><Folder size={22}/></span><MoreHorizontal size={18} className="muted-icon"/></div><h3>{c.name}</h3><p>{c.description || localized('A space for related prompts and ideas.')}</p><div className="collection-card-bottom"><span>{c.promptIds.length} {pluralizeCount(c.promptIds.length, currentLocale(), 'prompt', 'prompts', ['промпт', 'промпта', 'промптов'])}</span><span>{localized("Open collection ")}<ArrowRight size={13}/></span></div></button>)}</div> : <EmptyState icon={<FolderPlus size={22}/>} title={localized("A little structure goes a long way")} text={localized("Create a collection for a project, workflow, or topic you return to often.")} action={<Button variant="primary" onClick={() => setDialog(true)}><Plus size={15}/>{localized(" Create collection")}</Button>}/>}{dialog && <Modal title={localized("Create a collection")} description={localized("Give a group of related prompts a home.")} onClose={() => setDialog(false)}><form className="modal-form" onSubmit={create}><label className="field-label">{localized("Collection name")}<input autoFocus className="text-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder={localized("e.g. Product launch")} required/></label><label className="field-label">{localized("Description ")}<span className="field-optional">{localized("OPTIONAL")}</span><textarea className="text-input modal-textarea" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder={localized("What belongs in this collection?")}/></label><div className="modal-actions"><Button type="button" onClick={() => setDialog(false)}>{localized("Cancel")}</Button><Button type="submit" variant="primary"><Plus size={14}/>{localized(" Create collection")}</Button></div></form></Modal>}</div>;
}
function SettingsPage(props: SharedProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [importBusy, setImportBusy] = useState(false);
    const [cloudStatus, setCloudStatus] = useState('Not connected');
    const [accountEmail, setAccountEmail] = useState('');
    useEffect(() => {
        if (!supabase)
            return;
        supabase.auth.getSession().then(({ data: result }) => {
            if (result.session) {
                setCloudStatus('Connected');
                setAccountEmail(result.session.user.email ?? '');
            }
        });
    }, []);
    const download = (content: string, filename: string, type: string) => { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); };
    const handleImport = async (file?: File) => {
        if (!file)
            return;
        setImportBusy(true);
        if (file.size > 5 * 1024 * 1024) {
            props.onToast('File is too large. The limit is 5 MB.');
            setImportBusy(false);
            return;
        }
        const result = importJson(await file.text(), props.data);
        if (result.error)
            props.onToast(result.error);
        else {
            props.onDataChange(result.data);
            props.onToast(`${result.imported} prompt${result.imported === 1 ? '' : 's'} imported.`);
        }
        setImportBusy(false);
        if (fileRef.current)
            fileRef.current.value = '';
    };
    const signOut = async () => {
        if (!supabase)
            return;
        const { error } = await supabase.auth.signOut();
        if (error)
            props.onToast(error.message);
        else {
            setCloudStatus('Not connected');
            setAccountEmail('');
            props.onToast('Signed out. Local prompts remain on this device.');
        }
    };
    return <div className="page-content"><PageHeader eyebrow={localized("MAKE IT YOURS")} title={localized("Settings")} description={localized("Manage your workspace, data, and preferences.")}/><div className="settings-layout"><aside className="settings-nav"><a href="#appearance" className="settings-nav-active"><Sparkles size={15}/>{localized(" Appearance")}</a><a href="#data"><DatabaseIcon />{localized(" Data & backups")}</a><a href="#account"><ShieldCheck size={15}/>{localized(" Account & cloud")}</a><a href="#privacy"><CircleHelp size={15}/>{localized(" Privacy")}</a></aside><div className="settings-main"><section id="appearance" className="panel settings-section"><div className="settings-section-heading"><span className="settings-section-icon"><Sparkles size={17}/></span><div><h2>{localized("Appearance")}</h2><p>{localized("Make your workspace feel right.")}</p></div></div><div className="settings-row"><div><strong>{localized("Color theme")}</strong><p>{localized("Choose how PromptLab looks on this device.")}</p></div><div className="theme-picker"><button className={props.theme === 'dark' ? 'selected' : ''} onClick={() => props.onThemeChange('dark')}><span className="theme-swatch theme-dark"/>{localized(" Dark")}</button><button className={props.theme === 'light' ? 'selected' : ''} onClick={() => props.onThemeChange('light')}><span className="theme-swatch theme-light"/>{localized(" Light")}</button></div></div><div className="settings-row"><div><strong>{localized("Language")}</strong><p>{localized("Choose interface language")}</p></div><LocaleSwitch locale={props.locale} onChange={props.onLocaleChange}/></div></section><section id="data" className="panel settings-section"><div className="settings-section-heading"><span className="settings-section-icon"><Download size={17}/></span><div><h2>{localized("Data & backups")}</h2><p>{localized("Your prompts are stored locally in this browser.")}</p></div></div><div className="settings-row"><div><strong>{localized("Export all data")}</strong><p>{localized("Download a JSON backup of prompts, versions, collections, and feedback.")}</p></div><Button onClick={() => { download(exportJson(props.data), `promptlab-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json'); props.onToast('Backup downloaded.'); }}><Download size={14}/>{localized(" Export JSON")}</Button></div><div className="settings-row"><div><strong>{localized("Export prompts as CSV")}</strong><p>{localized("Get a spreadsheet-friendly copy of your prompt library.")}</p></div><Button onClick={() => { download(exportCsv(props.data.prompts), 'promptlab-prompts.csv', 'text/csv;charset=utf-8'); props.onToast('CSV exported.'); }}><FileText size={14}/>{localized(" Export CSV")}</Button></div><div className="settings-row"><div><strong>{localized("Import a backup")}</strong><p>{localized("Import a PromptLab JSON file. Existing prompts are preserved.")}</p></div><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void handleImport(e.target.files?.[0])}/><Button onClick={() => fileRef.current?.click()} disabled={importBusy}><Upload size={14}/> {localized(importBusy ? 'Importing…' : 'Import JSON')}</Button></div><div className="settings-row danger-row"><div><strong>{localized("Reset demo workspace")}</strong><p>{localized("Restore the starter prompts and remove local changes. Export a backup first.")}</p></div><Button variant="danger" onClick={() => {
            if (window.confirm(localized('Reset all local PromptLab data to the starter workspace? Export a backup first if you need your current data.'))) {
                localStorage.removeItem('promptlab:data:v1');
                props.onDataChange(readData());
                props.onToast('Workspace reset to starter data.');
            }
        }}><Trash2 size={14}/>{localized(" Reset workspace")}</Button></div></section><section id="account" className="panel settings-section"><div className="settings-section-heading"><span className="settings-section-icon"><ShieldCheck size={17}/></span><div><h2>{localized("Account & cloud")}</h2><p>{localized("Optional cloud storage powered by Supabase.")}</p></div><span className={`status-badge ${cloudStatus === 'Connected' ? 'connected' : ''}`}><span />{localized(cloudStatus)}</span></div>{!isCloudConfigured ? <div className="cloud-notice"><span className="cloud-notice-icon"><DatabaseIcon /></span><div><strong>{localized("Cloud features are not configured")}</strong><p>{localized("PromptLab is fully usable in local mode. To enable accounts and cloud persistence, add the Supabase URL and publishable key to ")}<code>{localized(".env.local")}</code>{localized(", apply the SQL migrations, and restart the dev server.")}</p><Link to="/auth">{localized("Open account page ")}<ArrowRight size={13}/></Link></div></div> : <div className="settings-row"><div><strong>{accountEmail || localized('Supabase account')}</strong><p>{localized(accountEmail ? 'Signed in to your cloud account.' : 'Cloud is configured. Sign in to use your account.')}</p></div>{accountEmail ? <Button onClick={() => void signOut()}>{localized("Sign out")}</Button> : <Link to="/auth" className="button button-primary">{localized("Sign in ")}<ArrowRight size={14}/></Link>}</div>}</section><section id="privacy" className="panel settings-section"><div className="settings-section-heading"><span className="settings-section-icon"><ShieldCheck size={17}/></span><div><h2>{localized("Privacy & storage")}</h2><p>{localized("Understand where your work lives.")}</p></div></div><div className="privacy-points"><p><Check size={15}/>{localized(" No paid AI API is required to use the prompt editor.")}</p><p><Check size={15}/>{localized(" Local mode keeps prompt data in this browser on this device.")}</p><p><Check size={15}/>{localized(" Clearing browser storage can delete local prompts. Export backups regularly.")}</p><p><Check size={15}/>{localized(" Cloud storage is optional and requires separately configured Supabase services.")}</p></div></section></div></div></div>;
}
function DatabaseIcon() { return <Folder size={15}/>; }
function FeedbackPage(props: SharedProps) {
    const [type, setType] = useState<FeedbackEntry['type']>('general');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const submit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (subject.trim().length < 2) {
            setError('Please add a subject with at least 2 characters.');
            return;
        }
        if (message.trim().length < 10) {
            setError('Please add a little more detail (at least 10 characters).');
            return;
        }
        if (message.length > 5000) {
            setError('Keep your message under 5,000 characters.');
            return;
        }
        const entry: FeedbackEntry = { id: createId(), type, subject: subject.trim(), message: message.trim(), email: email.trim(), createdAt: new Date().toISOString() };
        props.onDataChange({ ...props.data, feedback: [...props.data.feedback, entry] });
        setSent(true);
        props.onToast('Feedback saved locally on this device. It has not been sent to the PromptLab team.');
    };
    return <div className="page-content feedback-page"><PageHeader eyebrow={localized("HELP US GET BETTER")} title={localized("Your feedback matters.")} description={localized("Found a rough edge or have an idea? We would love to hear it.")}/><div className="feedback-layout"><section className="panel feedback-form-panel">{sent ? <div className="feedback-success"><span className="success-icon"><Check size={23}/></span><h2>{localized("Thanks for sharing.")}</h2><p>{localized("Your feedback has been saved in this browser. It has ")}<strong>{localized("not been sent")}</strong>{localized(" to the PromptLab team because cloud feedback delivery is not configured in this version.")}</p><Button variant="primary" onClick={() => { setSent(false); setType('general'); setSubject(''); setMessage(''); setEmail(''); }}>{localized("Send another note")}</Button></div> : <form onSubmit={submit}><div className="feedback-type-grid">{([{ value: 'bug', icon: <Activity size={18}/>, title: 'Bug report', desc: 'Something is not working' }, { value: 'feature', icon: <Sparkles size={18}/>, title: 'Feature idea', desc: 'Something we could add' }, { value: 'general', icon: <Heart size={18}/>, title: 'General feedback', desc: 'Anything else on your mind' }] as const).map((item) => <button key={item.value} type="button" className={`feedback-type-card ${type === item.value ? 'selected' : ''}`} onClick={() => setType(item.value)}><span className="feedback-type-icon">{item.icon}</span><strong>{localized(item.title)}</strong><small>{localized(item.desc)}</small><span className="feedback-radio">{type === item.value && <span />}</span></button>)}</div><label className="field-label">{localized("Subject")}<input className="text-input" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} placeholder={localized("A short summary")} required/></label><label className="field-label">{localized("Tell us more")}<textarea className="text-input feedback-textarea" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} placeholder={localized("What happened, what did you expect, or what would make your workflow better?")} required/><span className="character-counter">{message.length}{localized("/5000")}</span></label><label className="field-label">{localized("Email ")}<span className="field-optional">{localized("OPTIONAL")}</span><input className="text-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} placeholder={localized("you@example.com")}/></label>{error && <div className="form-error-inline" role="alert">{localized(error)}</div>}<div className="feedback-submit-row"><span><ShieldCheck size={14}/>{localized(" Stored locally. Not transmitted.")}</span><Button type="submit" variant="primary">{localized("Save feedback ")}<ArrowRight size={14}/></Button></div></form>}</section><aside className="feedback-aside"><div className="feedback-aside-art"><span className="feedback-orbit orbit-a"/><span className="feedback-orbit orbit-b"/><span className="feedback-aside-icon"><LifeBuoy size={28}/></span><Sparkles size={16} className="feedback-star"/></div><h2>{localized("Small details make a difference.")}</h2><p>{localized("This version saves your feedback in your local workspace. A server-side delivery endpoint can be connected later to send feedback securely.")}</p><div className="feedback-aside-note"><ShieldCheck size={16}/><span><strong>{localized("Privacy first")}</strong><small>{localized("Do not include passwords, API keys, or other secrets in feedback.")}</small></span></div></aside></div></div>;
}
function AuthPage({ onToast }: {
    onToast: (message: string) => void;
}) {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
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
        const result = mode === 'signup' ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (result.error)
            setMessage(result.error.message);
        else if (mode === 'signup' && !result.data.session)
            setMessage('Account created. Check your email to confirm your account before signing in.');
        else {
            setMessage('You are signed in. Cloud data operations must be configured before local prompts are synchronized.');
            onToast('Authentication succeeded.');
        }
    };
    return <div className="auth-page"><div className="auth-card"><Link to="/" className="brand-mark auth-brand"><span className="brand-icon"><Command size={20}/></span><span className="brand-word">prompt<span>lab</span><sup>{localized("\u2733")}</sup></span></Link><span className="auth-icon"><ShieldCheck size={22}/></span><h1>{localized(mode === 'signin' ? 'Welcome back.' : 'Create your account.')}</h1><p>{localized(mode === 'signin' ? 'Sign in to access your cloud workspace.' : 'Set up an optional account for cloud features.')}</p><div className="auth-mode-toggle"><button className={mode === 'signin' ? 'selected' : ''} onClick={() => { setMode('signin'); setMessage(''); }}>{localized("Sign in")}</button><button className={mode === 'signup' ? 'selected' : ''} onClick={() => { setMode('signup'); setMessage(''); }}>{localized("Create account")}</button></div><form onSubmit={submit} className="auth-form"><label className="field-label">{localized("Email address")}<input className="text-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={localized("you@example.com")} required/></label><label className="field-label">{localized("Password")}<input className="text-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} placeholder={localized("At least 8 characters")} required/></label>{message && <div className="auth-message" role="status">{localized(message)}</div>}<Button type="submit" variant="primary" className="auth-submit" disabled={loading}>{localized(loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account')} <ArrowRight size={15}/></Button></form><div className="auth-footnote"><ShieldCheck size={14}/>{localized(" Your local prompts remain available without signing in.")}</div><Link to="/" className="auth-back"><ArrowLeft size={13}/>{localized(" Back to workspace")}</Link></div><div className="auth-side-note"><span className="auth-side-spark">{localized("\u2733")}</span><h2>{localized("Your thinking,")}<br />{localized("beautifully organized.")}</h2><p>{localized("A calm, focused space for the instructions you come back to.")}</p><div className="auth-side-pills"><span><Check size={12}/>{localized(" Local-first")}</span><span><Check size={12}/>{localized(" No paid API")}</span><span><Check size={12}/>{localized(" Your workflow")}</span></div></div></div>;
}
function NotFound() { return <div className="page-content"><EmptyState icon={<CircleHelp size={22}/>} title={localized("This page wandered off")} text={localized("That address does not match a PromptLab page.")} action={<Link to="/" className="button button-primary"><ArrowLeft size={14}/>{localized(" Back to overview")}</Link>}/></div>; }
function Modal({ title, description, children, onClose }: {
    title: string;
    description: string;
    children: ReactNode;
    onClose: () => void;
}) {
    useEffect(() => {
        const listener = (e: KeyboardEvent) => {
            if (e.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', listener);
        return () => window.removeEventListener('keydown', listener);
    }, [onClose]);
    return <div className="modal-backdrop" onMouseDown={(e) => {
            if (e.target === e.currentTarget)
                onClose();
        }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><h2 id="modal-title">{title}</h2><p>{description}</p></div><button className="icon-button" aria-label={localized("Close dialog")} onClick={onClose}><X size={17}/></button></div>{children}</section></div>;
}
