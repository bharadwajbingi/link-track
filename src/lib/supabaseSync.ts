import { supabase } from './supabase';
import { AppData, Company, Contact, ActivityNote, FollowUpReminder, Tag, DEFAULT_TAGS } from '../types';

export async function fetchAllFromSupabase(): Promise<AppData | null> {
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('*');

  if (compError) throw compError;

  const { data: contacts, error: contError } = await supabase
    .from('contacts')
    .select('*');

  if (contError) throw contError;

  const { data: tags, error: tagError } = await supabase
    .from('tags')
    .select('*');

  const { data: activityNotes, error: notesError } = await supabase
    .from('activity_notes')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: reminders, error: remError } = await supabase
    .from('reminders')
    .select('*');

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
      pipelineStage: ct.pipeline_stage || 'cold_email',
      draftMessage: ct.draft_message || '',
      notes: ct.notes || '',
      tags: ct.tags || [],
      acceptedAt: ct.accepted_at,
      createdAt: ct.created_at,
      updatedAt: ct.updated_at
    };
    const comp = companyMap.get(ct.company_id);
    if (comp) {
      comp.contacts.push(contact);
    }
  }

  const mappedTags: Tag[] = (tags || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }));

  const mappedNotes: ActivityNote[] = (activityNotes || []).map((n: any) => ({
    id: n.id,
    contactId: n.contact_id,
    text: n.text,
    type: n.type,
    createdAt: n.created_at,
  }));

  const mappedReminders: FollowUpReminder[] = (reminders || []).map((r: any) => ({
    id: r.id,
    contactId: r.contact_id,
    dueDate: r.due_date,
    note: r.note || '',
    completed: r.completed,
    createdAt: r.created_at,
  }));

  return {
    companies: Array.from(companyMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
    tags: mappedTags.length > 0 ? mappedTags : DEFAULT_TAGS,
    activityNotes: mappedNotes,
    reminders: mappedReminders,
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
      pipeline_stage: contact.pipelineStage,
      draft_message: contact.draftMessage,
      notes: contact.notes,
      tags: contact.tags,
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
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.pipelineStage !== undefined) dbUpdates.pipeline_stage = updates.pipelineStage;
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

export async function syncUpdatePipelineStage(contactId: string, stage: string) {
  const { error } = await supabase
    .from('contacts')
    .update({
      pipeline_stage: stage,
      updated_at: new Date().toISOString()
    })
    .eq('id', contactId);
  if (error) console.error('Error syncing pipeline stage:', error);
}

export async function syncDeleteContact(contactId: string) {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);
  if (error) console.error('Error syncing delete contact:', error);
}

export async function syncAddTag(tag: Tag, userId: string) {
  const { error } = await supabase
    .from('tags')
    .insert({
      id: tag.id,
      user_id: userId,
      name: tag.name,
      color: tag.color,
    });
  if (error) console.error('Error syncing add tag:', error);
}

export async function syncDeleteTag(tagId: string) {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId);
  if (error) console.error('Error syncing delete tag:', error);
}

export async function syncAddActivityNote(note: ActivityNote, userId: string) {
  const { error } = await supabase
    .from('activity_notes')
    .insert({
      id: note.id,
      contact_id: note.contactId,
      user_id: userId,
      text: note.text,
      type: note.type,
      created_at: note.createdAt,
    });
  if (error) console.error('Error syncing add activity note:', error);
}

export async function syncDeleteActivityNote(noteId: string) {
  const { error } = await supabase
    .from('activity_notes')
    .delete()
    .eq('id', noteId);
  if (error) console.error('Error syncing delete activity note:', error);
}

export async function syncAddReminder(reminder: FollowUpReminder, userId: string) {
  const { error } = await supabase
    .from('reminders')
    .insert({
      id: reminder.id,
      contact_id: reminder.contactId,
      user_id: userId,
      due_date: reminder.dueDate,
      note: reminder.note,
      completed: reminder.completed,
      created_at: reminder.createdAt,
    });
  if (error) console.error('Error syncing add reminder:', error);
}

export async function syncCompleteReminder(reminderId: string) {
  const { error } = await supabase
    .from('reminders')
    .update({ completed: true })
    .eq('id', reminderId);
  if (error) console.error('Error syncing complete reminder:', error);
}

export async function syncDeleteReminder(reminderId: string) {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', reminderId);
  if (error) console.error('Error syncing delete reminder:', error);
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
      pipeline_stage: ct.pipelineStage || 'cold_email',
      draft_message: ct.draftMessage,
      notes: ct.notes,
      tags: ct.tags || [],
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

  // Sync tags
  if (data.tags && data.tags.length > 0) {
    const dbTags = data.tags.map(t => ({
      id: t.id,
      user_id: userId,
      name: t.name,
      color: t.color,
    }));
    const { error: tagErr } = await supabase
      .from('tags')
      .upsert(dbTags);
    if (tagErr) console.error('Error bulk syncing tags:', tagErr);
  }
}
