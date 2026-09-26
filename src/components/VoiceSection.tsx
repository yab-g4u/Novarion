import React, { useState } from 'react';
import { Mic, ArrowRight, Check, Command, SlidersHorizontal, Layers, Play } from 'lucide-react';

interface VoiceCommand {
  id: string;
  query: string;
  uiAction: string;
  interfaceState: {
    title: string;
    filterApplied: string;
    displayedCount: number;
    highlight: string;
  };
}

const COMMANDS: VoiceCommand[] = [
  {
    id: 'cmd-1',
    query: '"Show me only the evidence challenging this assumption."',
    uiAction: 'Filter: Stance == Challenges · Isolating friction points',
    interfaceState: {
      title: 'Active Filter: Negative Evidence Only',
      filterApplied: 'Stance: Challenges',
      displayedCount: 4,
      highlight: 'Filtered out 8 supporting sources to focus exclusively on failure modes and risks.'
    }
  },
  {
    id: 'cmd-2',
    query: '"Compare the two most contradictory sources on checkout latency."',
    uiAction: 'View: Side-by-Side Contradiction Matrix',
    interfaceState: {
      title: 'Split View: Reddit POS Thread vs ScholarXIV Study',
      filterApplied: 'Contradiction Diff',
      displayedCount: 2,
      highlight: 'Opened dual-pane inspector comparing cashier rush-hour claims against empirical lab data.'
    }
  },
  {
    id: 'cmd-3',
    query: '"Run the verification task against links.et again."',
    uiAction: 'Trigger: Automated Session Replay (DHV0BHI2GG)',
    interfaceState: {
      title: 'Testing Engine Dispatched',
      filterApplied: 'Task: Verify DHV0BHI2GG',
      displayedCount: 1,
      highlight: 'Dispatched simulated user into links.et verification input with latency telemetry.'
    }
  }
];

export const VoiceSection: React.FC = () => {
  const [activeCommandId, setActiveCommandId] = useState<string>('cmd-1');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const activeCmd = COMMANDS.find(c => c.id === activeCommandId) || COMMANDS[0];

  const handleSelectCommand = (id: string) => {
    setIsExecuting(true);
    setActiveCommandId(id);
    setTimeout(() => setIsExecuting(false), 300);
  };

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Editorial Headline */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <span className="font-mono text-xs uppercase tracking-wider text-[#8C919D] block mb-3">
          Voice Control · Voxide
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1117] leading-[1.12]">
          Ask Probe to change the investigation.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#5B616E] leading-relaxed">
          Not a conversational chatbot. Voice is an invisible operating layer to pivot filters, compare contradictory evidence, and dispatch product tests hands-free.
        </p>
      </div>

      {/* Voice Operating Interface */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Terminal Status Bar */}
        <div className="px-6 py-3.5 bg-[#FAFAFA] border-b border-[#EAEAEA] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span className="text-[#0F1117] font-semibold">VOXIDE CONTROL LAYER READY</span>
          </div>
          <span className="text-[#8C919D]">zero-transcription lag · direct DOM action</span>
        </div>

        {/* Command Matrix Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#EAEAEA]">
          {/* Left: Command Presets (Cols 1-6) */}
          <div className="lg:col-span-6 p-6 sm:p-8 space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8C919D] block">
              Speak or Trigger an Operational Command
            </span>

            <div className="space-y-2.5">
              {COMMANDS.map((cmd) => {
                const isSelected = cmd.id === activeCommandId;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => handleSelectCommand(cmd.id)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F1117] bg-[#FAFAFA]'
                        : 'border-[#EAEAEA] hover:border-[#D0D4DC] bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-6 h-6 rounded bg-[#F0F0EE] flex items-center justify-center text-[#0F1117] shrink-0">
                        <Mic size={12} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#0F1117] tracking-tight">
                          {cmd.query}
                        </p>
                        <p className="text-xs font-mono text-[#8C919D]">
                          → {cmd.uiAction}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] font-mono text-[#8C919D]">
              Press ⌥ Space to activate voice dispatch anywhere in Probe.
            </div>
          </div>

          {/* Right: Live Responsive UI Panel (Cols 7-12) */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-[#FAFAFA] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3 text-xs">
                <span className="font-mono text-[#8C919D] uppercase text-[10px]">
                  Interface State Response
                </span>
                <span className="font-mono text-[#059669] flex items-center gap-1">
                  <Check size={12} />
                  <span>Executed in 180ms</span>
                </span>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#0F1117]">
                    {activeCmd.interfaceState.title}
                  </h4>
                  <span className="font-mono text-[11px] text-[#60646C]">
                    {activeCmd.interfaceState.displayedCount} items visible
                  </span>
                </div>

                <div className="p-3 rounded bg-[#FAFAFA] border border-[#EAEAEA] text-xs font-mono text-[#0F1117]">
                  {activeCmd.interfaceState.filterApplied}
                </div>

                <p className="text-xs text-[#5B616E] leading-relaxed">
                  {activeCmd.interfaceState.highlight}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white border border-[#EAEAEA] flex items-center justify-between text-xs">
              <span className="text-[#60646C]">Voxide Mode: Direct Control</span>
              <span className="font-mono text-[11px] font-semibold text-[#0F1117]">Zero Bot Fluff</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
