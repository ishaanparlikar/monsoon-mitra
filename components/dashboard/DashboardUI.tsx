'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronUp, Check, AlertTriangle, Home, FileText, Package, MapPin, HeartPulse, MessageSquare, RefreshCw, Bell, MoreHorizontal, Droplet, X, Menu } from 'lucide-react';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { updateChecklistItem, askAssistant } from '@/app/actions';

const categoryConfig: Record<string, { icon: any; label: string }> = {
  home_prep: { icon: Home, label: 'Home Prep' },
  documents: { icon: FileText, label: 'Documents' },
  emergency_kit: { icon: Package, label: 'Emergency Kit' },
  evacuation: { icon: MapPin, label: 'Evacuation' },
  health: { icon: HeartPulse, label: 'Health' },
  communication: { icon: MessageSquare, label: 'Communication' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300', label: 'Critical' },
  high: { color: 'bg-caution-100 text-caution-800 dark:bg-caution-900/30 dark:text-caution-300', label: 'High' },
  medium: { color: 'bg-water-100 text-water-800 dark:bg-water-900/30 dark:text-water-300', label: 'Medium' },
  low: { color: 'bg-safe-100 text-safe-800 dark:bg-safe-900/30 dark:text-safe-300', label: 'Low' },
};

export interface DashboardUIProps {
  initialChecklist: any[];
  planDetails: any;
  alerts: any[];
  riskScore: number;
}

export function DashboardUI({ initialChecklist, planDetails, alerts, riskScore }: DashboardUIProps) {
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<any[]>(initialChecklist);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosStep, setSosStep] = useState<'confirm' | 'sending' | 'sent'>('confirm');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, startSosTransition] = useTransition();

  const [qaQuery, setQaQuery] = useState('');
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  const SUGGESTED_QUERIES = [
    { text: '📍 Nearest shelters?', query: 'Where is the nearest shelter from my location?' },
    { text: '🛠️ Secure housing?', query: 'How do I secure my house for the storm?' },
    { text: '🎒 Emergency kit?', query: 'What items do I need in my emergency kit?' },
    { text: '📊 Risk breakdown?', query: 'Explain my family risk score.' },
  ];

  const handleQaSubmit = async (queryText: string) => {
    if (!queryText.trim()) return;
    setQaLoading(true);
    setQaError(null);
    setQaAnswer(null);
    try {
      const res = await askAssistant(queryText, planDetails?.family_id);
      if (res.success) {
        setQaAnswer(res.answer);
      } else {
        setQaError(res.error || 'Failed to get a response. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setQaError('An unexpected error occurred.');
    } finally {
      setQaLoading(false);
    }
  };

  const renderQAPanel = () => {
    return (
      <Card className="border border-cloud-200 dark:border-storm-700 bg-white/80 dark:bg-storm-800/80 backdrop-blur-md shadow-cloud-shadow relative overflow-hidden transition-all duration-300">
        <CardContent className="p-5">
          <h3 className="font-semibold text-storm-900 dark:text-white mb-2 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-water-500 animate-pulse" />
            Monsoon Mitra AI Assistant
          </h3>
          <p className="text-xs text-cloud-600 dark:text-cloud-300 mb-4 leading-normal">
            Ask about shelters, packing kits, or securing your home. Answers are tailored to your family profile.
          </p>

          {/* Suggested Queries */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_QUERIES.map((qObj, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQaQuery(qObj.query);
                  handleQaSubmit(qObj.query);
                }}
                disabled={qaLoading}
                className="text-xs px-3 py-1.5 rounded-full bg-water-50 dark:bg-water-950/45 text-water-700 dark:text-water-300 border border-water-100 dark:border-water-900 hover:bg-water-100 dark:hover:bg-water-900/60 transition-all font-medium flex items-center gap-1 active:scale-95 disabled:opacity-50 min-h-[32px] cursor-pointer"
              >
                {qObj.text}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={qaQuery}
              onChange={(e) => setQaQuery(e.target.value)}
              placeholder="Ask anything..."
              disabled={qaLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQaSubmit(qaQuery);
              }}
              className="flex-1 px-4 py-2 text-sm rounded-xl border border-cloud-300 dark:border-storm-600 bg-white dark:bg-storm-900 text-storm-900 dark:text-white placeholder-cloud-400 dark:placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-water-500 transition-all min-h-[44px]"
            />
            <Button
              onClick={() => handleQaSubmit(qaQuery)}
              disabled={qaLoading}
              className="px-4 bg-water-500 hover:bg-water-600 text-white min-h-[44px]"
            >
              Ask
            </Button>
          </div>

          {/* Response / Loading Section */}
          {(qaLoading || qaAnswer || qaError) && (
            <div className="mt-4 p-4 rounded-2xl bg-cloud-50 dark:bg-storm-900/50 border border-cloud-100 dark:border-storm-800 transition-all">
              {qaLoading && (
                <div className="space-y-3 py-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-water-505 rounded-full animate-bounce animate-duration-1000" />
                    <p className="text-xs text-cloud-500 dark:text-cloud-400 font-semibold font-mono tracking-wider">MITRA IS THINKING...</p>
                  </div>
                  <div className="h-3 bg-cloud-200 dark:bg-storm-850 rounded w-full" />
                  <div className="h-3 bg-cloud-200 dark:bg-storm-850 rounded w-[90%]" />
                  <div className="h-3 bg-cloud-205 dark:bg-storm-850 rounded w-[75%]" />
                </div>
              )}

              {qaError && (
                <p className="text-sm text-danger-600 dark:text-danger-400">{qaError}</p>
              )}

              {qaAnswer && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-storm-850 dark:text-cloud-200 leading-relaxed font-normal space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {qaAnswer.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={idx} className="font-bold text-sm text-storm-905 dark:text-white mt-3 mb-1">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return <li key={idx} className="list-disc ml-4 my-1 text-xs">{line.substring(2)}</li>;
                    }
                    if (/^\d+\.\s/.test(line)) {
                      return <li key={idx} className="list-decimal ml-4 my-1 text-xs">{line.replace(/^\d+\.\s/, '')}</li>;
                    }
                    if (!line.trim()) {
                      return <div key={idx} className="h-2" />;
                    }
                    // Handle bold highlights
                    const parts = line.split('**');
                    if (parts.length > 1) {
                      return (
                        <p key={idx} className="my-1 text-xs">
                          {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-water-650 dark:text-water-300 font-bold">{p}</strong> : p)}
                        </p>
                      );
                    }
                    return <p key={idx} className="my-1 text-xs">{line}</p>;
                  })}
                  <div className="pt-3 border-t border-cloud-200/50 dark:border-storm-800/80 flex items-center justify-between">
                    <span className="text-[9px] text-cloud-450 dark:text-storm-500 font-mono">GENERATED BY MONSOON MITRA AI</span>
                    <button
                      onClick={() => {
                        setQaAnswer(null);
                        setQaQuery('');
                      }}
                      className="text-[10px] text-water-600 dark:text-water-400 font-bold hover:underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const categories = Array.from(new Set(checklist.map(item => item.category)));
  const criticalActions = checklist.filter(i => !i.is_completed && i.priority === 'critical');
  const completedCount = checklist.filter(i => i.is_completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  const handleSOS = () => {
    setSosStep('confirm');
    setSosModalOpen(true);
  };

  const confirmSOS = () => {
    setSosStep('sending');
    startSosTransition(async () => {
      try {
        await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        await new Promise(r => setTimeout(r, 1000));
        setSosStep('sent');
      } catch {
        await new Promise(r => setTimeout(r, 800));
        setSosStep('sent');
      }
    });
  };

  const toggleChecklistItem = async (itemId: string, currentStatus: boolean) => {
    setChecklist(prev => prev.map(item => item.id === itemId ? { ...item, is_completed: !currentStatus } : item));
    if (planDetails?.id) {
      await updateChecklistItem(planDetails.id, itemId, !currentStatus);
    }
  };

  return (
    <div className="min-h-screen pb-32 lg:pb-8 safe-all bg-paper-dry dark:bg-storm-900 relative overflow-hidden">
      {/* Water surface pattern overlay */}
      <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="water-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q5 8 10 10 T20 10" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#water-pattern)" />
        </svg>
      </div>

      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-paper-dry dark:bg-storm-900 border-b border-cloud-200 dark:border-storm-700 shadow-cloud-shadow">
        <div className="hidden lg:block bg-storm-700 dark:bg-storm-800">
          <div className="desktop-container">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-water-500 flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-white text-lg">Monsoon Mitra</span>
              </div>
              <nav className="flex items-center gap-6">
                <a href="#" className="text-white/80 hover:text-white text-sm font-medium">Dashboard</a>
                <a href="#" className="text-white/80 hover:text-white text-sm font-medium">Alerts</a>
                <a href="#" className="text-white/80 hover:text-white text-sm font-medium">Shelters</a>
                <a href="#" className="text-white/80 hover:text-white text-sm font-medium">Family</a>
              </nav>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                  <Bell className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-storm-700 dark:bg-storm-600 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-semibold text-storm-900 dark:text-white text-lg">Monsoon Mitra</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="text-storm-600 dark:text-cloud-200" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-storm-600 dark:text-cloud-200 lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menu">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Main Content */}
      <main className="hidden lg:block">
        <div className="desktop-container py-6">
          <div className="desktop-grid">
            {/* Main Content Column */}
            <div className="space-y-6">
              {/* Risk Score Card */}
              <Card className="bg-white dark:bg-storm-800 border-cloud-200 dark:border-storm-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-water-500 to-water-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{riskScore}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cloud-600 dark:text-cloud-300">Monsoon Risk Score</p>
                        <p className="text-3xl font-bold text-storm-900 dark:text-white mt-1">
                          {riskScore >= 75 ? 'Critical Risk' : riskScore >= 50 ? 'High Risk' : 'Moderate Risk'}
                        </p>
                        <p className="text-sm text-cloud-500 dark:text-cloud-400 mt-1">Mumbai Suburban District</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="success" className="text-xs">Location Active</Badge>
                      {alerts.length > 0 && <Badge variant="critical" className="text-xs">{alerts.length} Alerts</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Checklist Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-storm-900 dark:text-white">Preparedness Checklist</h2>
                  <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                </div>

                {/* Progress Bar */}
                <Card className="bg-white dark:bg-storm-800 border-cloud-200 dark:border-storm-700 mb-4">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <span className="text-sm font-medium text-cloud-600 dark:text-cloud-300">Overall Progress</span>
                        <p className="text-2xl font-bold text-storm-900 dark:text-white mt-1">{progressPercent}%</p>
                      </div>
                      <span className="text-sm text-cloud-500 dark:text-cloud-400">{completedCount} of {checklist.length} completed</span>
                    </div>
                    <div className="rain-channel h-3">
                      <div className="rain-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </CardContent>
                </Card>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-4" role="tablist">
                  <button
                    onClick={() => setFilter('all')}
                    role="tab"
                    aria-selected={filter === 'all'}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${filter === 'all' ? 'bg-storm-700 text-white' : 'bg-cloud-100 dark:bg-storm-800 text-cloud-700 dark:text-cloud-200 hover:bg-cloud-200 dark:hover:bg-storm-700'}`}
                  >
                    All
                  </button>
                  {categories.map(cat => {
                    if (!cat) return null;
                    return (
                      <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        role="tab"
                        aria-selected={filter === cat}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${filter === cat ? 'bg-storm-700 text-white' : 'bg-cloud-100 dark:bg-storm-800 text-cloud-700 dark:text-cloud-200 hover:bg-cloud-200 dark:hover:bg-storm-700'}`}
                      >
                        {categoryConfig[cat]?.label || cat}
                      </button>
                    );
                  })}
                </div>

                {/* Checklist Items */}
                <Card className="bg-white dark:bg-storm-800 border-cloud-200 dark:border-storm-700 overflow-hidden">
                  <div className="divide-y divide-cloud-200 dark:divide-storm-700">
                    {categories.map(category => {
                      if (!category) return null;
                      const items = checklist.filter(item => item.category === category && (filter === 'all' || filter === category));
                      if (items.length === 0) return null;

                      return (
                        <div key={category}>
                          <div className="px-5 py-4 bg-cloud-50 dark:bg-storm-800/50 border-b border-cloud-200 dark:border-storm-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {categoryConfig[category]?.icon && (
                                <div className="w-8 h-8 rounded-lg bg-storm-100 dark:bg-storm-700 flex items-center justify-center">
                                  {(() => {
                                    const Icon = categoryConfig[category].icon;
                                    return <Icon className="w-4 h-4 text-storm-600 dark:text-cloud-300" />;
                                  })()}
                                </div>
                              )}
                              <span className="font-medium text-storm-900 dark:text-white">{categoryConfig[category]?.label || category}</span>
                            </div>
                            <span className="text-sm text-cloud-500 dark:text-cloud-400">
                              {items.filter(i => i.is_completed).length}/{items.length}
                            </span>
                          </div>
                          {items.map(item => (
                            <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-cloud-50 dark:hover:bg-storm-800/50 transition-colors">
                              <button
                                onClick={() => toggleChecklistItem(item.id, item.is_completed)}
                                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${item.is_completed ? 'bg-safe-500 border-safe-500' : 'border-cloud-300 dark:border-storm-600 hover:border-storm-500'}`}
                                aria-label={item.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
                              >
                                {item.is_completed && <Check className="w-4 h-4 text-white" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${item.is_completed ? 'line-through text-cloud-400 dark:text-storm-500' : 'text-storm-900 dark:text-white'}`}>
                                  {item.item_text}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  {item.priority && (
                                    <Badge
                                      variant={item.priority === 'critical' ? 'critical' : item.priority === 'high' ? 'warning' : item.priority === 'medium' ? 'info' : 'success'}
                                      className="text-[10px]"
                                    >
                                      {priorityConfig[item.priority]?.label}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </section>
            </div>

            {/* Desktop Sidebar */}
            <div className="desktop-sidebar space-y-6">
              {renderQAPanel()}
              {/* Critical Actions */}
              {criticalActions.length > 0 && (
                <Card className="bg-white dark:bg-storm-800 border-danger-200 dark:border-danger-800/50">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-storm-900 dark:text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-danger-500" />
                      Critical Actions
                    </h3>
                    <div className="space-y-3">
                      {criticalActions.slice(0, 5).map((action) => (
                        <div key={action.id} className="flex items-start gap-3 p-3 bg-danger-50 dark:bg-danger-900/20 rounded-xl">
                          <AlertTriangle className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium text-storm-900 dark:text-white">{action.item_text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weather Alerts */}
              {alerts.length > 0 && (
                <Card className="bg-white dark:bg-storm-800 border-caution-200 dark:border-caution-800/50">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-storm-900 dark:text-white mb-3 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-caution-500" />
                      Active Alerts
                    </h3>
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="p-3 bg-caution-50 dark:bg-caution-900/20 rounded-xl border-l-4 border-caution-500">
                          <h4 className="font-medium text-storm-900 dark:text-white text-sm">{alert.title}</h4>
                          <p className="text-xs text-cloud-600 dark:text-cloud-300 mt-1">{alert.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="bg-white dark:bg-storm-800 border-cloud-200 dark:border-storm-700">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-storm-900 dark:text-white mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="destructive" fullWidth className="justify-start">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Send SOS
                    </Button>
                    <Button variant="outline" fullWidth className="justify-start dark:border-storm-600 dark:text-cloud-200">
                      <Bell className="w-4 h-4 mr-2" />
                      View Alerts
                    </Button>
                    <Button variant="outline" fullWidth className="justify-start dark:border-storm-600 dark:text-cloud-200">
                      <MapPin className="w-4 h-4 mr-2" />
                      Find Shelter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Main Content */}
      <main className="lg:hidden px-4 py-4 space-y-6 pb-28 relative">
        {/* Risk Score Card */}
        <Card className="bg-white dark:bg-storm-800 border-cloud-200 dark:border-storm-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-cloud-600 dark:text-cloud-300 text-sm font-medium">Monsoon Risk Score</p>
                <p className="text-4xl font-bold mt-1 text-storm-900 dark:text-white">{riskScore}</p>
                <p className="text-cloud-500 dark:text-cloud-400 text-xs mt-1 uppercase tracking-wide font-medium">
                  {riskScore >= 75 ? 'Critical Risk' : riskScore >= 50 ? 'High Risk - Action Required' : 'Moderate Risk'}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-cloud-200 dark:border-storm-600 flex items-center justify-center bg-white/50 dark:bg-storm-800/50">
                <span className="text-xl font-bold text-storm-800 dark:text-white">{riskScore}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" className="text-xs">Location check active</Badge>
              {alerts.length > 0 && <Badge variant="critical" className="text-xs">Active Alerts</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Monsoon Mitra AI Assistant */}
        {renderQAPanel()}

        {/* Critical Actions */}
        {criticalActions.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-storm-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
              Critical Actions
            </h2>
            <div className="space-y-2">
              {criticalActions.slice(0, 3).map((action) => (
                <Card key={action.id} className="border-l-4 border-danger-500 bg-danger-50/30 dark:bg-danger-900/20">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-danger-100 dark:bg-danger-900/50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-storm-900 dark:text-white">{action.item_text}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => toggleChecklistItem(action.id, action.is_completed)}
                      className="ml-2 bg-danger-500 hover:bg-danger-600 border-none"
                    >
                      Done
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Weather Alerts */}
        {alerts.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-storm-900 dark:text-white mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-caution-500" />
              Active Weather Alerts
            </h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-caution-500 bg-white dark:bg-storm-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-caution-100 dark:bg-caution-900/50 flex items-center justify-center flex-shrink-0">
                        <Droplet className="w-4 h-4 text-caution-600 dark:text-caution-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-storm-900 dark:text-white">{alert.title}</h3>
                        <p className="text-sm text-cloud-600 dark:text-cloud-300 mt-1">{alert.description}</p>
                        <p className="text-xs text-cloud-500 dark:text-cloud-400 mt-2 italic font-medium">{alert.instruction}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Checklist */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-storm-900 dark:text-white">Preparedness Checklist</h2>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-cloud-600 dark:text-cloud-300">We are getting ready</span>
              <span className="text-sm font-semibold text-water-600 dark:text-water-400">
                {progressPercent}%
              </span>
            </div>
            <div className="rain-channel">
              <div
                className="rain-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4" role="tablist">
            <button
              onClick={() => setFilter('all')}
              role="tab"
              aria-selected={filter === 'all'}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${filter === 'all' ? 'bg-storm-700 text-white' : 'bg-cloud-100 dark:bg-storm-800 text-cloud-700 dark:text-cloud-200 hover:bg-cloud-200 dark:hover:bg-storm-700'}`}
            >
              All
            </button>
            {categories.map(cat => {
              if (!cat) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  role="tab"
                  aria-selected={filter === cat}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${filter === cat ? 'bg-storm-700 text-white' : 'bg-cloud-100 dark:bg-storm-800 text-cloud-700 dark:text-cloud-200 hover:bg-cloud-200 dark:hover:bg-storm-700'}`}
                >
                  {categoryConfig[cat]?.label || cat}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {categories.map(category => {
              if (!category) return null;
              const items = checklist.filter(item => item.category === category && (filter === 'all' || filter === category));
              if (items.length === 0) return null;

              const catCompleted = items.filter(i => i.is_completed).length;
              const catTotal = items.length;
              const catProgress = (catCompleted / catTotal) * 100;
              const CategoryIcon = categoryConfig[category]?.icon;

              return (
                <Card key={category} className="overflow-hidden border-cloud-200 dark:border-storm-700 bg-white dark:bg-storm-800">
                  <button
                    onClick={() => setExpanded(expanded === category ? null : category)}
                    className="w-full p-4 flex items-center justify-between bg-cloud-50 dark:bg-storm-800 border-b border-cloud-200 dark:border-storm-700"
                    aria-expanded={expanded === category}
                  >
                    <div className="flex items-center gap-3">
                      {CategoryIcon && <CategoryIcon className="w-5 h-5 text-cloud-600 dark:text-cloud-300" aria-hidden="true" />}
                      <span className="font-medium text-storm-900 dark:text-white capitalize">{categoryConfig[category]?.label || category}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${catCompleted === catTotal ? 'bg-safe-100 text-safe-700 dark:bg-safe-900/30 dark:text-safe-300' : 'bg-cloud-200 text-cloud-700 dark:bg-storm-700 dark:text-cloud-200'}`}>
                        {catCompleted}/{catTotal}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-cloud-200 dark:bg-storm-700 rounded-full overflow-hidden border border-cloud-300 dark:border-storm-600">
                        <div className="h-full bg-water-500 rounded-full transition-all rain-fill" style={{ width: `${catProgress}%` }} />
                      </div>
                      {expanded === category ? <ChevronUp className="w-5 h-5 text-cloud-500" /> : <ChevronDown className="w-5 h-5 text-cloud-500" />}
                    </div>
                  </button>

                  {expanded === category && (
                    <div className="divide-y divide-cloud-200 dark:divide-storm-700">
                      {items.map(item => {
                        const ItemCategoryIcon = categoryConfig[item.category]?.icon;
                        return (
                          <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-cloud-50 dark:hover:bg-storm-800/50 transition-colors">
                            <button
                              onClick={() => toggleChecklistItem(item.id, item.is_completed)}
                              className={`flex-shrink-0 w-6 h-6 rounded-[4px] border-2 transition-colors ${item.is_completed ? 'bg-safe-500 border-safe-500' : 'border-cloud-300 dark:border-storm-600 hover:border-storm-500'}`}
                              aria-label={item.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
                              aria-pressed={item.is_completed}
                            >
                              {item.is_completed && <Check className="w-4 h-4 text-white" aria-hidden="true" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-medium text-storm-900 dark:text-white ${item.is_completed ? 'line-through text-cloud-500 dark:text-storm-500' : ''}`}>
                                  {item.item_text}
                                </h4>
                                {item.priority && (
                                  <Badge variant={item.priority === 'critical' ? 'critical' : item.priority === 'high' ? 'warning' : item.priority === 'medium' ? 'info' : 'success'} className="text-[10px]">
                                    {priorityConfig[item.priority]?.label || item.priority}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3 mt-2 text-xs text-cloud-500 dark:text-cloud-400">
                                <span className="flex items-center gap-1">
                                  {ItemCategoryIcon && <ItemCategoryIcon className="w-3 h-3" />}
                                  {categoryConfig[item.category]?.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <div className="lg:hidden">
        <BottomNavigation />
      </div>

      {/* SOS Button - Mobile Only */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 safe-bottom lg:hidden">
        <Button
          variant="destructive"
          size="xl"
          className="rounded-full px-8 py-4 min-w-[140px] shadow-xl"
          onClick={handleSOS}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-black tracking-widest">SOS</span>
            <span className="text-xs font-bold uppercase leading-tight">Emergency</span>
          </div>
        </Button>
      </div>

      {/* SOS Modal */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => sosStep !== 'sending' && setSosModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-storm-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-8 animate-slide-up">
            {sosStep === 'confirm' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-danger-100 dark:bg-danger-900/50 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
                  </div>
                  <button onClick={() => setSosModalOpen(false)} className="w-8 h-8 rounded-full bg-cloud-100 dark:bg-storm-700 flex items-center justify-center">
                    <X className="w-4 h-4 text-cloud-600 dark:text-cloud-300" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-storm-900 dark:text-white mb-2">Send Emergency SOS?</h2>
                <p className="text-sm text-cloud-600 dark:text-cloud-300 mb-6 leading-relaxed">
                  This will send your location to emergency services and NDMA response teams.
                  Only use this in a genuine emergency.
                </p>
                <div className="space-y-2">
                  <Button variant="destructive" fullWidth onClick={confirmSOS}>
                    Yes, Send SOS
                  </Button>
                  <Button variant="ghost" fullWidth onClick={() => setSosModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-center text-cloud-400 dark:text-storm-500 mt-3">You can also call <strong>112</strong> or <strong>1078</strong> directly</p>
              </>
            )}
            {sosStep === 'sending' && (
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/50 flex items-center justify-center mx-auto animate-pulse">
                  <Droplet className="w-8 h-8 text-danger-500" />
                </div>
                <p className="font-semibold text-storm-900 dark:text-white">Sending SOS...</p>
                <p className="text-sm text-cloud-500 dark:text-cloud-400">Getting your location and alerting emergency services</p>
              </div>
            )}
            {sosStep === 'sent' && (
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-safe-100 dark:bg-safe-900/50 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-safe-600 dark:text-safe-400" />
                </div>
                <div>
                  <p className="font-bold text-storm-900 dark:text-white text-lg">SOS Sent!</p>
                  <p className="text-sm text-cloud-600 dark:text-cloud-300 mt-1">Emergency services have been notified.</p>
                </div>
                <div className="bg-cloud-50 dark:bg-storm-800 rounded-2xl p-3 text-left space-y-1">
                  <p className="text-xs font-semibold text-cloud-700 dark:text-cloud-200">While waiting for help:</p>
                  <p className="text-xs text-cloud-600 dark:text-cloud-400">• Stay in a safe location</p>
                  <p className="text-xs text-cloud-600 dark:text-cloud-400">• Keep your phone charged</p>
                  <p className="text-xs text-cloud-600 dark:text-cloud-400">• Call 112 if danger is immediate</p>
                </div>
                <Button variant="primary" fullWidth onClick={() => setSosModalOpen(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
