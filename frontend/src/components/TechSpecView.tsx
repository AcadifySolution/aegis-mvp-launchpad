import React, { useState } from 'react';
import { TechSpec } from '../types';
import { Cpu, Globe, Database, Server, Compass, Network } from 'lucide-react';

interface TechSpecViewProps {
  spec: TechSpec | null;
}

export const TechSpecView: React.FC<TechSpecViewProps> = ({ spec }) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'endpoints' | 'db'>('stack');

  if (!spec) {
    return (
      <div className="glass-panel p-8 rounded-2xl shadow-glass text-center text-gray-500">
        Waiting for System Architect to release specifications...
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl shadow-glass overflow-hidden">
      {/* Header and Tabs */}
      <div className="border-b border-gray-800 bg-gray-900/40 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Cpu size={18} className="text-accent-cyan" />
            System Architecture Spec
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Automated production blueprints designed by the System Architect swarm agent.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex border border-gray-800 rounded-lg p-0.5 bg-gray-900">
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === 'stack' 
                ? 'bg-accent-cyan text-gray-950 font-bold' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Tech Stack
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === 'endpoints' 
                ? 'bg-accent-cyan text-gray-950 font-bold' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            API Endpoints
          </button>
          <button
            onClick={() => setActiveTab('db')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === 'db' 
                ? 'bg-accent-cyan text-gray-950 font-bold' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Database tables
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {activeTab === 'stack' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan shrink-0">
                <Globe size={18} />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Frontend Stack</h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {spec.frontend.map((item, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700 font-mono">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple shrink-0">
                <Server size={18} />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Backend Server</h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {spec.backend.map((item, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700 font-mono">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-accent-emerald/10 flex items-center justify-center text-accent-emerald shrink-0">
                <Database size={18} />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Database Layer</h4>
                <p className="text-sm font-semibold text-gray-200 mt-2 font-mono">{spec.database}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-accent-indigo shrink-0">
                <Compass size={18} />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Infrastructure Hosting</h4>
                <p className="text-sm font-semibold text-gray-200 mt-2 font-mono">{spec.hosting}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'endpoints' && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {spec.endpoints.map((endpoint, i) => {
              const isPost = endpoint.method === 'POST';
              return (
                <div key={i} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex flex-col md:flex-row md:items-center gap-3.5 justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded font-mono ${
                      isPost ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20' : 
                      'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="text-xs font-mono font-semibold text-gray-200">{endpoint.path}</span>
                  </div>
                  <span className="text-xs text-gray-400">{endpoint.description}</span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'db' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
            {spec.schemas.map((schema, i) => (
              <div key={i} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                <h4 className="text-xs font-bold text-accent-cyan flex items-center gap-1.5 font-mono">
                  <Network size={14} />
                  Table: {schema.table_name}
                </h4>
                <div className="mt-3.5 space-y-1.5">
                  {schema.columns.map((col, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-mono bg-gray-900/40 p-1.5 rounded border border-gray-800/50">
                      <span className="text-gray-300">{col.split(' ')[0]}</span>
                      <span className="text-gray-500 text-[10px]">{col.split(' ')[1] || 'TYPE'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
