import React from 'react';
import { Check, Loader2, ShieldAlert } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface RoadmapTimelineProps {
  status: 'processing' | 'completed' | 'failed';
  currentAgent?: string;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ status, currentAgent }) => {
  // Derive stages from backend processing status
  const getStages = (): Stage[] => {
    if (status === 'processing') {
      const activeAgent = currentAgent || '';
      return [
        {
          id: 'specs',
          name: 'Requirements definition',
          description: 'PM creates backlog user stories',
          status: activeAgent.includes('Product') ? 'running' : 'completed'
        },
        {
          id: 'architecture',
          name: 'System architecture',
          description: 'Architect designs APIs and schemas',
          status: activeAgent.includes('Architect') ? 'running' : (activeAgent.includes('Product') ? 'pending' : 'completed')
        },
        {
          id: 'finance',
          name: 'Budgeting & scheduling',
          description: 'Analyst calculates timeline & milestones',
          status: activeAgent.includes('Analyst') ? 'running' : 'pending'
        },
        {
          id: 'build',
          name: 'MVP Core build',
          description: 'Full stack development & coding',
          status: 'pending'
        },
        {
          id: 'launch',
          name: 'Production release',
          description: 'AWS ECS deploy & analytics config',
          status: 'pending'
        }
      ];
    } else if (status === 'completed') {
      return [
        { id: 'specs', name: 'Requirements definition', description: 'PM backlog created', status: 'completed' },
        { id: 'architecture', name: 'System architecture', description: 'APIs & Schemas defined', status: 'completed' },
        { id: 'finance', name: 'Budgeting & scheduling', description: 'Projections compiled', status: 'completed' },
        { id: 'build', name: 'MVP Core build', description: 'Estimated at 80% acceleration', status: 'completed' },
        { id: 'launch', name: 'Production release', description: 'Ready to deploy', status: 'completed' }
      ];
    } else {
      return [
        { id: 'specs', name: 'Requirements definition', description: 'Failed to process specs', status: 'failed' },
        { id: 'architecture', name: 'System architecture', description: 'Aborted', status: 'pending' },
        { id: 'finance', name: 'Budgeting & scheduling', description: 'Aborted', status: 'pending' },
        { id: 'build', name: 'MVP Core build', description: 'Aborted', status: 'pending' },
        { id: 'launch', name: 'Production release', description: 'Aborted', status: 'pending' }
      ];
    }
  };

  const stages = getStages();

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-glass">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-accent-cyan to-accent-indigo bg-clip-text text-transparent">
          Project Roadmap & Development Milestones
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan animate-pulse"></span>
          <span>Engine Connected</span>
        </div>
      </div>

      {/* SVG Roadmap Visualizer */}
      <div className="relative overflow-x-auto py-4">
        <div className="min-w-[700px] flex flex-col justify-center items-center">
          <svg className="w-full h-24 mb-4" viewBox="0 0 800 100">
            {/* SVG Connecting Paths */}
            {stages.slice(0, -1).map((stage, idx) => {
              const startX = 80 + idx * 160;
              const endX = 80 + (idx + 1) * 160;
              const isCompleted = stage.status === 'completed';
              const isRunning = stage.status === 'running';

              return (
                <g key={`path-${idx}`}>
                  {/* Background path */}
                  <line 
                    x1={startX} 
                    y1="50" 
                    x2={endX} 
                    y2="50" 
                    stroke="rgba(255,255,255,0.06)" 
                    strokeWidth="4" 
                  />
                  {/* Glowing active flow line */}
                  {(isCompleted || isRunning) && (
                    <line
                      x1={startX}
                      y1="50"
                      x2={endX}
                      y2="50"
                      stroke={isCompleted ? '#06b6d4' : '#a855f7'}
                      strokeWidth="3"
                      className={isRunning ? "animated-flow-line" : ""}
                      strokeLinecap="round"
                    />
                  )}
                </g>
              );
            })}

            {/* SVG Interactive Nodes */}
            {stages.map((stage, idx) => {
              const x = 80 + idx * 160;
              const y = 50;
              
              let ringColor = 'stroke-gray-800';
              let fillColor = 'fill-gray-950';
              let iconColor = 'text-gray-500';
              let glowColor = '';
              let isPulse = false;

              if (stage.status === 'completed') {
                ringColor = 'stroke-accent-cyan';
                fillColor = 'fill-accent-cyan/10';
                iconColor = 'text-accent-cyan';
                glowColor = 'drop-shadow([0_0_8px_rgba(6,182,212,0.6)])';
              } else if (stage.status === 'running') {
                ringColor = 'stroke-accent-purple';
                fillColor = 'fill-accent-purple/20';
                iconColor = 'text-accent-purple';
                glowColor = 'drop-shadow([0_0_8px_rgba(168,85,247,0.8)])';
                isPulse = true;
              } else if (stage.status === 'failed') {
                ringColor = 'stroke-accent-rose';
                fillColor = 'fill-accent-rose/20';
                iconColor = 'text-accent-rose';
              }

              return (
                <g key={stage.id} className={`${glowColor}`}>
                  {/* Pulsing glow under active node */}
                  {isPulse && (
                    <circle
                      cx={x}
                      cy={y}
                      r="22"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2"
                      className="animate-ping opacity-35"
                    />
                  )}
                  {/* Node Base */}
                  <circle
                    cx={x}
                    cy={y}
                    r="16"
                    className={`${fillColor} ${ringColor}`}
                    strokeWidth="2.5"
                  />
                  {/* Status Indicator Icon */}
                  <foreignObject x={x - 8} y={y - 8} width="16" height="16">
                    <div className={`flex items-center justify-center w-full h-full ${iconColor}`}>
                      {stage.status === 'completed' && <Check size={10} strokeWidth={3} />}
                      {stage.status === 'running' && <Loader2 size={10} className="animate-spin" />}
                      {stage.status === 'failed' && <ShieldAlert size={10} />}
                      {stage.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          {/* Node Labels */}
          <div className="grid grid-cols-5 w-full text-center gap-1 px-4">
            {stages.map((stage) => (
              <div key={stage.id} className="flex flex-col items-center">
                <span className={`text-xs font-semibold tracking-wide ${
                  stage.status === 'running' ? 'text-accent-purple' :
                  stage.status === 'completed' ? 'text-accent-cyan' : 'text-gray-400'
                }`}>
                  {stage.name}
                </span>
                <span className="text-[10px] text-gray-500 mt-1 max-w-[120px] leading-tight">
                  {stage.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
