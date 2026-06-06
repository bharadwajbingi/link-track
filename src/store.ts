import { AppData, Company, Contact, ContactStatus } from './types';

const generateId = (): string => crypto.randomUUID();

const now = (): string => new Date().toISOString();

const DEFAULT_DATA: AppData = { companies: [] };

export function getInitialData(): AppData {
  return DEFAULT_DATA;
}

// Company CRUD

export function addCompany(data: AppData, name: string): AppData {
  const company: Company = {
    id: generateId(),
    name: name.trim(),
    contacts: [],
    createdAt: now(),
    updatedAt: now(),
  };
  return { ...data, companies: [...data.companies, company] };
}

export function updateCompany(data: AppData, companyId: string, name: string): AppData {
  return {
    ...data,
    companies: data.companies.map(c =>
      c.id === companyId ? { ...c, name: name.trim(), updatedAt: now() } : c
    ),
  };
}

export function deleteCompany(data: AppData, companyId: string): AppData {
  return { ...data, companies: data.companies.filter(c => c.id !== companyId) };
}

// Contact CRUD

export function addContact(
  data: AppData,
  companyId: string,
  contact: { name: string; title: string; linkedinUrl: string; draftMessage: string }
): AppData {
  const newContact: Contact = {
    id: generateId(),
    name: contact.name.trim(),
    title: contact.title.trim(),
    linkedinUrl: contact.linkedinUrl.trim(),
    status: 'pending',
    draftMessage: contact.draftMessage,
    notes: '',
    acceptedAt: null,
    createdAt: now(),
    updatedAt: now(),
  };
  return {
    ...data,
    companies: data.companies.map(c =>
      c.id === companyId
        ? { ...c, contacts: [...c.contacts, newContact], updatedAt: now() }
        : c
    ),
  };
}

export function updateContact(
  data: AppData,
  companyId: string,
  contactId: string,
  updates: Partial<Pick<Contact, 'name' | 'title' | 'linkedinUrl' | 'draftMessage' | 'notes'>>
): AppData {
  return {
    ...data,
    companies: data.companies.map(c =>
      c.id === companyId
        ? {
            ...c,
            contacts: c.contacts.map(ct =>
              ct.id === contactId ? { ...ct, ...updates, updatedAt: now() } : ct
            ),
            updatedAt: now(),
          }
        : c
    ),
  };
}

export function updateContactStatus(
  data: AppData,
  companyId: string,
  contactId: string,
  status: ContactStatus
): AppData {
  return {
    ...data,
    companies: data.companies.map(c =>
      c.id === companyId
        ? {
            ...c,
            contacts: c.contacts.map(ct =>
              ct.id === contactId
                ? {
                    ...ct,
                    status,
                    acceptedAt: status === 'accepted' ? now() : ct.acceptedAt,
                    updatedAt: now(),
                  }
                : ct
            ),
            updatedAt: now(),
          }
        : c
    ),
  };
}

export function deleteContact(data: AppData, companyId: string, contactId: string): AppData {
  return {
    ...data,
    companies: data.companies.map(c =>
      c.id === companyId
        ? { ...c, contacts: c.contacts.filter(ct => ct.id !== contactId), updatedAt: now() }
        : c
    ),
  };
}

// Stats helpers

export function getStats(data: AppData) {
  const allContacts = data.companies.flatMap(c => c.contacts);
  const total = allContacts.length;
  const pending = allContacts.filter(c => c.status === 'pending').length;
  const accepted = allContacts.filter(c => c.status === 'accepted').length;
  const declined = allContacts.filter(c => c.status === 'declined').length;
  const noResponse = allContacts.filter(c => c.status === 'no_response').length;
  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const readyToMessage = allContacts.filter(
    c => c.status === 'accepted' && c.draftMessage.trim().length > 0
  );
  return { total, pending, accepted, declined, noResponse, acceptanceRate, readyToMessage };
}

export function getCompanyStats(company: Company) {
  const total = company.contacts.length;
  const pending = company.contacts.filter(c => c.status === 'pending').length;
  const accepted = company.contacts.filter(c => c.status === 'accepted').length;
  const declined = company.contacts.filter(c => c.status === 'declined').length;
  const noResponse = company.contacts.filter(c => c.status === 'no_response').length;
  return { total, pending, accepted, declined, noResponse };
}

// Export/Import

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): AppData | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.companies)) {
      return parsed as AppData;
    }
    return null;
  } catch {
    return null;
  }
}
