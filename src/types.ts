export type ContactStatus = 'pending' | 'accepted' | 'declined' | 'no_response';

export interface Contact {
  id: string;
  name: string;
  title: string;
  linkedinUrl: string;
  status: ContactStatus;
  draftMessage: string;
  notes: string;
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
}
