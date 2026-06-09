import { useState, useRef, useEffect } from 'react';
import {
  Building2, Plus, Trash2, Pencil, ChevronRight, ExternalLink, Copy,
  Users, Clock, CheckCircle2, BarChart3, Home, Download, Upload,
  Search, MessageSquare, X, Menu, LogOut, Bell,
  FileSpreadsheet, TrendingUp, LayoutGrid, Moon, Sun,
} from 'lucide-react';
import { AppData, Company, Contact, ContactStatus, PipelineStage, ActivityNote, DEFAULT_TAGS } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import {
  addCompany, updateCompany, deleteCompany,
  addContact, updateContact, updateContactStatus, updateContactPipelineStage,
  deleteContact, addTag, deleteTag, addActivityNote, deleteActivityNote,
  addReminder, completeReminder, deleteReminder,
  getStats, getCompanyStats, exportData, importData, getInitialData,
  importCSV, CSVRow,
} from './store';
import { Toast } from './components/Toast';
import { StatusBadge } from './components/StatusBadge';
import { StatusDropdown } from './components/StatusDropdown';
import { Modal } from './components/Modal';
import { KanbanBoard } from './components/KanbanBoard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ActivityLog } from './components/ActivityLog';
import { CSVImport } from './components/CSVImport';
import { TagManager, TagBadges } from './components/TagManager';
import { ReminderPanel, FollowUpToday } from './components/ReminderPanel';
import {
  fetchAllFromSupabase,
  syncAddCompany,
  syncUpdateCompany,
  syncDeleteCompany,
  syncAddContact,
  syncUpdateContact,
  syncUpdateContactStatus,
  syncUpdatePipelineStage,
  syncDeleteContact,
  syncBulkUpload,
  syncAddTag,
  syncDeleteTag,
  syncAddActivityNote,
  syncDeleteActivityNote,
  syncAddReminder,
  syncCompleteReminder,
  syncDeleteReminder,
} from './lib/supabaseSync';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';

type View =
  | { type: 'dashboard' }
  | { type: 'company'; companyId: string }
  | { type: 'kanban' }
  | { type: 'analytics' }
  | { type: 'reminders' };

function DatabaseSyncBadge({ status }: { status: 'syncing' | 'synced' | 'local' }) {
  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20 animate-pulse dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="hidden sm:inline">Syncing</span>
      </div>
    );
  }
  if (status === 'synced') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="hidden sm:inline">Synced</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-500/10 text-surface-400 text-xs font-semibold border border-surface-500/20 dark:bg-surface-500/10 dark:text-surface-400 dark:border-surface-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-surface-400" />
      <span className="hidden sm:inline">Local</span>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useLocalStorage<AppData>('linktrack-data', getInitialData());
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'local'>('syncing');
  const [theme, toggleTheme] = useTheme();

  const showToast = (message: string) => setToast({ message, visible: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const currentUserId = user.id;
    async function loadData() {
      try {
        setSyncStatus('syncing');
        const remoteData = await fetchAllFromSupabase();
        if (remoteData && remoteData.companies.length > 0) {
          setData(remoteData);
          setSyncStatus('synced');
        } else {
          const localItem = window.localStorage.getItem('linktrack-data');
          if (localItem) {
            const localData = JSON.parse(localItem) as AppData;
            if (localData && localData.companies && localData.companies.length > 0) {
              setSyncStatus('syncing');
              await syncBulkUpload(localData, currentUserId);
              setSyncStatus('synced');
              showToast('Synced local data to cloud');
            } else {
              setSyncStatus('synced');
            }
          } else {
            setSyncStatus('synced');
          }
        }
      } catch (err) {
        console.error('Supabase connection failed:', err);
        setSyncStatus('local');
        showToast('Running in offline mode');
      }
    }
    loadData();
  }, [user]);

  useEffect(() => {
    if (!data.tags) {
      setData(prev => ({ ...prev, tags: DEFAULT_TAGS, activityNotes: prev.activityNotes || [], reminders: prev.reminders || [] }));
    }
  }, []);

  const [companyModal, setCompanyModal] = useState<{ open: boolean; editId: string | null; name: string }>({
    open: false, editId: null, name: '',
  });
  const [contactModal, setContactModal] = useState<{
    open: boolean; editContact: Contact | null;
    name: string; title: string; linkedinUrl: string; draftMessage: string; tags: string[]; pipelineStage: PipelineStage;
  }>({
    open: false, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '', tags: [], pipelineStage: 'cold_email',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'company' | 'contact'; id: string; parentId?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [contactDetailId, setContactDetailId] = useState<{ companyId: string; contactId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCompany = view.type === 'company' ? data.companies.find(c => c.id === view.companyId) : null;

  const openAddCompany = () => setCompanyModal({ open: true, editId: null, name: '' });
  const openEditCompany = (c: Company) => setCompanyModal({ open: true, editId: c.id, name: c.name });

  const saveCompany = async () => {
    if (!companyModal.name.trim() || !user) return;
    if (companyModal.editId) {
      setData(updateCompany(data, companyModal.editId, companyModal.name));
      setCompanyModal({ open: false, editId: null, name: '' });
      await syncUpdateCompany(companyModal.editId, companyModal.name);
    } else {
      const newData = addCompany(data, companyModal.name);
      setData(newData);
      const newCompany = newData.companies[newData.companies.length - 1];
      setView({ type: 'company', companyId: newCompany.id });
      setCompanyModal({ open: false, editId: null, name: '' });
      await syncAddCompany(newCompany, user.id);
    }
  };

  const confirmDeleteCompany = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'company') return;
    const targetId = deleteConfirm.id;
    setData(deleteCompany(data, targetId));
    if (view.type === 'company' && view.companyId === targetId) {
      setView({ type: 'dashboard' });
    }
    setDeleteConfirm(null);
    await syncDeleteCompany(targetId);
  };

  const openAddContact = () => setContactModal({
    open: true, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '', tags: [], pipelineStage: 'cold_email',
  });
  const openEditContact = (c: Contact) => setContactModal({
    open: true, editContact: c, name: c.name, title: c.title, linkedinUrl: c.linkedinUrl,
    draftMessage: c.draftMessage, tags: c.tags || [], pipelineStage: c.pipelineStage || 'cold_email',
  });

  const saveContact = async () => {
    if (!contactModal.name.trim() || !selectedCompany) return;
    const compId = selectedCompany.id;
    if (contactModal.editContact) {
      const contactId = contactModal.editContact.id;
      setData(updateContact(data, compId, contactId, {
        name: contactModal.name, title: contactModal.title,
        linkedinUrl: contactModal.linkedinUrl, draftMessage: contactModal.draftMessage,
        tags: contactModal.tags, pipelineStage: contactModal.pipelineStage,
      }));
      setContactModal({ open: false, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '', tags: [], pipelineStage: 'cold_email' });
      await syncUpdateContact(contactId, {
        name: contactModal.name, title: contactModal.title,
        linkedinUrl: contactModal.linkedinUrl, draftMessage: contactModal.draftMessage,
        tags: contactModal.tags, pipelineStage: contactModal.pipelineStage,
      });
    } else {
      const newData = addContact(data, compId, {
        name: contactModal.name, title: contactModal.title,
        linkedinUrl: contactModal.linkedinUrl, draftMessage: contactModal.draftMessage,
        tags: contactModal.tags, pipelineStage: contactModal.pipelineStage,
      });
      setData(newData);
      setContactModal({ open: false, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '', tags: [], pipelineStage: 'cold_email' });
      const updatedCompany = newData.companies.find(c => c.id === compId);
      const newContact = updatedCompany?.contacts[updatedCompany.contacts.length - 1];
      if (newContact) {
        await syncAddContact(compId, newContact);
      }
    }
  };

  const confirmDeleteContact = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'contact' || !deleteConfirm.parentId) return;
    const targetId = deleteConfirm.id;
    const parentId = deleteConfirm.parentId;
    setData(deleteContact(data, parentId, targetId));
    setDeleteConfirm(null);
    await syncDeleteContact(targetId);
  };

  const changeStatus = async (companyId: string, contactId: string, status: ContactStatus) => {
    const updatedData = updateContactStatus(data, companyId, contactId, status);
    setData(updatedData);
    if (status === 'accepted') showToast('Connection accepted!');
    const company = updatedData.companies.find(c => c.id === companyId);
    const contact = company?.contacts.find(ct => ct.id === contactId);
    await syncUpdateContactStatus(contactId, status, contact?.acceptedAt || null);
  };

  const changePipelineStage = async (companyId: string, contactId: string, stage: PipelineStage) => {
    const updatedData = updateContactPipelineStage(data, companyId, contactId, stage);
    setData(updatedData);
    await syncUpdatePipelineStage(contactId, stage);
  };

  const handleAddTag = async (name: string, color: string) => {
    const newData = addTag(data, name, color);
    setData(newData);
    if (user) {
      const newTag = newData.tags[newData.tags.length - 1];
      await syncAddTag(newTag, user.id);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setData(deleteTag(data, tagId));
    await syncDeleteTag(tagId);
  };

  const handleAddActivityNote = async (contactId: string, text: string, type: ActivityNote['type']) => {
    const newData = addActivityNote(data, contactId, text, type);
    setData(newData);
    if (user) {
      const newNote = newData.activityNotes[0];
      await syncAddActivityNote(newNote, user.id);
    }
  };

  const handleDeleteActivityNote = async (noteId: string) => {
    setData(deleteActivityNote(data, noteId));
    await syncDeleteActivityNote(noteId);
  };

  const handleAddReminder = async (contactId: string, dueDate: string, note: string) => {
    const newData = addReminder(data, contactId, dueDate, note);
    setData(newData);
    if (user) {
      const newReminder = newData.reminders[newData.reminders.length - 1];
      await syncAddReminder(newReminder, user.id);
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    setData(completeReminder(data, reminderId));
    await syncCompleteReminder(reminderId);
    showToast('Reminder completed!');
  };

  const handleDeleteReminder = async (reminderId: string) => {
    setData(deleteReminder(data, reminderId));
    await syncDeleteReminder(reminderId);
  };

  const handleCSVImport = (rows: CSVRow[]) => {
    const newData = importCSV(data, rows, data.tags || DEFAULT_TAGS);
    setData(newData);
    setCsvModalOpen(false);
    showToast(`Imported ${rows.length} contacts successfully`);
  };

  const copyMessage = async (msg: string) => {
    try {
      await navigator.clipboard.writeText(msg);
      showToast('Message copied to clipboard');
    } catch {
      showToast('Failed to copy');
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportData(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linktrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importData(ev.target?.result as string);
      if (result) {
        setData(result);
        setView({ type: 'dashboard' });
        showToast('Data imported successfully');
      } else {
        showToast('Invalid file format');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const stats = getStats(data);

  const filteredContacts = selectedCompany
    ? selectedCompany.contacts.filter(c => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
      })
    : [];

  const overdueCount = (data.reminders || []).filter(r =>
    !r.completed && new Date(r.dueDate) < new Date()
  ).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <span className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin block" />
            <div className="absolute inset-0 w-10 h-10 rounded-full bg-brand-500/10 blur-xl" />
          </div>
          <p className="text-sm text-surface-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-surface-950' : 'bg-surface-50'}`}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${
        theme === 'dark'
          ? 'bg-surface-900/95 backdrop-blur-xl border-r border-white/[0.06]'
          : 'bg-white/90 backdrop-blur-xl border-r border-surface-200/80'
      }`}>
        <div className={`px-5 py-5 border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-200/60'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
                <Users size={16} className="text-white" />
              </div>
              <span className={`font-bold text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>LinkTrack</span>
            </div>
            <button className="lg:hidden text-surface-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-3 py-3 space-y-0.5">
          <NavButton
            active={view.type === 'dashboard'}
            icon={<Home size={16} />}
            label="Dashboard"
            theme={theme}
            onClick={() => { setView({ type: 'dashboard' }); setSidebarOpen(false); }}
          />
          <NavButton
            active={view.type === 'kanban'}
            icon={<LayoutGrid size={16} />}
            label="Pipeline"
            theme={theme}
            onClick={() => { setView({ type: 'kanban' }); setSidebarOpen(false); }}
          />
          <NavButton
            active={view.type === 'analytics'}
            icon={<TrendingUp size={16} />}
            label="Analytics"
            theme={theme}
            onClick={() => { setView({ type: 'analytics' }); setSidebarOpen(false); }}
          />
          <NavButton
            active={view.type === 'reminders'}
            icon={<Bell size={16} />}
            label="Reminders"
            badge={overdueCount > 0 ? overdueCount : undefined}
            theme={theme}
            onClick={() => { setView({ type: 'reminders' }); setSidebarOpen(false); }}
          />
        </div>

        <div className="px-4 py-2 mt-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-surface-500' : 'text-surface-400'}`}>Companies</span>
            <button onClick={openAddCompany} className="p-1 rounded-lg hover:bg-brand-500/10 text-surface-500 hover:text-brand-400 transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {data.companies.length === 0 && (
            <p className={`px-3 py-6 text-xs text-center ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>No companies yet</p>
          )}
          {data.companies.map(c => {
            const cs = getCompanyStats(c);
            const isActive = view.type === 'company' && view.companyId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setView({ type: 'company', companyId: c.id }); setSearchQuery(''); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-brand-500/10 text-white border border-brand-500/20'
                      : 'bg-brand-50 text-brand-700 border border-brand-200/60'
                    : theme === 'dark'
                      ? 'text-surface-400 hover:text-surface-200 hover:bg-white/[0.04]'
                      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100/80'
                }`}
              >
                <Building2 size={15} className={isActive ? 'text-brand-400' : theme === 'dark' ? 'text-surface-600 group-hover:text-surface-400' : 'text-surface-400 group-hover:text-surface-600'} />
                <span className="flex-1 text-left truncate font-medium">{c.name}</span>
                <span className={`text-xs tabular-nums ${isActive ? (theme === 'dark' ? 'text-brand-300' : 'text-brand-500') : 'text-surface-500'}`}>
                  {cs.accepted}/{cs.total}
                </span>
              </button>
            );
          })}
        </nav>

        <div className={`px-3 py-3 border-t space-y-1 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-200/60'}`}>
          <button onClick={() => setCsvModalOpen(true)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${theme === 'dark' ? 'text-surface-500 hover:text-surface-300 hover:bg-white/[0.04]' : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100'}`}>
            <FileSpreadsheet size={15} /> CSV Import
          </button>
          <button onClick={handleExport} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${theme === 'dark' ? 'text-surface-500 hover:text-surface-300 hover:bg-white/[0.04]' : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100'}`}>
            <Download size={15} /> Export Data
          </button>
          <button onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${theme === 'dark' ? 'text-surface-500 hover:text-surface-300 hover:bg-white/[0.04]' : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100'}`}>
            <Upload size={15} /> Import JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

          <div className={`pt-2 border-t mt-2 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-200/60'}`}>
            <div className={`px-3 py-1.5 text-xs truncate ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>
              {user.email}
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setData(getInitialData());
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className={`sticky top-0 z-20 backdrop-blur-xl border-b ${
          theme === 'dark'
            ? 'bg-surface-950/80 border-white/[0.06]'
            : 'bg-white/80 border-surface-200/60'
        }`}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button className={`lg:hidden p-2 -ml-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/[0.06] text-surface-400' : 'hover:bg-surface-100 text-surface-500'}`} onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              {view.type === 'dashboard' && <h1 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Dashboard</h1>}
              {view.type === 'kanban' && <h1 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Pipeline</h1>}
              {view.type === 'analytics' && <h1 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Analytics</h1>}
              {view.type === 'reminders' && <h1 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Reminders</h1>}
              {selectedCompany && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h1 className={`text-lg font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{selectedCompany.name}</h1>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button onClick={() => openEditCompany(selectedCompany)} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/[0.06] text-surface-400 hover:text-surface-200' : 'hover:bg-surface-100 text-surface-400 hover:text-surface-600'}`}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ type: 'company', id: selectedCompany.id })} className="p-2 rounded-lg hover:bg-rose-500/10 text-surface-400 hover:text-rose-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  theme === 'dark'
                    ? 'hover:bg-white/[0.06] text-surface-400 hover:text-brand-400'
                    : 'hover:bg-surface-100 text-surface-500 hover:text-brand-600'
                }`}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <DatabaseSyncBadge status={syncStatus} />
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {view.type === 'dashboard' && (
            <DashboardView
              data={data}
              stats={stats}
              theme={theme}
              onSelectCompany={id => setView({ type: 'company', companyId: id })}
              onCopyMessage={copyMessage}
              onChangeStatus={changeStatus}
              onCompleteReminder={handleCompleteReminder}
            />
          )}
          {view.type === 'kanban' && (
            <KanbanBoard
              companies={data.companies}
              tags={data.tags || DEFAULT_TAGS}
              theme={theme}
              onMoveContact={changePipelineStage}
              onSelectContact={(companyId, contactId) => setContactDetailId({ companyId, contactId })}
            />
          )}
          {view.type === 'analytics' && (
            <AnalyticsDashboard data={data} theme={theme} />
          )}
          {view.type === 'reminders' && (
            <RemindersView
              data={data}
              theme={theme}
              onCompleteReminder={handleCompleteReminder}
              onDeleteReminder={handleDeleteReminder}
            />
          )}
          {selectedCompany && (
            <CompanyView
              company={selectedCompany}
              data={data}
              theme={theme}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filteredContacts={filteredContacts}
              onAddContact={openAddContact}
              onEditContact={openEditContact}
              onDeleteContact={(contactId) => setDeleteConfirm({ type: 'contact', id: contactId, parentId: selectedCompany.id })}
              onChangeStatus={(contactId, status) => changeStatus(selectedCompany.id, contactId, status)}
              onCopyMessage={copyMessage}
              onSelectContact={(contactId) => setContactDetailId({ companyId: selectedCompany.id, contactId })}
            />
          )}
        </div>
      </main>

      {/* Contact Detail Drawer */}
      {contactDetailId && (
        <ContactDetailDrawer
          companyId={contactDetailId.companyId}
          contactId={contactDetailId.contactId}
          data={data}
          theme={theme}
          onClose={() => setContactDetailId(null)}
          onAddNote={handleAddActivityNote}
          onDeleteNote={handleDeleteActivityNote}
          onAddReminder={handleAddReminder}
          onCompleteReminder={handleCompleteReminder}
          onDeleteReminder={handleDeleteReminder}
        />
      )}

      {/* Modals */}
      <Modal
        open={companyModal.open}
        onClose={() => setCompanyModal({ open: false, editId: null, name: '' })}
        title={companyModal.editId ? 'Edit Company' : 'Add Company'}
        theme={theme}
      >
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>Company Name</label>
            <input
              type="text"
              value={companyModal.name}
              onChange={e => setCompanyModal(m => ({ ...m, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && saveCompany()}
              placeholder="e.g. Google, Stripe, Figma..."
              className={theme === 'dark' ? 'input-premium' : 'input-premium-light'}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setCompanyModal({ open: false, editId: null, name: '' })} className={theme === 'dark' ? 'btn-secondary' : 'btn-secondary-light'}>
              Cancel
            </button>
            <button onClick={saveCompany} disabled={!companyModal.name.trim()} className="btn-primary">
              {companyModal.editId ? 'Save' : 'Add Company'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={contactModal.open}
        onClose={() => setContactModal({ open: false, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '', tags: [], pipelineStage: 'cold_email' })}
        title={contactModal.editContact ? 'Edit Contact' : 'Add Contact'}
        theme={theme}
      >
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>Name</label>
            <input
              type="text"
              value={contactModal.name}
              onChange={e => setContactModal(m => ({ ...m, name: e.target.value }))}
              placeholder="Full name"
              className={theme === 'dark' ? 'input-premium' : 'input-premium-light'}
              autoFocus
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>Job Title</label>
            <input
              type="text"
              value={contactModal.title}
              onChange={e => setContactModal(m => ({ ...m, title: e.target.value }))}
              placeholder="e.g. Senior Engineer, Product Manager..."
              className={theme === 'dark' ? 'input-premium' : 'input-premium-light'}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>LinkedIn Profile URL</label>
            <input
              type="url"
              value={contactModal.linkedinUrl}
              onChange={e => setContactModal(m => ({ ...m, linkedinUrl: e.target.value }))}
              placeholder="https://linkedin.com/in/..."
              className={theme === 'dark' ? 'input-premium' : 'input-premium-light'}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>Pipeline Stage</label>
            <select
              value={contactModal.pipelineStage}
              onChange={e => setContactModal(m => ({ ...m, pipelineStage: e.target.value as PipelineStage }))}
              className={theme === 'dark' ? 'input-premium' : 'input-premium-light'}
            >
              <option value="cold_email">Cold Email</option>
              <option value="applied">Applied</option>
              <option value="phone_screen">Phone Screen</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>Tags</label>
            <TagManager
              tags={data.tags || DEFAULT_TAGS}
              selectedTags={contactModal.tags}
              theme={theme}
              onToggleTag={(tagId) => {
                setContactModal(m => ({
                  ...m,
                  tags: m.tags.includes(tagId) ? m.tags.filter(t => t !== tagId) : [...m.tags, tagId],
                }));
              }}
              onAddTag={handleAddTag}
              onDeleteTag={handleDeleteTag}
              compact
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>Draft Outreach Message</label>
            <textarea
              value={contactModal.draftMessage}
              onChange={e => setContactModal(m => ({ ...m, draftMessage: e.target.value }))}
              placeholder="Write your cold outreach message here..."
              rows={4}
              className={`resize-none ${theme === 'dark' ? 'input-premium' : 'input-premium-light'}`}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setContactModal({ open: false, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '', tags: [], pipelineStage: 'cold_email' })} className={theme === 'dark' ? 'btn-secondary' : 'btn-secondary-light'}>
              Cancel
            </button>
            <button onClick={saveContact} disabled={!contactModal.name.trim()} className="btn-primary">
              {contactModal.editContact ? 'Save' : 'Add Contact'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={csvModalOpen} onClose={() => setCsvModalOpen(false)} title="Import from CSV" theme={theme}>
        <CSVImport onImport={handleCSVImport} onClose={() => setCsvModalOpen(false)} theme={theme} />
      </Modal>

      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
        theme={theme}
      >
        <div className="space-y-4">
          <p className={`text-sm ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>
            {deleteConfirm?.type === 'company'
              ? 'Delete this company and all its contacts? This cannot be undone.'
              : 'Delete this contact? This cannot be undone.'}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setDeleteConfirm(null)} className={theme === 'dark' ? 'btn-secondary' : 'btn-secondary-light'}>
              Cancel
            </button>
            <button
              onClick={deleteConfirm?.type === 'company' ? confirmDeleteCompany : confirmDeleteContact}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-500 hover:to-rose-400 transition-all active:scale-[0.98]"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast.message} visible={toast.visible} theme={theme} onClose={() => setToast({ message: '', visible: false })} />
    </div>
  );
}

function NavButton({ active, icon, label, badge, theme, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; badge?: number; theme: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? theme === 'dark'
            ? 'bg-gradient-to-r from-brand-500/15 to-violet-500/10 text-white border border-brand-500/20 shadow-glow-brand'
            : 'bg-brand-50 text-brand-700 border border-brand-200/60'
          : theme === 'dark'
            ? 'text-surface-400 hover:text-surface-200 hover:bg-white/[0.04]'
            : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
      }`}
    >
      <span className={active ? 'text-brand-400' : ''}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold min-w-[18px] text-center shadow-lg shadow-rose-500/30">
          {badge}
        </span>
      )}
    </button>
  );
}

// Contact Detail Drawer
function ContactDetailDrawer({ companyId, contactId, data, theme, onClose, onAddNote, onDeleteNote, onAddReminder, onCompleteReminder, onDeleteReminder }: {
  companyId: string; contactId: string; data: AppData; theme: string; onClose: () => void;
  onAddNote: (contactId: string, text: string, type: ActivityNote['type']) => void;
  onDeleteNote: (noteId: string) => void;
  onAddReminder: (contactId: string, dueDate: string, note: string) => void;
  onCompleteReminder: (reminderId: string) => void;
  onDeleteReminder: (reminderId: string) => void;
}) {
  const company = data.companies.find(c => c.id === companyId);
  const contact = company?.contacts.find(c => c.id === contactId);

  if (!contact || !company) return null;

  const contactReminders = (data.reminders || []).filter(r => r.contactId === contactId);
  const contactNotes = (data.activityNotes || []).filter(n => n.contactId === contactId);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 w-full max-w-md shadow-2xl z-50 flex flex-col animate-in overflow-hidden ${
        theme === 'dark'
          ? 'bg-surface-900 border-l border-white/[0.06]'
          : 'bg-white border-l border-surface-200/60'
      }`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-200/60'}`}>
          <div className="min-w-0">
            <h2 className={`text-lg font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{contact.name}</h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>{contact.title} at {company.name}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors shrink-0 ${theme === 'dark' ? 'hover:bg-white/[0.06] text-surface-400 hover:text-white' : 'hover:bg-surface-100 text-surface-400 hover:text-surface-600'}`}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {contact.linkedinUrl && (
            <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors">
              <ExternalLink size={14} /> LinkedIn Profile
            </a>
          )}

          {contact.tags && contact.tags.length > 0 && (
            <TagBadges tags={contact.tags} allTags={data.tags || DEFAULT_TAGS} />
          )}

          <div className={`border-t pt-4 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-200/60'}`}>
            <ReminderPanel
              reminders={contactReminders}
              companies={data.companies}
              contactId={contactId}
              theme={theme}
              onAddReminder={onAddReminder}
              onCompleteReminder={onCompleteReminder}
              onDeleteReminder={onDeleteReminder}
            />
          </div>

          <div className={`border-t pt-4 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-200/60'}`}>
            <ActivityLog
              contactId={contactId}
              notes={contactNotes}
              theme={theme}
              onAddNote={onAddNote}
              onDeleteNote={onDeleteNote}
            />
          </div>

          {contact.draftMessage && (
            <div className={`border-t pt-4 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-200/60'}`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-600'}`}>Draft Message</h4>
              <div className={`rounded-lg p-3 text-xs whitespace-pre-wrap ${theme === 'dark' ? 'bg-white/[0.03] text-surface-300 border border-white/[0.06]' : 'bg-surface-50 text-surface-700 border border-surface-200/60'}`}>
                {contact.draftMessage}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Reminders View
function RemindersView({ data, theme, onCompleteReminder, onDeleteReminder }: {
  data: AppData;
  theme: string;
  onCompleteReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}) {
  const reminders = data.reminders || [];
  const active = reminders.filter(r => !r.completed);
  const completed = reminders.filter(r => r.completed);
  const now = new Date();

  const overdue = active.filter(r => new Date(r.dueDate) < now);
  const upcoming = active.filter(r => new Date(r.dueDate) >= now);

  const getContactInfo = (contactId: string) => {
    for (const company of data.companies) {
      const contact = company.contacts.find(c => c.id === contactId);
      if (contact) return { name: contact.name, company: company.name, title: contact.title };
    }
    return { name: 'Unknown', company: '', title: '' };
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {active.length === 0 && completed.length === 0 && (
        <div className="text-center py-16">
          <Bell size={40} className={`mx-auto mb-3 ${theme === 'dark' ? 'text-surface-700' : 'text-surface-300'}`} />
          <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>No reminders yet</p>
          <p className={`text-xs ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>Open a contact to set follow-up reminders</p>
        </div>
      )}

      {overdue.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Overdue ({overdue.length})
          </h2>
          <div className="space-y-2">
            {overdue.map(r => {
              const info = getContactInfo(r.contactId);
              return (
                <ReminderCard key={r.id} reminder={r} info={info} formatDate={formatDate} isOverdue theme={theme} onComplete={onCompleteReminder} onDelete={onDeleteReminder} />
              );
            })}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Upcoming ({upcoming.length})</h2>
          <div className="space-y-2">
            {upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(r => {
              const info = getContactInfo(r.contactId);
              return (
                <ReminderCard key={r.id} reminder={r} info={info} formatDate={formatDate} isOverdue={false} theme={theme} onComplete={onCompleteReminder} onDelete={onDeleteReminder} />
              );
            })}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-500'}`}>Completed ({completed.length})</h2>
          <div className="space-y-2 opacity-60">
            {completed.slice(0, 10).map(r => {
              const info = getContactInfo(r.contactId);
              return (
                <div key={r.id} className={`flex items-center gap-3 rounded-xl border p-3 ${
                  theme === 'dark' ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-surface-200/60'
                }`}>
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium line-through ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>{info.name}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>{r.note || 'Follow up'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function ReminderCard({ reminder, info, formatDate, isOverdue, theme, onComplete, onDelete }: {
  reminder: any; info: { name: string; company: string; title: string };
  formatDate: (d: string) => string; isOverdue: boolean; theme: string;
  onComplete: (id: string) => void; onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-lg ${
      isOverdue
        ? theme === 'dark'
          ? 'border-rose-500/30 bg-rose-500/5'
          : 'border-rose-200 bg-rose-50/50'
        : theme === 'dark'
          ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
          : 'border-surface-200/60 bg-white hover:shadow-elevated'
    }`}>
      <button
        onClick={() => onComplete(reminder.id)}
        className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all hover:bg-emerald-500 hover:border-emerald-500 hover:text-white ${
          isOverdue ? 'border-rose-400/60' : theme === 'dark' ? 'border-surface-600' : 'border-surface-300'
        }`}
      >
        <CheckCircle2 size={12} className="opacity-0 hover:opacity-100" />
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-surface-800'}`}>{info.name}</p>
        <p className={`text-xs ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>{info.company}{info.title ? ` - ${info.title}` : ''}</p>
        {reminder.note && <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-600'}`}>{reminder.note}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className={`text-xs font-medium ${isOverdue ? 'text-rose-400' : theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>
          {formatDate(reminder.dueDate)}
        </p>
      </div>
      <button onClick={() => onDelete(reminder.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-surface-500 hover:text-rose-400 transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// --- Dashboard View ---

function DashboardView({
  data, stats, theme, onSelectCompany, onCopyMessage, onChangeStatus, onCompleteReminder,
}: {
  data: AppData;
  stats: ReturnType<typeof getStats>;
  theme: string;
  onSelectCompany: (id: string) => void;
  onCopyMessage: (msg: string) => void;
  onChangeStatus: (companyId: string, contactId: string, status: ContactStatus) => void;
  onCompleteReminder: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchedCompanies = normalizedQuery
    ? data.companies.filter(c => c.name.toLowerCase().includes(normalizedQuery))
    : [];

  const matchedContacts = normalizedQuery
    ? data.companies.flatMap(c =>
        c.contacts
          .filter(ct => ct.name.toLowerCase().includes(normalizedQuery) || ct.title.toLowerCase().includes(normalizedQuery))
          .map(ct => ({ ...ct, companyId: c.id, companyName: c.name }))
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative w-full max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search companies, contacts, or job titles..."
          className={`w-full pl-11 pr-10 py-3 rounded-xl text-sm transition-all ${
            theme === 'dark'
              ? 'bg-white/[0.04] border border-white/[0.08] text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50'
              : 'bg-white border border-surface-200 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm'
          }`}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/[0.06] text-surface-400 hover:text-surface-200 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {normalizedQuery ? (
        <SearchResults
          matchedCompanies={matchedCompanies}
          matchedContacts={matchedContacts}
          searchQuery={searchQuery}
          theme={theme}
          onSelectCompany={onSelectCompany}
          onChangeStatus={onChangeStatus}
          onCopyMessage={onCopyMessage}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={<Users size={20} />} label="Total Contacts" value={stats.total} color="brand" theme={theme} />
            <StatCard icon={<Clock size={20} />} label="Pending" value={stats.pending} color="amber" theme={theme} />
            <StatCard icon={<CheckCircle2 size={20} />} label="Accepted" value={stats.accepted} color="emerald" theme={theme} />
            <StatCard icon={<BarChart3 size={20} />} label="Acceptance Rate" value={`${stats.acceptanceRate}%`} color="violet" theme={theme} />
          </div>

          {/* Follow Up Today */}
          <FollowUpToday
            reminders={data.reminders || []}
            companies={data.companies}
            theme={theme}
            onCompleteReminder={onCompleteReminder}
          />

          {/* Ready to message */}
          {stats.readyToMessage.length > 0 && (
            <section>
              <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>
                <MessageSquare size={15} className="text-brand-400" />
                Ready to Message ({stats.readyToMessage.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.readyToMessage.slice(0, 6).map(c => {
                  const parent = data.companies.find(co => co.contacts.some(ct => ct.id === c.id));
                  return (
                    <div key={c.id} className={`rounded-xl border p-4 transition-all hover:shadow-lg ${
                      theme === 'dark'
                        ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-brand-500/20'
                        : 'bg-white border-surface-200/60 hover:shadow-elevated hover:border-brand-200'
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{c.name}</p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>{c.title} at {parent?.name}</p>
                        </div>
                        <button
                          onClick={() => onCopyMessage(c.draftMessage)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 text-xs font-semibold hover:bg-brand-500/20 transition-colors"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                      <p className={`text-xs line-clamp-2 mt-2 whitespace-pre-wrap ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>{c.draftMessage}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Companies */}
          <section>
            <h2 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Companies</h2>
            {data.companies.length === 0 ? (
              <div className="text-center py-16">
                <Building2 size={40} className={`mx-auto mb-3 ${theme === 'dark' ? 'text-surface-700' : 'text-surface-300'}`} />
                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>No companies yet</p>
                <p className={`text-xs ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>Add a company from the sidebar to start tracking</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.companies.map(c => {
                  const cs = getCompanyStats(c);
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelectCompany(c.id)}
                      className={`rounded-xl border p-4 text-left transition-all group ${
                        theme === 'dark'
                          ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-brand-500/20 hover:shadow-glow-brand'
                          : 'bg-white border-surface-200/60 hover:shadow-elevated hover:border-brand-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-brand-500/10' : 'bg-brand-50'}`}>
                            <Building2 size={16} className="text-brand-400" />
                          </div>
                          <span className={`font-semibold text-sm group-hover:text-brand-400 transition-colors ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{c.name}</span>
                        </div>
                        <ChevronRight size={16} className={`group-hover:text-brand-400 transition-colors ${theme === 'dark' ? 'text-surface-600' : 'text-surface-300'}`} />
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-amber-400 font-medium">{cs.pending} pending</span>
                        <span className="text-emerald-400 font-medium">{cs.accepted} accepted</span>
                        {cs.declined > 0 && <span className="text-rose-400 font-medium">{cs.declined} declined</span>}
                      </div>
                      {cs.total > 0 && (
                        <div className={`mt-3 h-1.5 rounded-full overflow-hidden flex ${theme === 'dark' ? 'bg-white/[0.06]' : 'bg-surface-100'}`}>
                          <div className="bg-emerald-500 rounded-full" style={{ width: `${(cs.accepted / cs.total) * 100}%` }} />
                          <div className="bg-amber-400" style={{ width: `${(cs.pending / cs.total) * 100}%` }} />
                          <div className="bg-rose-400 rounded-full" style={{ width: `${(cs.declined / cs.total) * 100}%` }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SearchResults({ matchedCompanies, matchedContacts, searchQuery, theme, onSelectCompany, onChangeStatus, onCopyMessage }: {
  matchedCompanies: Company[];
  matchedContacts: (Contact & { companyId: string; companyName: string })[];
  searchQuery: string;
  theme: string;
  onSelectCompany: (id: string) => void;
  onChangeStatus: (companyId: string, contactId: string, status: ContactStatus) => void;
  onCopyMessage: (msg: string) => void;
}) {
  if (matchedCompanies.length === 0 && matchedContacts.length === 0) {
    return (
      <div className={`rounded-xl border p-8 text-center ${theme === 'dark' ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-surface-200/60'}`}>
        <Search size={32} className={`mx-auto mb-2 ${theme === 'dark' ? 'text-surface-600' : 'text-surface-300'}`} />
        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>No matches found</p>
        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Results for "{searchQuery}"</h2>

      {matchedCompanies.length > 0 && (
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-500'}`}>Companies ({matchedCompanies.length})</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matchedCompanies.map(c => (
              <button key={c.id} onClick={() => onSelectCompany(c.id)} className={`rounded-xl border p-4 text-left transition-all group w-full ${
                theme === 'dark'
                  ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-brand-500/20'
                  : 'bg-white border-surface-200/60 hover:shadow-elevated hover:border-brand-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-brand-500/10' : 'bg-brand-50'}`}>
                      <Building2 size={16} className="text-brand-400" />
                    </div>
                    <span className={`font-semibold text-sm group-hover:text-brand-400 transition-colors truncate ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{c.name}</span>
                  </div>
                  <ChevronRight size={16} className={`group-hover:text-brand-400 transition-colors shrink-0 ${theme === 'dark' ? 'text-surface-600' : 'text-surface-300'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {matchedContacts.length > 0 && (
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-500'}`}>Contacts ({matchedContacts.length})</h3>
          <div className="space-y-2">
            {matchedContacts.slice(0, 20).map(contact => (
              <div key={contact.id} className={`rounded-xl border p-4 transition-all ${
                theme === 'dark'
                  ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                  : 'bg-white border-surface-200/60 hover:shadow-elevated'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{contact.name}</h4>
                      <StatusBadge status={contact.status} theme={theme} />
                    </div>
                    <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>{contact.title} at {contact.companyName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusDropdown status={contact.status} theme={theme} onChange={s => onChangeStatus(contact.companyId, contact.id, s)} />
                    {contact.status === 'accepted' && contact.draftMessage && (
                      <button onClick={() => onCopyMessage(contact.draftMessage)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 text-xs font-semibold hover:bg-brand-500/20 transition-colors">
                        <Copy size={12} /> Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, theme }: { icon: React.ReactNode; label: string; value: string | number; color: string; theme: string }) {
  const darkColors: Record<string, string> = {
    brand: 'bg-brand-500/10 text-brand-400',
    amber: 'bg-amber-500/10 text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    violet: 'bg-violet-500/10 text-violet-400',
  };
  const lightColors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  const colors = theme === 'dark' ? darkColors : lightColors;
  return (
    <div className={`rounded-xl border p-4 transition-all hover:shadow-lg ${
      theme === 'dark'
        ? 'bg-white/[0.02] border-white/[0.06] hover:border-brand-500/20'
        : 'bg-white border-surface-200/60 hover:shadow-elevated'
    }`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{value}</p>
      <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>{label}</p>
    </div>
  );
}

// --- Company View ---

function CompanyView({
  company, data, theme, searchQuery, onSearchChange, filteredContacts,
  onAddContact, onEditContact, onDeleteContact, onChangeStatus, onCopyMessage, onSelectContact,
}: {
  company: Company; data: AppData; theme: string; searchQuery: string; onSearchChange: (q: string) => void; filteredContacts: Contact[];
  onAddContact: () => void; onEditContact: (c: Contact) => void; onDeleteContact: (id: string) => void;
  onChangeStatus: (contactId: string, status: ContactStatus) => void; onCopyMessage: (msg: string) => void;
  onSelectContact: (contactId: string) => void;
}) {
  const cs = getCompanyStats(company);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const allTags = data.tags || DEFAULT_TAGS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center gap-4 rounded-xl border px-4 py-2.5 text-xs flex-wrap ${
          theme === 'dark' ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-surface-200/60'
        }`}>
          <span className={theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}>{cs.total} total</span>
          <span className="text-amber-400 font-semibold">{cs.pending} pending</span>
          <span className="text-emerald-400 font-semibold">{cs.accepted} accepted</span>
          {cs.declined > 0 && <span className="text-rose-400 font-semibold">{cs.declined} declined</span>}
          {cs.noResponse > 0 && <span className="text-surface-400 font-semibold">{cs.noResponse} no response</span>}
        </div>
        <button
          onClick={onAddContact}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {company.contacts.length > 0 && (
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search contacts..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all ${
              theme === 'dark'
                ? 'bg-white/[0.04] border border-white/[0.08] text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50'
                : 'bg-white border border-surface-200 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
            }`}
          />
        </div>
      )}

      {company.contacts.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className={`mx-auto mb-3 ${theme === 'dark' ? 'text-surface-700' : 'text-surface-300'}`} />
          <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>No contacts yet</p>
          <p className={`text-xs ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>Add people you want to connect with at {company.name}</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <p className={`text-sm py-8 text-center ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>No contacts match your search</p>
      ) : (
        <div className="space-y-3">
          {filteredContacts.map(contact => {
            const isDraftExpanded = expandedDraft === contact.id;
            const isAccepted = contact.status === 'accepted';
            const hasDraft = contact.draftMessage.trim().length > 0;
            return (
              <div key={contact.id} className={`rounded-xl border transition-all group ${
                theme === 'dark'
                  ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-brand-500/20'
                  : 'bg-white border-surface-200/60 hover:shadow-elevated hover:border-brand-200'
              }`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelectContact(contact.id)}>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{contact.name}</h3>
                        <StatusBadge status={contact.status} theme={theme} />
                      </div>
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>{contact.title}</p>
                      {contact.linkedinUrl && (
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-1.5 transition-colors"
                        >
                          LinkedIn <ExternalLink size={10} />
                        </a>
                      )}
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="mt-2">
                          <TagBadges tags={contact.tags} allTags={allTags} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <StatusDropdown status={contact.status} theme={theme} onChange={s => onChangeStatus(contact.id, s)} />
                      <button onClick={() => onEditContact(contact)} className={`p-1.5 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 ${
                        theme === 'dark' ? 'hover:bg-white/[0.06] text-surface-500 hover:text-surface-200' : 'hover:bg-surface-100 text-surface-400 hover:text-surface-600'
                      }`}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDeleteContact(contact.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-surface-500 hover:text-rose-400 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {hasDraft && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedDraft(isDraftExpanded ? null : contact.id)}
                        className={`text-xs font-medium transition-colors ${theme === 'dark' ? 'text-brand-400 hover:text-brand-300' : 'text-brand-600 hover:text-brand-500'}`}
                      >
                        {isDraftExpanded ? 'Hide message' : 'Show message'}
                      </button>
                      {isDraftExpanded && (
                        <div className={`mt-2 rounded-lg p-3 text-xs whitespace-pre-wrap ${
                          theme === 'dark' ? 'bg-white/[0.03] text-surface-300 border border-white/[0.06]' : 'bg-surface-50 text-surface-700 border border-surface-200/60'
                        }`}>
                          {contact.draftMessage}
                          <button
                            onClick={() => onCopyMessage(contact.draftMessage)}
                            className="flex items-center gap-1 mt-2 text-brand-400 hover:text-brand-300 font-semibold transition-colors"
                          >
                            <Copy size={11} /> Copy message
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
