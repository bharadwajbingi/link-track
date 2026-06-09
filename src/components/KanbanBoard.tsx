import { useState } from 'react';
import { Contact, PipelineStage, PIPELINE_STAGES, Company, Tag } from '../types';
import { GripVertical, User, Building2 } from 'lucide-react';

interface KanbanBoardProps {
  companies: Company[];
  tags: Tag[];
  onMoveContact: (companyId: string, contactId: string, newStage: PipelineStage) => void;
  onSelectContact: (companyId: string, contactId: string) => void;
}

interface ContactWithCompany extends Contact {
  companyId: string;
  companyName: string;
}

export function KanbanBoard({ companies, tags, onMoveContact, onSelectContact }: KanbanBoardProps) {
  const [draggedContact, setDraggedContact] = useState<ContactWithCompany | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const allContacts: ContactWithCompany[] = companies.flatMap(c =>
    c.contacts.map(ct => ({ ...ct, companyId: c.id, companyName: c.name }))
  );

  const contactsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.value] = allContacts.filter(c => c.pipelineStage === stage.value);
    return acc;
  }, {} as Record<PipelineStage, ContactWithCompany[]>);

  const handleDragStart = (e: React.DragEvent, contact: ContactWithCompany) => {
    setDraggedContact(contact);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', contact.id);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(null);
    if (draggedContact && draggedContact.pipelineStage !== stage) {
      onMoveContact(draggedContact.companyId, draggedContact.id, stage);
    }
    setDraggedContact(null);
  };

  const getTagById = (tagId: string) => tags.find(t => t.id === tagId);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {PIPELINE_STAGES.map(stage => {
          const stageContacts = contactsByStage[stage.value];
          const isDragOver = dragOverStage === stage.value;

          return (
            <div
              key={stage.value}
              className={`w-72 flex-shrink-0 rounded-xl border transition-all duration-200 ${
                isDragOver
                  ? 'border-emerald-400 bg-emerald-50/50 shadow-lg shadow-emerald-500/10'
                  : 'border-slate-200 bg-slate-50/80'
              }`}
              onDragOver={(e) => handleDragOver(e, stage.value)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.value)}
            >
              <div className="px-4 py-3 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="text-sm font-semibold text-slate-800">{stage.label}</h3>
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                    {stageContacts.length}
                  </span>
                </div>
              </div>

              <div className="p-2 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
                {stageContacts.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-xs text-slate-400">
                    Drop contacts here
                  </div>
                )}
                {stageContacts.map(contact => (
                  <div
                    key={contact.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, contact)}
                    onClick={() => onSelectContact(contact.companyId, contact.id)}
                    className={`bg-white rounded-lg border border-slate-200/80 p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all group ${
                      draggedContact?.id === contact.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-slate-300 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-400 shrink-0" />
                          <p className="text-sm font-medium text-slate-800 truncate">{contact.name}</p>
                        </div>
                        {contact.title && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{contact.title}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1.5">
                          <Building2 size={10} className="text-slate-400" />
                          <span className="text-xs text-slate-400 truncate">{contact.companyName}</span>
                        </div>
                        {contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {contact.tags.slice(0, 3).map(tagId => {
                              const tag = getTagById(tagId);
                              if (!tag) return null;
                              return (
                                <span
                                  key={tagId}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              );
                            })}
                            {contact.tags.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{contact.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
