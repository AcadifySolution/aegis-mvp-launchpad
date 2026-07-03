import React, { useState, useEffect } from 'react';
import { UserStory, FinancialEstimate } from '../types';
import { Users, DollarSign, Clock, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';

interface SprintPlannerProps {
  stories: UserStory[];
  financials: FinancialEstimate | null;
  onUpdate: (payload: { story_ids_priority: string[]; hourly_rate?: number; team_size?: number }) => void;
}

export const SprintPlanner: React.FC<SprintPlannerProps> = ({ stories, financials, onUpdate }) => {
  const [localStories, setLocalStories] = useState<UserStory[]>([]);
  const [rate, setRate] = useState(75);
  const [teamSize, setTeamSize] = useState(2);

  // Sync state with incoming props
  useEffect(() => {
    setLocalStories(stories);
    if (financials) {
      setRate(financials.hourly_rate);
      setTeamSize(financials.team_size);
    }
  }, [stories, financials]);

  // Compute stats locally for responsive, zero-latency drag updates
  const localTotalHours = localStories.reduce((sum, s) => sum + s.estimated_hours, 0);
  const localCost = localTotalHours * rate;
  const localWeeks = Math.max(4, Math.ceil(localTotalHours / (35 * teamSize)));

  // Send update to server
  const triggerSync = (updatedStories: UserStory[], currentRate: number, currentSize: number) => {
    onUpdate({
      story_ids_priority: updatedStories.map(s => s.id),
      hourly_rate: currentRate,
      team_size: currentSize
    });
  };

  const moveStory = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localStories.length) return;

    const copy = [...localStories];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;

    // Recalculate priority classes based on position
    const total = copy.length;
    const reallocated = copy.map((story, idx) => {
      let priority: 'Must-Have' | 'Should-Have' | 'Nice-to-Have' = 'Nice-to-Have';
      if (idx < total * 0.4) priority = 'Must-Have';
      else if (idx < total * 0.75) priority = 'Should-Have';
      return { ...story, priority };
    });

    setLocalStories(reallocated);
    triggerSync(reallocated, rate, teamSize);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    triggerSync(localStories, newRate, teamSize);
  };

  const handleTeamChange = (newSize: number) => {
    setTeamSize(newSize);
    triggerSync(localStories, rate, newSize);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scope Backlog Re-prioritizer */}
      <div className="lg:col-span-2 glass-panel p-6 rounded-2xl shadow-glass">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <Sparkles size={18} className="text-accent-purple" />
              Prioritize MVP Features
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Adjust feature order. Moving stories up automatically sets them as 'Must-Have' (core scope).
            </p>
          </div>
        </div>

        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
          {localStories.map((story, idx) => {
            let priorityBadgeColor = 'bg-accent-rose/10 text-accent-rose border-accent-rose/25';
            if (story.priority === 'Should-Have') {
              priorityBadgeColor = 'bg-accent-indigo/10 text-accent-indigo border-accent-indigo/25';
            } else if (story.priority === 'Nice-to-Have') {
              priorityBadgeColor = 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/25';
            }

            return (
              <div 
                key={story.id} 
                className="flex items-center justify-between p-3.5 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 transition"
              >
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-gray-500 tracking-wider font-bold">
                      {story.id}
                    </span>
                    <h4 className="text-sm font-medium text-gray-200">{story.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold ${priorityBadgeColor}`}>
                      {story.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {story.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right mr-3">
                    <span className="text-xs font-mono font-bold text-gray-300">
                      {story.estimated_hours} hrs
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveStory(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:hover:bg-gray-800 transition"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => moveStory(idx, 'down')}
                      disabled={idx === localStories.length - 1}
                      className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:hover:bg-gray-800 transition"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Budget Calculator */}
      <div className="flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-2xl shadow-glass flex-1">
          <h3 className="text-lg font-semibold text-gray-100 mb-5">Sprint & Cost Controls</h3>

          {/* Rate Controller */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Consulting rate (hourly)</span>
              <span className="text-accent-cyan font-semibold font-mono">${rate}/hr</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              step="5"
              value={rate}
              onChange={(e) => handleRateChange(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1.5 font-mono">
              <span>$50/hr (Boutique)</span>
              <span>$200/hr (Enterprise)</span>
            </div>
          </div>

          {/* Team Size Controller */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Dedicated engineers</span>
              <span className="text-accent-purple font-semibold font-mono">{teamSize} Engineers</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={teamSize}
              onChange={(e) => handleTeamChange(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-accent-purple"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1.5 font-mono">
              <span>1 Dev (Solo)</span>
              <span>5 Devs (Squad)</span>
            </div>
          </div>

          {/* Real-time Estimates Display */}
          <div className="border-t border-gray-800 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <DollarSign size={16} className="text-accent-emerald" />
                <span>Estimated budget</span>
              </div>
              <span className="text-xl font-bold font-mono text-accent-emerald">
                ${localCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock size={16} className="text-accent-cyan" />
                <span>Timeline</span>
              </div>
              <span className="text-lg font-bold font-mono text-accent-cyan">
                {localWeeks} Weeks
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Users size={16} className="text-accent-purple" />
                <span>Development hours</span>
              </div>
              <span className="text-lg font-bold font-mono text-gray-200">
                {localTotalHours} Hrs
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
