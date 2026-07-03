import { useState, useEffect, useRef } from 'react';
import { MVPEstimateResult, SwarmLog } from './types';
import { RoadmapTimeline } from './components/RoadmapTimeline';
import { SprintPlanner } from './components/SprintPlanner';
import { TechSpecView } from './components/TechSpecView';
import { 
  Rocket, Terminal, History, Sparkles, 
  Cpu, Code, Plus, RefreshCw, Layers
} from 'lucide-react';

function App() {
  const [activeProject, setActiveProject] = useState<MVPEstimateResult | null>(null);
  const [logs, setLogs] = useState<SwarmLog[]>([]);
  const [history, setHistory] = useState<MVPEstimateResult[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string>('');
  
  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['Web']);
  const [timeline, setTimeline] = useState(8);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch past estimates on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Autoscroll terminal logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/mvps');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  const startStream = (id: string) => {
    // Connect to Server-Sent Events stream
    const eventSource = new EventSource(`/api/mvps/${id}/stream`);

    eventSource.addEventListener('init', (e) => {
      const data = JSON.parse(e.data);
      setActiveProject(data);
      setLogs(data.logs || []);
    });

    eventSource.addEventListener('log', (e) => {
      const log = JSON.parse(e.data);
      setLogs(prev => [...prev, log]);
      setCurrentAgent(log.agent);
    });

    eventSource.addEventListener('stories', (e) => {
      const stories = JSON.parse(e.data);
      setActiveProject(prev => prev ? { ...prev, user_stories: stories } : null);
    });

    eventSource.addEventListener('tech_spec', (e) => {
      const spec = JSON.parse(e.data);
      setActiveProject(prev => prev ? { ...prev, tech_spec: spec } : null);
    });

    eventSource.addEventListener('financials', (e) => {
      const financials = JSON.parse(e.data);
      setActiveProject(prev => prev ? { ...prev, financials } : null);
    });

    eventSource.addEventListener('complete', (e) => {
      const finalProject = JSON.parse(e.data);
      setActiveProject(finalProject);
      setLogs(finalProject.logs);
      eventSource.close();
      fetchHistory();
    });

    eventSource.onerror = (err) => {
      console.log('SSE Stream Connection Closed or Errored:', err);
      eventSource.close();
    };
  };

  const launchSwarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || description.length < 20) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/mvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Untitled MVP Scope',
          description,
          target_platforms: platforms,
          expected_timeline_weeks: timeline
        })
      });

      if (response.ok) {
        const newProject = await response.json();
        setActiveProject(newProject);
        setLogs([]);
        setCurrentAgent('Product Manager');
        startStream(newProject.id);
      }
    } catch (err) {
      console.error('Error launching agent swarm:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBacklog = async (payload: { story_ids_priority: string[]; hourly_rate?: number; team_size?: number }) => {
    if (!activeProject) return;

    try {
      const response = await fetch(`/api/mvps/${activeProject.id}/backlog`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updated = await response.json();
        setActiveProject(updated);
        fetchHistory();
      }
    } catch (err) {
      console.error('Error updating scope specs:', err);
    }
  };

  const loadPastProject = (project: MVPEstimateResult) => {
    setActiveProject(project);
    setLogs(project.logs || []);
    if (project.status === 'processing') {
      startStream(project.id);
    }
  };

  const populateTemplate = (type: 'health' | 'saas') => {
    if (type === 'health') {
      setName('FitLife Fitbit Sync');
      setDescription('Build a mobile health tracker with custom dashboard analytics, secure user profile synchronization, Fitbit OAuth credentials integration, and secure Doctor reports sharing.');
      setPlatforms(['Mobile', 'Web']);
      setTimeline(10);
    } else {
      setName('SmartSaaS Automation');
      setDescription('Design a web dashboard portal displaying real-time task queues, JWT auth validation, database schema tables, Stripe billing transactions gateway, and AI-powered text summary integrations.');
      setPlatforms(['Web']);
      setTimeline(6);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Banner Navigation */}
      <header className="border-b border-gray-800 bg-gray-950/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-accent-cyan to-accent-indigo flex items-center justify-center shadow-glow-cyan">
              <Rocket className="text-gray-950 stroke-[2.5]" size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Aegis MVP Launchpad
                <span className="text-[10px] bg-accent-cyan/15 text-accent-cyan px-2 py-0.5 rounded border border-accent-cyan/25 font-semibold font-mono">
                  DEMO PORTAL
                </span>
              </h1>
              <p className="text-[10px] text-gray-400">Enterprise MVP Scoping & Agent Swarm Orchestrator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {activeProject && (
              <button 
                onClick={() => { setActiveProject(null); setLogs([]); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-900 hover:bg-gray-800 text-xs font-semibold text-gray-300 transition"
              >
                <Plus size={14} />
                Scope New Idea
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {!activeProject ? (
          /* Landing Screen: Estimator Input + History */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle: Scoping Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-glass relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-indigo/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Sparkles className="text-accent-cyan" size={24} />
                  Initiate AI Swarm Estimation
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  Input your raw product requirements. Our multi-agent swarm (PM, System Architect, and Financial Analyst) will align, build a technical specification, and compute costs.
                </p>

                {/* Templates Quick Launch */}
                <div className="mt-4 flex flex-wrap gap-2.5 items-center">
                  <span className="text-xs text-gray-400">Try template:</span>
                  <button 
                    onClick={() => populateTemplate('health')}
                    className="text-xs px-2.5 py-1 rounded bg-gray-900 border border-gray-800 hover:border-accent-cyan/40 text-gray-300 transition"
                  >
                    Fitbit Health Tracker
                  </button>
                  <button 
                    onClick={() => populateTemplate('saas')}
                    className="text-xs px-2.5 py-1 rounded bg-gray-900 border border-gray-800 hover:border-accent-purple/40 text-gray-300 transition"
                  >
                    SaaS Dashboard app
                  </button>
                </div>

                <form onSubmit={launchSwarm} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Project name (Optional)
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. FitLife Analytics Portal"
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      MVP Requirements & Description (Min 20 characters)
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      required
                      placeholder="Describe what your MVP does: its core purpose, user logins, data integrations, and features..."
                      className="w-full bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Target platforms
                      </span>
                      <div className="flex gap-3">
                        {['Web', 'Mobile', 'Desktop'].map(plat => {
                          const active = platforms.includes(plat);
                          return (
                            <button
                              key={plat}
                              type="button"
                              onClick={() => handlePlatformToggle(plat)}
                              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                                active 
                                  ? 'bg-accent-indigo/10 border-accent-indigo text-accent-indigo' 
                                  : 'bg-gray-950/40 border-gray-800 hover:border-gray-700 text-gray-400'
                              }`}
                            >
                              {plat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        <span>Target timeline</span>
                        <span className="text-accent-cyan font-bold">{timeline} Weeks</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="24"
                        value={timeline}
                        onChange={(e) => setTimeline(Number(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                      />
                      <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                        <span>4 Weeks (Rapid)</span>
                        <span>24 Weeks (Deep)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || description.length < 20}
                    className="w-full py-3.5 bg-gradient-to-r from-accent-cyan via-accent-indigo to-accent-purple text-gray-950 font-bold text-sm rounded-xl shadow-glow-cyan hover:opacity-95 disabled:opacity-50 transition duration-150 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        Initializing Agents...
                      </>
                    ) : (
                      <>
                        <Rocket size={16} strokeWidth={2.5} />
                        Assemble & Launch Agent Swarm
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: History Pane */}
            <div className="glass-panel p-6 rounded-2xl shadow-glass h-fit">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-4">
                <History size={16} className="text-gray-500" />
                Past Estimations
              </h3>
              
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 font-mono">
                  No simulations found.<br />Scope your first MVP above!
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
                  {history.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => loadPastProject(project)}
                      className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 cursor-pointer transition flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs font-semibold text-gray-200 truncate max-w-[140px]">{project.name}</h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          project.status === 'completed' ? 'bg-accent-emerald/10 text-accent-emerald' :
                          project.status === 'processing' ? 'bg-accent-purple/10 text-accent-purple animate-pulse' :
                          'bg-accent-rose/10 text-accent-rose'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex justify-between items-center mt-2 text-[9px] text-gray-500 font-mono">
                        <span>{new Date(project.created_at * 1000).toLocaleDateString()}</span>
                        {project.financials && <span>${project.financials.total_cost.toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dashboard Workspace screen */
          <div className="space-y-6">
            {/* Top overview status */}
            <div className="glass-panel p-6 rounded-2xl shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white">{activeProject.name}</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold font-mono ${
                    activeProject.status === 'completed' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-purple/15 text-accent-purple animate-pulse'
                  }`}>
                    {activeProject.status === 'completed' ? 'Complete Spec Compiled' : 'Swarm Scoping active'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 max-w-xl truncate">{activeProject.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setActiveProject(null); setLogs([]); }}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-800 bg-gray-900 hover:bg-gray-800 text-xs font-semibold text-gray-400 hover:text-white transition"
                >
                  Close Scope
                </button>
              </div>
            </div>

            {/* If processing: Show timeline + logs terminal */}
            {activeProject.status === 'processing' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual SVG Timeline map */}
                <div className="lg:col-span-2">
                  <RoadmapTimeline status="processing" currentAgent={currentAgent} />
                </div>

                {/* Swarm Live Console Logs */}
                <div className="glass-panel p-6 rounded-2xl shadow-glass flex flex-col h-[320px]">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2 mb-3">
                    <Terminal size={16} className="text-accent-purple stroke-[2.5]" />
                    AI Agent Swarm Stream
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-rose blink-indicator"></span>
                  </h3>
                  
                  <div className="flex-1 bg-gray-950 border border-gray-900 rounded-xl p-4 overflow-y-auto font-mono text-[11px] space-y-2.5">
                    {logs.map((log, i) => (
                      <div key={i} className="leading-relaxed">
                        <span className={`font-semibold ${
                          log.agent.includes('Manager') ? 'text-accent-cyan' :
                          log.agent.includes('Architect') ? 'text-accent-purple' : 'text-accent-emerald'
                        }`}>
                          [{log.agent}]:
                        </span>{' '}
                        <span className="text-gray-300">{log.message}</span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              </div>
            ) : (
              /* If completed: Show full interactive dashboard workspace */
              <>
                {/* Stage 1: Roadmap Timeline visual */}
                <RoadmapTimeline status="completed" />

                {/* Stage 2: Sprint planner and Cost Controller */}
                <SprintPlanner 
                  stories={activeProject.user_stories} 
                  financials={activeProject.financials} 
                  onUpdate={updateBacklog}
                />

                {/* Stage 3: System spec blueprint details */}
                <TechSpecView spec={activeProject.tech_spec} />
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-900 bg-gray-950 py-6 text-center text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <span>Aegis MVP Launchpad &bull; Created for demonstration of enterprise agency quality.</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Cpu size={12} /> FastAPI</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1"><Code size={12} /> React + TS</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1"><Layers size={12} /> Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
