import { AppData, Company, Contact, ContactStatus, PipelineStage, Tag, ActivityNote, FollowUpReminder, DEFAULT_TAGS } from './types';

const generateId = (): string => crypto.randomUUID();

const now = (): string => new Date().toISOString();

const DEFAULT_DATA: AppData = {
  companies: [],
  tags: DEFAULT_TAGS,
  activityNotes: [],
  reminders: [],
};

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
  contact: { name: string; title: string; linkedinUrl: string; draftMessage: string; tags?: string[]; pipelineStage?: PipelineStage }
): AppData {
  const newContact: Contact = {
    id: generateId(),
    name: contact.name.trim(),
    title: contact.title.trim(),
    linkedinUrl: contact.linkedinUrl.trim(),
    status: 'pending',
    pipelineStage: contact.pipelineStage || 'cold_email',
    draftMessage: contact.draftMessage,
    notes: '',
    tags: contact.tags || [],
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
  updates: Partial<Pick<Contact, 'name' | 'title' | 'linkedinUrl' | 'draftMessage' | 'notes' | 'tags' | 'pipelineStage'>>
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

export function updateContactPipelineStage(
  data: AppData,
  companyId: string,
  contactId: string,
  stage: PipelineStage
): AppData {
  return {
    ...data,
    companies: data.companies.map(c =>
      c.id === companyId
        ? {
            ...c,
            contacts: c.contacts.map(ct =>
              ct.id === contactId
                ? { ...ct, pipelineStage: stage, updatedAt: now() }
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

// Tags CRUD

export function addTag(data: AppData, name: string, color: string): AppData {
  const tag: Tag = { id: generateId(), name: name.trim(), color };
  return { ...data, tags: [...data.tags, tag] };
}

export function deleteTag(data: AppData, tagId: string): AppData {
  return {
    ...data,
    tags: data.tags.filter(t => t.id !== tagId),
    companies: data.companies.map(c => ({
      ...c,
      contacts: c.contacts.map(ct => ({
        ...ct,
        tags: ct.tags.filter(t => t !== tagId),
      })),
    })),
  };
}

// Activity Notes

export function addActivityNote(data: AppData, contactId: string, text: string, type: ActivityNote['type']): AppData {
  const note: ActivityNote = {
    id: generateId(),
    contactId,
    text: text.trim(),
    type,
    createdAt: now(),
  };
  return { ...data, activityNotes: [note, ...data.activityNotes] };
}

export function deleteActivityNote(data: AppData, noteId: string): AppData {
  return { ...data, activityNotes: data.activityNotes.filter(n => n.id !== noteId) };
}

// Reminders

export function addReminder(data: AppData, contactId: string, dueDate: string, note: string): AppData {
  const reminder: FollowUpReminder = {
    id: generateId(),
    contactId,
    dueDate,
    note: note.trim(),
    completed: false,
    createdAt: now(),
  };
  return { ...data, reminders: [...data.reminders, reminder] };
}

export function completeReminder(data: AppData, reminderId: string): AppData {
  return {
    ...data,
    reminders: data.reminders.map(r =>
      r.id === reminderId ? { ...r, completed: true } : r
    ),
  };
}

export function deleteReminder(data: AppData, reminderId: string): AppData {
  return { ...data, reminders: data.reminders.filter(r => r.id !== reminderId) };
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
      return {
        companies: parsed.companies || [],
        tags: parsed.tags || DEFAULT_TAGS,
        activityNotes: parsed.activityNotes || [],
        reminders: parsed.reminders || [],
      } as AppData;
    }
    return null;
  } catch {
    return null;
  }
}

// CSV Import

export interface CSVRow {
  company: string;
  name: string;
  title?: string;
  linkedinUrl?: string;
  tags?: string;
  pipelineStage?: string;
}

export function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim().replace(/^["']|["']$/g, '');
    });

    const companyField = row['company'] || row['company name'] || row['organization'] || '';
    const nameField = row['name'] || row['contact name'] || row['full name'] || '';

    if (companyField && nameField) {
      rows.push({
        company: companyField,
        name: nameField,
        title: row['title'] || row['job title'] || row['position'] || '',
        linkedinUrl: row['linkedin'] || row['linkedin url'] || row['linkedinurl'] || row['url'] || '',
        tags: row['tags'] || row['labels'] || '',
        pipelineStage: row['stage'] || row['pipeline'] || row['pipeline_stage'] || '',
      });
    }
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function importCSV(data: AppData, rows: CSVRow[], existingTags: Tag[]): AppData {
  let result = { ...data };

  const companyMap = new Map<string, string>();
  result.companies.forEach(c => companyMap.set(c.name.toLowerCase(), c.id));

  for (const row of rows) {
    const companyKey = row.company.toLowerCase();
    let companyId = companyMap.get(companyKey);

    if (!companyId) {
      result = addCompany(result, row.company);
      const newCompany = result.companies[result.companies.length - 1];
      companyId = newCompany.id;
      companyMap.set(companyKey, companyId);
    }

    const tagIds: string[] = [];
    if (row.tags) {
      const tagNames = row.tags.split(';').map(t => t.trim()).filter(Boolean);
      for (const tagName of tagNames) {
        const existing = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
        if (existing) {
          tagIds.push(existing.id);
        }
      }
    }

    const validStages = ['cold_email', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'];
    const stage = validStages.includes(row.pipelineStage || '') ? row.pipelineStage as PipelineStage : 'cold_email';

    result = addContact(result, companyId, {
      name: row.name,
      title: row.title || '',
      linkedinUrl: row.linkedinUrl || '',
      draftMessage: '',
      tags: tagIds,
      pipelineStage: stage,
    });
  }

  return result;
}
