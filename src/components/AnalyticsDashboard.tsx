import { useMemo } from 'react';
import { AppData, PIPELINE_STAGES } from '../types';
import { TrendingUp, BarChart3, Clock, Target } from 'lucide-react';

interface AnalyticsDashboardProps {
  data: AppData;
  theme?: string;
}

export function AnalyticsDashboard({ data, theme = 'dark' }: AnalyticsDashboardProps) {
  const allContacts = useMemo(() => data.companies.flatMap(c => c.contacts), [data]);

  const pipelineData = useMemo(() => {
    return PIPELINE_STAGES.map(stage => ({
      ...stage,
      count: allContacts.filter(c => c.pipelineStage === stage.value).length,
    }));
  }, [allContacts]);

  const weeklyData = useMemo(() => {
    const weeks: { week: string; added: number; accepted: number; declined: number }[] = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;

      const added = allContacts.filter(c => {
        const d = new Date(c.createdAt);
        return d >= weekStart && d < weekEnd;
      }).length;

      const accepted = allContacts.filter(c => {
        if (!c.acceptedAt) return false;
        const d = new Date(c.acceptedAt);
        return d >= weekStart && d < weekEnd;
      }).length;

      const declined = allContacts.filter(c => {
        if (c.status !== 'declined') return false;
        const d = new Date(c.updatedAt);
        return d >= weekStart && d < weekEnd;
      }).length;

      weeks.push({ week: weekLabel, added, accepted, declined });
    }

    return weeks;
  }, [allContacts]);

  const responseRate = useMemo(() => {
    const responded = allContacts.filter(c => c.status === 'accepted' || c.status === 'declined').length;
    return allContacts.length > 0 ? Math.round((responded / allContacts.length) * 100) : 0;
  }, [allContacts]);

  const avgTimeToResponse = useMemo(() => {
    const contactsWithResponse = allContacts.filter(c => c.acceptedAt);
    if (contactsWithResponse.length === 0) return 'N/A';
    const totalDays = contactsWithResponse.reduce((sum, c) => {
      const created = new Date(c.createdAt).getTime();
      const accepted = new Date(c.acceptedAt!).getTime();
      return sum + (accepted - created) / (1000 * 60 * 60 * 24);
    }, 0);
    const avg = Math.round(totalDays / contactsWithResponse.length);
    return `${avg} day${avg !== 1 ? 's' : ''}`;
  }, [allContacts]);

  const maxPipeline = Math.max(...pipelineData.map(d => d.count), 1);
  const maxWeekly = Math.max(...weeklyData.map(d => Math.max(d.added, d.accepted, d.declined)), 1);

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Target size={20} />}
          label="Response Rate"
          value={`${responseRate}%`}
          sublabel="replied / total outreach"
          color="brand"
          theme={theme}
        />
        <MetricCard
          icon={<Clock size={20} />}
          label="Avg Response Time"
          value={avgTimeToResponse}
          sublabel="from outreach to reply"
          color="blue"
          theme={theme}
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          label="Active Pipeline"
          value={allContacts.filter(c => !['offer', 'rejected'].includes(c.pipelineStage)).length.toString()}
          sublabel="contacts in progress"
          color="violet"
          theme={theme}
        />
        <MetricCard
          icon={<BarChart3 size={20} />}
          label="Total Outreach"
          value={allContacts.length.toString()}
          sublabel={`across ${data.companies.length} companies`}
          color="amber"
          theme={theme}
        />
      </div>

      {/* Pipeline chart */}
      <div className={`rounded-xl border p-6 ${
        theme === 'dark' ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-surface-200/60'
      }`}>
        <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Pipeline Distribution</h3>
        <div className="space-y-3">
          {pipelineData.map(stage => (
            <div key={stage.value} className="flex items-center gap-3">
              <div className={`w-28 text-xs font-medium shrink-0 ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>{stage.label}</div>
              <div className={`flex-1 h-8 rounded-lg overflow-hidden relative ${theme === 'dark' ? 'bg-white/[0.04]' : 'bg-surface-100'}`}>
                <div
                  className="h-full rounded-lg transition-all duration-500 flex items-center px-2"
                  style={{
                    width: `${Math.max((stage.count / maxPipeline) * 100, stage.count > 0 ? 8 : 0)}%`,
                    backgroundColor: stage.color,
                    boxShadow: stage.count > 0 ? `0 0 12px ${stage.color}40` : 'none',
                  }}
                >
                  {stage.count > 0 && (
                    <span className="text-xs font-bold text-white">{stage.count}</span>
                  )}
                </div>
                {stage.count === 0 && (
                  <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs ${theme === 'dark' ? 'text-surface-600' : 'text-surface-400'}`}>0</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly activity chart */}
      <div className={`rounded-xl border p-6 ${
        theme === 'dark' ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-surface-200/60'
      }`}>
        <h3 className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Weekly Activity</h3>
        <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-500'}`}>Contacts added, accepted, and declined over the last 8 weeks</p>
        <div className="flex items-end gap-2 h-40">
          {weeklyData.map((week, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="flex flex-col items-center gap-0.5 flex-1 justify-end w-full">
                {week.added > 0 && (
                  <div
                    className="w-full max-w-[24px] bg-brand-400 rounded-t transition-all duration-500"
                    style={{ height: `${(week.added / maxWeekly) * 100}%`, minHeight: '4px' }}
                    title={`${week.added} added`}
                  />
                )}
                {week.accepted > 0 && (
                  <div
                    className="w-full max-w-[24px] bg-emerald-500 rounded transition-all duration-500"
                    style={{ height: `${(week.accepted / maxWeekly) * 100}%`, minHeight: '4px' }}
                    title={`${week.accepted} accepted`}
                  />
                )}
                {week.declined > 0 && (
                  <div
                    className="w-full max-w-[24px] bg-rose-400 rounded-b transition-all duration-500"
                    style={{ height: `${(week.declined / maxWeekly) * 100}%`, minHeight: '4px' }}
                    title={`${week.declined} declined`}
                  />
                )}
                {week.added === 0 && week.accepted === 0 && week.declined === 0 && (
                  <div className={`w-full max-w-[24px] rounded ${theme === 'dark' ? 'bg-white/[0.06]' : 'bg-surface-200'}`} style={{ height: '4px' }} />
                )}
              </div>
              <span className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-400'}`}>{week.week}</span>
            </div>
          ))}
        </div>
        <div className={`flex items-center gap-4 mt-4 pt-3 border-t ${theme === 'dark' ? 'border-white/[0.06]' : 'border-surface-100'}`}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-brand-400" />
            <span className={`text-xs ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>Added</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className={`text-xs ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>Accepted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-400" />
            <span className={`text-xs ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>Declined</span>
          </div>
        </div>
      </div>

      {/* Company breakdown */}
      <div className={`rounded-xl border p-6 ${
        theme === 'dark' ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-surface-200/60'
      }`}>
        <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Company Breakdown</h3>
        {data.companies.length === 0 ? (
          <p className={`text-sm ${theme === 'dark' ? 'text-surface-500' : 'text-surface-400'}`}>No companies added yet</p>
        ) : (
          <div className="space-y-2">
            {data.companies
              .sort((a, b) => b.contacts.length - a.contacts.length)
              .slice(0, 10)
              .map(company => {
                const accepted = company.contacts.filter(c => c.status === 'accepted').length;
                const total = company.contacts.length;
                return (
                  <div key={company.id} className="flex items-center gap-3">
                    <span className={`w-32 text-xs font-medium truncate shrink-0 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>{company.name}</span>
                    <div className={`flex-1 h-6 rounded-md overflow-hidden flex ${theme === 'dark' ? 'bg-white/[0.04]' : 'bg-surface-100'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
                        style={{ width: total > 0 ? `${(accepted / total) * 100}%` : '0%' }}
                      />
                      <div
                        className={`h-full transition-all duration-500 ${theme === 'dark' ? 'bg-surface-700' : 'bg-surface-300'}`}
                        style={{ width: total > 0 ? `${((total - accepted) / total) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className={`text-xs shrink-0 w-16 text-right ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>{accepted}/{total}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sublabel, color, theme = 'dark' }: {
  icon: React.ReactNode; label: string; value: string; sublabel: string; color: string; theme?: string;
}) {
  const darkColors: Record<string, string> = {
    brand: 'bg-brand-500/10 text-brand-400',
    blue: 'bg-blue-500/10 text-blue-400',
    violet: 'bg-violet-500/10 text-violet-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };
  const lightColors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
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
      <p className={`text-xs font-medium mt-0.5 ${theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}`}>{label}</p>
      <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-400'}`}>{sublabel}</p>
    </div>
  );
}
