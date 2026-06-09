export type ContactStatus = 'pending' | 'accepted' | 'declined' | 'no_response';

export type PipelineStage = 'cold_email' | 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ActivityNote {
  id: string;
  contactId: string;
  text: string;
  type: 'note' | 'email_sent' | 'reply_received' | 'call_scheduled' | 'meeting' | 'follow_up' | 'other';
  createdAt: string;
}

export interface FollowUpReminder {
  id: string;
  contactId: string;
  dueDate: string;
  note: string;
  completed: boolean;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  linkedinUrl: string;
  status: ContactStatus;
  pipelineStage: PipelineStage;
  draftMessage: string;
  notes: string;
  tags: string[];
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  contacts: Contact[];
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  companies: Company[];
  tags: Tag[];
  activityNotes: ActivityNote[];
  reminders: FollowUpReminder[];
}

export const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-referral', name: 'Referral', color: '#8b5cf6' },
  { id: 'tag-cold-email', name: 'Cold Email', color: '#3b82f6' },
  { id: 'tag-applied', name: 'Applied', color: '#f59e0b' },
  { id: 'tag-hot-lead', name: 'Hot Lead', color: '#ef4444' },
  { id: 'tag-networking', name: 'Networking', color: '#10b981' },
  { id: 'tag-recruiter', name: 'Recruiter', color: '#ec4899' },
];

export const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'cold_email', label: 'Cold Email', color: '#64748b' },
  { value: 'applied', label: 'Applied', color: '#3b82f6' },
  { value: 'phone_screen', label: 'Phone Screen', color: '#8b5cf6' },
  { value: 'interview', label: 'Interview', color: '#f59e0b' },
  { value: 'offer', label: 'Offer', color: '#10b981' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444' },
];

export const ACTIVITY_TYPES: { value: ActivityNote['type']; label: string; emoji: string }[] = [
  { value: 'note', label: 'Note', emoji: '📝' },
  { value: 'email_sent', label: 'Email Sent', emoji: '📧' },
  { value: 'reply_received', label: 'Reply Received', emoji: '📬' },
  { value: 'call_scheduled', label: 'Call Scheduled', emoji: '📞' },
  { value: 'meeting', label: 'Meeting', emoji: '🤝' },
  { value: 'follow_up', label: 'Follow Up', emoji: '🔔' },
  { value: 'other', label: 'Other', emoji: '📌' },
];
