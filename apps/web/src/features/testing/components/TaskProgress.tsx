import React from 'react';
import { Target, CheckCircle2, Clock, Activity, AlertCircle } from 'lucide-react';
import { UXMetrics, SessionStatus } from '../../../../apps/api/src/modules/testing/testing.types';

interface TaskProgressProps {
  task: string;
  status: SessionStatus;
  stepCount: number;
  maxSteps: number;
  startedAt: string;
  finishedAt?: string;
  metrics?: UXMetrics;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({
  task,
  status,
  stepCount,
  maxSteps,
  startedAt,
  finishedAt,
  metrics
}) => {
  const percent = Math.min(100, Math.round((stepCount / maxSteps) * 100));

  const isRunning = status === 'RUNNING' || status === 'STARTING';
  const isCompleted = status === 'COMPLETED';

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 sm:p-5 flex flex-col text-left space-y-3 shadow-xs">
      <div className="flex items-center justify-between text-xs font-mono font-bold text-[#868C98] uppercase tracking-wider">
        <div className="flex items-center gap-1.5 text-[#0A0D14]">
          <Target size={14} className="text-[#0F52BA]" />
          <span>CURRENT PRODUCT TASK</span>
        </div>
        <span>Step {stepCount} / {maxSteps}</span>
      </div>

      <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-3">
        <h4 className="text-sm sm:text-base font-bold text-[#0A0D14] leading-snug">
          "{task}"
        </h4>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
          <span>Execution Progress</span>
          <span>{percent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#F1F3F5] overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isCompleted ? 'bg-[#10B981]' : 'bg-[#0F52BA]'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Real Measured Metrics Bar (No fake 72/100 score) */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#F1F3F5] text-xs font-mono">
          <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] text-[#868C98] block">Completion</span>
            <strong className={`text-sm ${metrics.completion === 'Completed' ? 'text-[#059669]' : 'text-[#D97706]'}`}>
              {metrics.completion}
            </strong>
          </div>

          <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] text-[#868C98] block">Time Elapsed</span>
            <strong className="text-sm text-[#0A0D14]">{metrics.timeSeconds}s</strong>
          </div>

          <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] text-[#868C98] block">Total Steps</span>
            <strong className="text-sm text-[#0F52BA]">{metrics.steps} actions</strong>
          </div>

          <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] text-[#868C98] block">Friction Events</span>
            <strong className={`text-sm ${metrics.frictionPoints > 0 ? 'text-[#E11D48]' : 'text-[#059669]'}`}>
              {metrics.frictionPoints} points
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskProgress;
