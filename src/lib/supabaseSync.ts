import { supabase } from './supabase';
import { AppData, Company, Contact } from '../types';

export async function fetchAllFromSupabase(): Promise<AppData | null> {
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('*');

  if (compError) throw compError;

  const { data: contacts, error: contError } = await supabase
    .from('contacts')
    .select('*');

  if (contError) throw contError;

  const companyMap = new Map<string, Company>();

  for (const c of companies || []) {
    companyMap.set(c.id, {
      id: c.id,
      name: c.name,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      contacts: []
    });
  }

  for (const ct of contacts || []) {
    const contact: Contact = {
      id: ct.id,
      name: ct.name,
      title: ct.title || '',
      linkedinUrl: ct.linkedin_url || '',
      status: ct.status,
      draftMessage: ct.draft_message || '',
      notes: ct.notes || '',
      acceptedAt: ct.accepted_at,
      createdAt: ct.created_at,
      updatedAt: ct.updated_at
    };
    const comp = companyMap.get(ct.company_id);
    if (comp) {
      comp.contacts.push(contact);
    }
  }

  return {
    companies: Array.from(companyMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  };
}

export async function syncAddCompany(company: Company, userId: string) {
  const { error } = await supabase
    .from('companies')
    .insert({
      id: company.id,
      name: company.name,
      user_id: userId,
      created_at: company.createdAt,
      updated_at: company.updatedAt
    });
  if (error) console.error('Error syncing add company:', error);
}

export async function syncUpdateCompany(id: string, name: string) {
  const { error } = await supabase
    .from('companies')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('Error syncing update company:', error);
}

export async function syncDeleteCompany(id: string) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);
  if (error) console.error('Error syncing delete company:', error);
}

export async function syncAddContact(companyId: string, contact: Contact) {
  const { error } = await supabase
    .from('contacts')
    .insert({
      id: contact.id,
      company_id: companyId,
      name: contact.name,
      title: contact.title,
      linkedin_url: contact.linkedinUrl,
      status: contact.status,
      draft_message: contact.draftMessage,
      notes: contact.notes,
      accepted_at: contact.acceptedAt,
      created_at: contact.createdAt,
      updated_at: contact.updatedAt
    });
  if (error) console.error('Error syncing add contact:', error);
}

export async function syncUpdateContact(contactId: string, updates: Partial<Contact>) {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.linkedinUrl !== undefined) dbUpdates.linkedin_url = updates.linkedinUrl;
  if (updates.draftMessage !== undefined) dbUpdates.draft_message = updates.draftMessage;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('contacts')
    .update(dbUpdates)
    .eq('id', contactId);
  if (error) console.error('Error syncing update contact:', error);
}

export async function syncUpdateContactStatus(contactId: string, status: string, acceptedAt: string | null) {
  const { error } = await supabase
    .from('contacts')
    .update({
      status,
      accepted_at: acceptedAt,
      updated_at: new Date().toISOString()
    })
    .eq('id', contactId);
  if (error) console.error('Error syncing contact status:', error);
}

export async function syncDeleteContact(contactId: string) {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);
  if (error) console.error('Error syncing delete contact:', error);
}

export async function syncBulkUpload(data: AppData, userId: string) {
  if (data.companies.length === 0) return;
  
  const dbCompanies = data.companies.map(c => ({
    id: c.id,
    name: c.name,
    user_id: userId,
    created_at: c.createdAt,
    updated_at: c.updatedAt
  }));

  const { error: compErr } = await supabase
    .from('companies')
    .upsert(dbCompanies);

  if (compErr) {
    console.error('Error bulk syncing companies:', compErr);
    return;
  }

  const dbContacts = data.companies.flatMap(c => 
    c.contacts.map(ct => ({
      id: ct.id,
      company_id: c.id,
      name: ct.name,
      title: ct.title,
      linkedin_url: ct.linkedinUrl,
      status: ct.status,
      draft_message: ct.draftMessage,
      notes: ct.notes,
      accepted_at: ct.acceptedAt,
      created_at: ct.createdAt,
      updated_at: ct.updatedAt
    }))
  );

  if (dbContacts.length > 0) {
    const { error: contErr } = await supabase
      .from('contacts')
      .upsert(dbContacts);
    if (contErr) console.error('Error bulk syncing contacts:', contErr);
  }
}
