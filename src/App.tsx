import { useState, useRef, useEffect } from 'react';
import {
  Building2, Plus, Trash2, Pencil, ChevronRight, ExternalLink, Copy,
  Users, Clock, CheckCircle2, BarChart3, Home, Download, Upload,
  Search, MessageSquare, X, Menu,
} from 'lucide-react';
import { AppData, Company, Contact, ContactStatus } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  addCompany, updateCompany, deleteCompany,
  addContact, updateContact, updateContactStatus, deleteContact,
  getStats, getCompanyStats, exportData, importData, getInitialData,
} from './store';
import { Toast } from './components/Toast';
import { StatusBadge } from './components/StatusBadge';
import { StatusDropdown } from './components/StatusDropdown';
import { Modal } from './components/Modal';
import {
  fetchAllFromSupabase,
  syncAddCompany,
  syncUpdateCompany,
  syncDeleteCompany,
  syncAddContact,
  syncUpdateContact,
  syncUpdateContactStatus,
  syncDeleteContact,
  syncBulkUpload
} from './lib/supabaseSync';

type View = { type: 'dashboard' } | { type: 'company'; companyId: string };

function DatabaseSyncBadge({ status }: { status: 'syncing' | 'synced' | 'local' }) {
  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Syncing
      </div>
    );
  }
  if (status === 'synced') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Database
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200/60">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Local Cache
    </div>
  );
}

export default function App() {
  const [data, setData] = useLocalStorage<AppData>('linktrack-data', getInitialData());
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'local'>('syncing');

  const showToast = (message: string) => setToast({ message, visible: true });

  useEffect(() => {
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
              await syncBulkUpload(localData);
              setSyncStatus('synced');
              showToast('Synced local data to Supabase!');
            } else {
              setSyncStatus('synced');
            }
          } else {
            setSyncStatus('synced');
          }
        }
      } catch (err) {
        console.error('Supabase connection failed. Falling back to Local Storage.', err);
        setSyncStatus('local');
        showToast('Running in local caching mode (offline)');
      }
    }
    loadData();
  }, []);

  const [companyModal, setCompanyModal] = useState<{ open: boolean; editId: string | null; name: string }>({
    open: false, editId: null, name: '',
  });
  const [contactModal, setContactModal] = useState<{ open: boolean; editContact: Contact | null; name: string; title: string; linkedinUrl: string; draftMessage: string }>({
    open: false, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'company' | 'contact'; id: string; parentId?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCompany = view.type === 'company' ? data.companies.find(c => c.id === view.companyId) : null;

  const openAddCompany = () => setCompanyModal({ open: true, editId: null, name: '' });
  const openEditCompany = (c: Company) => setCompanyModal({ open: true, editId: c.id, name: c.name });
  
  const saveCompany = async () => {
    if (!companyModal.name.trim()) return;
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
      await syncAddCompany(newCompany);
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

  const openAddContact = () => setContactModal({ open: true, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '' });
  const openEditContact = (c: Contact) => setContactModal({ open: true, editContact: c, name: c.name, title: c.title, linkedinUrl: c.linkedinUrl, draftMessage: c.draftMessage });
  
  const saveContact = async () => {
    if (!contactModal.name.trim() || !selectedCompany) return;
    const compId = selectedCompany.id;
    if (contactModal.editContact) {
      const contactId = contactModal.editContact.id;
      setData(updateContact(data, compId, contactId, {
        name: contactModal.name, title: contactModal.title, linkedinUrl: contactModal.linkedinUrl, draftMessage: contactModal.draftMessage,
      }));
      setContactModal({ open: false, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '' });
      await syncUpdateContact(contactId, {
        name: contactModal.name, title: contactModal.title, linkedinUrl: contactModal.linkedinUrl, draftMessage: contactModal.draftMessage,
      });
    } else {
      const newData = addContact(data, compId, {
        name: contactModal.name, title: contactModal.title, linkedinUrl: contactModal.linkedinUrl, draftMessage: contactModal.draftMessage,
      });
      setData(newData);
      setContactModal({ open: false, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '' });
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
    if (status === 'accepted') showToast('Connection accepted — draft message is ready!');
    const company = updatedData.companies.find(c => c.id === companyId);
    const contact = company?.contacts.find(ct => ct.id === contactId);
    await syncUpdateContactStatus(contactId, status, contact?.acceptedAt || null);
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">LinkTrack</span>
            </div>
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-3 py-3">
          <button
            onClick={() => { setView({ type: 'dashboard' }); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              view.type === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Home size={16} />
            Dashboard
          </button>
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Companies</span>
            <button onClick={openAddCompany} className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {data.companies.length === 0 && (
            <p className="px-3 py-6 text-xs text-slate-600 text-center">No companies yet. Add one to get started.</p>
          )}
          {data.companies.map(c => {
            const cs = getCompanyStats(c);
            const isActive = view.type === 'company' && view.companyId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setView({ type: 'company', companyId: c.id }); setSearchQuery(''); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Building2 size={15} className={isActive ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'} />
                <span className="flex-1 text-left truncate font-medium">{c.name}</span>
                <span className={`text-xs tabular-nums ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                  {cs.accepted}/{cs.total}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-800 space-y-1">
          <button onClick={handleExport} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors">
            <Download size={15} /> Export Data
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors">
            <Upload size={15} /> Import Data
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500" onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              {view.type === 'dashboard' && (
                <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
              )}
              {selectedCompany && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h1 className="text-lg font-semibold text-slate-900 truncate">{selectedCompany.name}</h1>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button onClick={() => openEditCompany(selectedCompany)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ type: 'company', id: selectedCompany.id })} className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="shrink-0 ml-4">
              <DatabaseSyncBadge status={syncStatus} />
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
          {view.type === 'dashboard' && (
            <DashboardView data={data} stats={stats} onSelectCompany={id => setView({ type: 'company', companyId: id })} onCopyMessage={copyMessage} onChangeStatus={changeStatus} />
          )}
          {selectedCompany && (
            <CompanyView
              company={selectedCompany}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filteredContacts={filteredContacts}
              onAddContact={openAddContact}
              onEditContact={openEditContact}
              onDeleteContact={(contactId) => setDeleteConfirm({ type: 'contact', id: contactId, parentId: selectedCompany.id })}
              onChangeStatus={(contactId, status) => changeStatus(selectedCompany.id, contactId, status)}
              onCopyMessage={copyMessage}
            />
          )}
        </div>
      </main>

      <Modal
        open={companyModal.open}
        onClose={() => setCompanyModal({ open: false, editId: null, name: '' })}
        title={companyModal.editId ? 'Edit Company' : 'Add Company'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
            <input
              type="text"
              value={companyModal.name}
              onChange={e => setCompanyModal(m => ({ ...m, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && saveCompany()}
              placeholder="e.g. Google, Stripe, Figma..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setCompanyModal({ open: false, editId: null, name: '' })} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button onClick={saveCompany} disabled={!companyModal.name.trim()} className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {companyModal.editId ? 'Save' : 'Add Company'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={contactModal.open}
        onClose={() => setContactModal({ open: false, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '' })}
        title={contactModal.editContact ? 'Edit Contact' : 'Add Contact'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input
              type="text"
              value={contactModal.name}
              onChange={e => setContactModal(m => ({ ...m, name: e.target.value }))}
              placeholder="Full name"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Title</label>
            <input
              type="text"
              value={contactModal.title}
              onChange={e => setContactModal(m => ({ ...m, title: e.target.value }))}
              placeholder="e.g. Senior Engineer, Product Manager..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">LinkedIn Profile URL</label>
            <input
              type="url"
              value={contactModal.linkedinUrl}
              onChange={e => setContactModal(m => ({ ...m, linkedinUrl: e.target.value }))}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Draft Outreach Message</label>
            <textarea
              value={contactModal.draftMessage}
              onChange={e => setContactModal(m => ({ ...m, draftMessage: e.target.value }))}
              placeholder="Write your cold outreach message here. When the connection is accepted, you can copy and send it instantly."
              rows={5}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setContactModal({ open: false, editContact: null, name: '', title: '', linkedinUrl: '', draftMessage: '' })} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button onClick={saveContact} disabled={!contactModal.name.trim()} className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {contactModal.editContact ? 'Save' : 'Add Contact'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {deleteConfirm?.type === 'company'
              ? 'Delete this company and all its contacts? This cannot be undone.'
              : 'Delete this contact? This cannot be undone.'}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={deleteConfirm?.type === 'company' ? confirmDeleteCompany : confirmDeleteContact}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ message: '', visible: false })} />
    </div>
  );
}

// --- Dashboard View ---

function DashboardView({
  data, stats, onSelectCompany, onCopyMessage, onChangeStatus,
}: {
  data: AppData;
  stats: ReturnType<typeof getStats>;
  onSelectCompany: (id: string) => void;
  onCopyMessage: (msg: string) => void;
  onChangeStatus: (companyId: string, contactId: string, status: ContactStatus) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Filter companies matching the query
  const matchedCompanies = normalizedQuery
    ? data.companies.filter(c => c.name.toLowerCase().includes(normalizedQuery))
    : [];

  // Filter contacts matching the query across all companies
  const matchedContacts = normalizedQuery
    ? data.companies.flatMap(c =>
        c.contacts
          .filter(ct => ct.name.toLowerCase().includes(normalizedQuery) || ct.title.toLowerCase().includes(normalizedQuery))
          .map(ct => ({ ...ct, companyId: c.id, companyName: c.name }))
      )
    : [];

  return (
    <div className="space-y-8">
      {/* Global Search Box */}
      <div className="relative w-full max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search companies, contacts, or job titles..."
          className="w-full pl-11 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-white shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {normalizedQuery ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Search Results for "{searchQuery}"
            </h2>

            {matchedCompanies.length === 0 && matchedContacts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200/60 p-8 text-center">
                <Search size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No matches found</p>
                <p className="text-xs text-slate-400 mt-1">Try searching for a different company name, person's name, or job title.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {matchedCompanies.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Companies ({matchedCompanies.length})</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {matchedCompanies.map(c => {
                        return (
                          <button
                            key={c.id}
                            onClick={() => onSelectCompany(c.id)}
                            className="bg-white rounded-xl border border-slate-200/60 p-4 text-left hover:shadow-md hover:border-slate-300 transition-all group w-full"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                  <Building2 size={16} className="text-slate-500" />
                                </div>
                                <span className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">{c.name}</span>
                              </div>
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {matchedContacts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contacts ({matchedContacts.length})</h3>
                    <div className="space-y-3">
                      {matchedContacts.map(contact => {
                        const isAccepted = contact.status === 'accepted';
                        const hasDraft = contact.draftMessage.trim().length > 0;
                        return (
                          <div key={contact.id} className="bg-white rounded-xl border border-slate-200/60 p-4 hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-sm text-slate-900">{contact.name}</h4>
                                  <span className="text-xs text-slate-400">&middot;</span>
                                  <button
                                    onClick={() => onSelectCompany(contact.companyId)}
                                    className="text-xs text-slate-500 hover:text-emerald-600 font-medium hover:underline transition-colors"
                                  >
                                    {contact.companyName}
                                  </button>
                                  <StatusBadge status={contact.status} />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{contact.title}</p>
                                {contact.linkedinUrl && (
                                  <a
                                    href={contact.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1.5 transition-colors"
                                  >
                                    LinkedIn <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <StatusDropdown status={contact.status} onChange={s => onChangeStatus(contact.companyId, contact.id, s)} />
                                {hasDraft && isAccepted && (
                                  <button
                                    onClick={() => onCopyMessage(contact.draftMessage)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                                  >
                                    <Copy size={12} /> Copy
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={<Users size={20} />} label="Total Connections" value={stats.total} color="emerald" />
            <StatCard icon={<Clock size={20} />} label="Pending" value={stats.pending} color="amber" />
            <StatCard icon={<CheckCircle2 size={20} />} label="Accepted" value={stats.accepted} color="emerald" />
            <StatCard icon={<BarChart3 size={20} />} label="Acceptance Rate" value={`${stats.acceptanceRate}%`} color="blue" />
          </div>

          {stats.readyToMessage.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <MessageSquare size={15} className="text-emerald-600" />
                Ready to Message ({stats.readyToMessage.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.readyToMessage.map(c => {
                  const parent = data.companies.find(co => co.contacts.some(ct => ct.id === c.id));
                  return (
                    <div key={c.id} className="bg-white rounded-xl border border-slate-200/60 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.title} &middot; {parent?.name}</p>
                        </div>
                        <button
                          onClick={() => onCopyMessage(c.draftMessage)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 whitespace-pre-wrap">{c.draftMessage}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Companies</h2>
            {data.companies.length === 0 ? (
              <div className="text-center py-16">
                <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 mb-1">No companies yet</p>
                <p className="text-xs text-slate-400">Add a company from the sidebar to start tracking connections</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.companies.map(c => {
                  const cs = getCompanyStats(c);
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelectCompany(c.id)}
                      className="bg-white rounded-xl border border-slate-200/60 p-4 text-left hover:shadow-md hover:border-slate-300 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Building2 size={16} className="text-slate-500" />
                          </div>
                          <span className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">{c.name}</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-amber-600 font-medium">{cs.pending} pending</span>
                        <span className="text-emerald-600 font-medium">{cs.accepted} accepted</span>
                        {cs.declined > 0 && <span className="text-rose-500 font-medium">{cs.declined} declined</span>}
                      </div>
                      {cs.total > 0 && (
                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

// --- Company View ---

function CompanyView({
  company, searchQuery, onSearchChange, filteredContacts,
  onAddContact, onEditContact, onDeleteContact, onChangeStatus, onCopyMessage,
}: {
  company: Company; searchQuery: string; onSearchChange: (q: string) => void; filteredContacts: Contact[];
  onAddContact: () => void; onEditContact: (c: Contact) => void; onDeleteContact: (id: string) => void;
  onChangeStatus: (contactId: string, status: ContactStatus) => void; onCopyMessage: (msg: string) => void;
}) {
  const cs = getCompanyStats(company);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-200/60 px-4 py-2.5 text-xs flex-wrap">
          <span className="text-slate-500">{cs.total} total</span>
          <span className="text-amber-600 font-semibold">{cs.pending} pending</span>
          <span className="text-emerald-600 font-semibold">{cs.accepted} accepted</span>
          {cs.declined > 0 && <span className="text-rose-500 font-semibold">{cs.declined} declined</span>}
          {cs.noResponse > 0 && <span className="text-slate-400 font-semibold">{cs.noResponse} no response</span>}
        </div>
        <button
          onClick={onAddContact}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {company.contacts.length > 0 && (
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-white"
          />
        </div>
      )}

      {company.contacts.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 mb-1">No contacts yet</p>
          <p className="text-xs text-slate-400">Add people you want to connect with at {company.name}</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No contacts match your search</p>
      ) : (
        <div className="space-y-3">
          {filteredContacts.map(contact => {
            const isDraftExpanded = expandedDraft === contact.id;
            const isAccepted = contact.status === 'accepted';
            const hasDraft = contact.draftMessage.trim().length > 0;
            return (
              <div key={contact.id} className="bg-white rounded-xl border border-slate-200/60 hover:shadow-md transition-all group">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-semibold text-sm text-slate-900">{contact.name}</h3>
                        <StatusBadge status={contact.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{contact.title}</p>
                      {contact.linkedinUrl && (
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1.5 transition-colors"
                        >
                          LinkedIn <ExternalLink size={10} />
                        </a>
                      )}
                      {contact.acceptedAt && (
                        <p className="text-xs text-slate-400 mt-1">
                          Accepted {new Date(contact.acceptedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <StatusDropdown status={contact.status} onChange={s => onChangeStatus(contact.id, s)} />
                      <button onClick={() => onEditContact(contact)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDeleteContact(contact.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {hasDraft && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedDraft(isDraftExpanded ? null : contact.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        <MessageSquare size={12} />
                        {isDraftExpanded ? 'Hide' : 'Show'} draft message
                      </button>
                      {(isDraftExpanded || isAccepted) && (
                        <div className={`mt-2 p-3 rounded-lg text-xs whitespace-pre-wrap transition-colors ${
                          isAccepted ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-slate-700 flex-1">{contact.draftMessage}</p>
                            {isAccepted && (
                              <button
                                onClick={() => onCopyMessage(contact.draftMessage)}
                                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                              >
                                <Copy size={12} /> Copy
                              </button>
                            )}
                          </div>
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
