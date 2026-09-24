import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  MousePointer, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Sliders,
  ChevronRight,
  Sparkles,
  Command,
  Search,
  Plus
} from 'lucide-react';

interface SimulationFrame {
  timestamp: string;
  stepNumber: number;
  phaseTitle: string;
  cursorX: number; // percentage in viewport
  cursorY: number;
  activeMenu: string | null;
  clickedTarget: string | null;
  isFrictionFreeze: boolean;
  userObservation: string;
  probeDiagnosis?: {
    expected: string;
    observed: string;
    frictionReason: string;
  };
}

const LINEAR_SIMULATION_FRAMES: SimulationFrame[] = [
  {
    timestamp: '00:01',
    stepNumber: 1,
    phaseTitle: 'Task Received',
    cursorX: 18,
    cursorY: 15,
    activeMenu: null,
    clickedTarget: null,
    isFrictionFreeze: false,
    userObservation: 'Goal: "Create a project for the upcoming mobile launch and organize the work."',
  },
  {
    timestamp: '00:04',
    stepNumber: 2,
    phaseTitle: 'Scanning Workspace Sidebar',
    cursorX: 14,
    cursorY: 28,
    activeMenu: null,
    clickedTarget: null,
    isFrictionFreeze: false,
    userObservation: 'User eyes sidebar hierarchy: Inbox, My Issues, Views, Workspace Settings.',
  },
  {
    timestamp: '00:08',
    stepNumber: 3,
    phaseTitle: 'Unexpected Path: Clicked Workspace Settings',
    cursorX: 16,
    cursorY: 74,
    activeMenu: 'settings-dropdown',
    clickedTarget: 'Workspace Settings',
    isFrictionFreeze: false,
    userObservation: 'User assumes top-level company projects live inside "Workspace Settings".',
  },
  {
    timestamp: '00:13',
    stepNumber: 4,
    phaseTitle: 'Friction Detected: Ambiguous Affordance',
    cursorX: 28,
    cursorY: 66,
    activeMenu: 'settings-dropdown',
    clickedTarget: 'Billing & Members',
    isFrictionFreeze: true,
    userObservation: 'Hesitation: User encounters member seat controls instead of project creation.',
    probeDiagnosis: {
      expected: 'Project Creation & Initiative Roadmap',
      observed: 'User interpreted "Workspace" menu as initiative creator, but it only contains administrative billing.',
      frictionReason: 'Missing "+ New Project" entry point inside the primary workspace drop-down menu.',
    },
  },
  {
    timestamp: '00:19',
    stepNumber: 5,
    phaseTitle: 'Backtracking & Recovery',
    cursorX: 15,
    cursorY: 42,
    activeMenu: null,
    clickedTarget: 'Projects',
    isFrictionFreeze: false,
    userObservation: 'User closes administrative dropdown and scans down to "Projects" nav item.',
  },
  {
    timestamp: '00:24',
    stepNumber: 6,
    phaseTitle: 'Action: + New Project Clicked',
    cursorX: 68,
    cursorY: 22,
    activeMenu: 'new-project-modal',
    clickedTarget: '+ New Project',
    isFrictionFreeze: false,
    userObservation: 'Opens project modal: Inputs "Mobile Launch Q3", assigns engineering team.',
  },
  {
    timestamp: '00:29',
    stepNumber: 7,
    phaseTitle: 'Task Completed & Diagnostics',
    cursorX: 72,
    cursorY: 62,
    activeMenu: 'success-banner',
    clickedTarget: 'Create Project',
    isFrictionFreeze: false,
    userObservation: 'Project created in 29 seconds with 1 unexpected path and 1 verified friction freeze.',
  },
];

export const UserTesting: React.FC = () => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(3); // Start at friction freeze
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'replay' | 'diagnosis'>('replay');

  const frame = LINEAR_SIMULATION_FRAMES[currentFrameIndex];

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= LINEAR_SIMULATION_FRAMES.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const restartSimulation = () => {
    setCurrentFrameIndex(0);
    setIsPlaying(true);
  };

  const jumpToFriction = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(3);
  };

  return (
    <section id="section-simulation" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866] block mb-1.5">
            USABILITY REPLAY ENGINE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14]">
            Let someone try it before they do.
          </h2>
          <p className="text-xs sm:text-sm text-[#525866] mt-1.5 max-w-2xl">
            Simulate realistic AI user personas attempting live product tasks. Watch them make human mistakes, click the wrong menus, hesitate, and reveal unexpected friction.
          </p>
        </div>

        {/* Mode / Replay Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#0A0D14] hover:bg-[#202530] text-white transition-all cursor-pointer shadow-xs"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause Replay' : 'Run Session Replay'}</span>
          </button>
          <button
            onClick={restartSimulation}
            className="p-2 rounded-full border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#525866] transition cursor-pointer"
            title="Restart Replay"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={jumpToFriction}
            className="text-xs font-mono px-3 py-1.5 rounded-full border border-[#FECDD3] bg-[#FFF1F2] text-[#E11D48] hover:bg-[#FFE4E6] cursor-pointer"
          >
            Jump to Friction
          </button>
        </div>
      </div>

      {/* SESSION REPLAY WORKSPACE (MINIATURE LINEAR UI) */}
      <div className="bg-white border border-[#EAEAEA] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
        {/* Replay Timeline Scrubber */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-[#F1F3F5] text-xs font-mono">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-ping" />
            <span className="font-bold text-[#0A0D14]">Task:</span>
            <span className="text-[#525866]">Create mobile launch project</span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {LINEAR_SIMULATION_FRAMES.map((item, idx) => (
              <button
                key={item.timestamp}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentFrameIndex(idx);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                  currentFrameIndex === idx
                    ? item.isFrictionFreeze
                      ? 'bg-[#E11D48] text-white font-bold'
                      : 'bg-[#0A0D14] text-white font-bold'
                    : item.isFrictionFreeze
                    ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]'
                    : 'bg-[#F8FAFC] text-[#868C98] hover:text-[#0A0D14]'
                }`}
              >
                <span>{item.timestamp}</span>
                {item.isFrictionFreeze && <span className="ml-1 text-[9px]">⚠️</span>}
              </button>
            ))}
          </div>
        </div>

        {/* LIVE SIMULATED PRODUCT INTERFACE (ACTUAL MINIATURE LINEAR APP) */}
        <div className="relative bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl min-h-[440px] overflow-hidden flex flex-col justify-between">
          {/* Miniature App Window Bar */}
          <div className="h-9 px-4 bg-[#F4F4F6] border-b border-[#E5E7EB] flex items-center justify-between text-xs text-[#868C98]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]" />
              </div>
              <span className="font-mono text-[10px] text-[#525866]">linear.app / engineering / projects</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px]">
              <Clock size={11} />
              <span>Session Time: {frame.timestamp}</span>
            </div>
          </div>

          {/* Actual UI Canvas */}
          <div className="relative flex-1 grid grid-cols-12 min-h-[360px] bg-[#FFFFFF]">
            {/* MINIATURE SIDEBAR (Cols 1-3) */}
            <div className="col-span-3 sm:col-span-3 border-r border-[#EFEFEF] bg-[#FBFBFC] p-3 text-xs space-y-4">
              {/* Workspace Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#EFEFEF]">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-[#5E6AD2] text-white flex items-center justify-center text-[8px] font-bold">
                    L
                  </div>
                  <span className="font-bold text-[11px] text-[#0A0D14]">Linear Team</span>
                </div>
              </div>

              {/* Sidebar Menu Items */}
              <div className="space-y-1 text-[11px]">
                <div className="px-2 py-1 rounded text-[#525866] hover:bg-[#F3F4F6] flex items-center justify-between">
                  <span>Inbox</span>
                  <span className="text-[9px] text-[#868C98]">3</span>
                </div>
                <div className="px-2 py-1 rounded text-[#525866] hover:bg-[#F3F4F6]">
                  <span>My Issues</span>
                </div>
                <div
                  className={`px-2 py-1 rounded transition-colors flex items-center justify-between ${
                    frame.clickedTarget === 'Projects'
                      ? 'bg-[#5E6AD2]/10 text-[#5E6AD2] font-bold'
                      : 'text-[#0A0D14] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <span>Projects</span>
                  <span className="text-[9px] font-mono text-[#868C98]">4</span>
                </div>
                <div className="px-2 py-1 rounded text-[#525866] hover:bg-[#F3F4F6]">
                  <span>Cycles</span>
                </div>
                <div className="px-2 py-1 rounded text-[#525866] hover:bg-[#F3F4F6]">
                  <span>Roadmaps</span>
                </div>
              </div>

              {/* Bottom Workspace Settings Anchor */}
              <div className="pt-8">
                <div
                  className={`px-2 py-1.5 rounded transition-all text-[11px] flex items-center justify-between ${
                    frame.clickedTarget === 'Workspace Settings' || frame.activeMenu === 'settings-dropdown'
                      ? 'bg-[#E11D48]/10 text-[#E11D48] font-bold ring-1 ring-[#E11D48]'
                      : 'text-[#525866] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <span>Workspace Settings</span>
                  <span className="text-[9px]">⚙</span>
                </div>
              </div>
            </div>

            {/* MAIN APP CONTENT AREA (Cols 4-12) */}
            <div className="col-span-9 sm:col-span-9 p-5 relative flex flex-col justify-between">
              {/* App Content Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#0A0D14]">Engineering / Projects</h4>
                  <span className="text-[10px] text-[#868C98] font-mono">Cycle 28</span>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
                    frame.clickedTarget === '+ New Project'
                      ? 'bg-[#5E6AD2] text-white shadow-xs'
                      : 'bg-[#0A0D14] text-white hover:bg-[#202530]'
                  }`}
                >
                  <Plus size={11} />
                  <span>New Project</span>
                </div>
              </div>

              {/* Projects List Mockup */}
              <div className="space-y-2 py-4">
                <div className="p-2.5 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span className="font-medium text-[#0A0D14]">Design System Tokens v2</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#525866]">In Progress · 78%</span>
                </div>

                <div className="p-2.5 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span className="font-medium text-[#0A0D14]">GraphQL Cache Invalidation</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#525866]">Planned · Cycle 29</span>
                </div>

                {frame.stepNumber >= 6 && (
                  <div className="p-2.5 rounded-lg border border-[#5E6AD2] bg-[#5E6AD2]/5 flex items-center justify-between text-xs animate-in fade-in duration-300">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#5E6AD2]" />
                      <span className="font-bold text-[#5E6AD2]">Mobile Launch Q3</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5E6AD2] font-semibold">Just Created ✓</span>
                  </div>
                )}
              </div>

              {/* SIMULATED WRONG MENU OVERLAY: Workspace Administrative Settings */}
              {frame.activeMenu === 'settings-dropdown' && (
                <div className="absolute top-16 left-6 z-20 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-3 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#F1F3F5] text-[10px] font-mono text-[#868C98]">
                    <span>WORKSPACE ADMINISTRATIVE</span>
                    <span className="text-rose-600 font-bold">Wrong Menu</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-[#525866]">
                    <div className="p-1 rounded hover:bg-[#F3F4F6]">General Details</div>
                    <div className="p-1 rounded hover:bg-[#F3F4F6] flex items-center justify-between bg-rose-50 text-rose-700 font-semibold">
                      <span>Billing & Members</span>
                      <span className="text-[9px]">$16/mo</span>
                    </div>
                    <div className="p-1 rounded hover:bg-[#F3F4F6]">SAML / SSO Configuration</div>
                    <div className="p-1 rounded hover:bg-[#F3F4F6]">API Webhooks & Export</div>
                  </div>
                </div>
              )}

              {/* SIMULATED NEW PROJECT MODAL (When user recovered) */}
              {frame.activeMenu === 'new-project-modal' && (
                <div className="absolute inset-4 z-20 bg-white/95 backdrop-blur-xs border border-[#0A0D14] rounded-xl p-5 shadow-2xl flex flex-col justify-between animate-in fade-in duration-200">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F1F3F5] pb-2">
                      <span className="text-xs font-bold text-[#0A0D14]">Create New Project</span>
                      <span className="text-[9px] font-mono text-[#868C98]">ESC</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#868C98] block">Project Name</label>
                      <div className="px-2.5 py-1.5 border border-[#5E6AD2] rounded text-xs font-semibold text-[#0A0D14] mt-0.5">
                        Mobile Launch Q3
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#868C98] block">Lead</label>
                      <div className="text-xs text-[#525866] mt-0.5">Alex Rivera (Staff Eng)</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F3F5]">
                    <button className="px-3 py-1 bg-[#0A0D14] text-white text-xs rounded-md font-semibold">
                      Create Project
                    </button>
                  </div>
                </div>
              )}

              {/* FROZEN FRICTION HIGHLIGHT OVERLAY (STEP 4) */}
              {frame.isFrictionFreeze && (
                <div className="absolute inset-0 bg-[#0A0D14]/40 backdrop-blur-2xs z-30 flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-white border-2 border-[#E11D48] rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3">
                    <div className="flex items-center gap-2 text-[#E11D48]">
                      <ShieldAlert size={18} />
                      <span className="text-xs font-mono font-bold tracking-wider uppercase">
                        FRICTION DETECTED · 00:13
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-[#868C98] uppercase block">Expected:</span>
                        <strong className="text-[#0A0D14]">{frame.probeDiagnosis?.expected}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#868C98] uppercase block">Observed:</span>
                        <p className="text-[#525866] leading-relaxed">{frame.probeDiagnosis?.observed}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#F1F3F5] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#E11D48] font-bold">
                        3 of 5 simulated users hesitated here
                      </span>
                      <button
                        onClick={() => setCurrentFrameIndex(4)}
                        className="text-xs font-semibold bg-[#0A0D14] text-white px-3 py-1 rounded-full cursor-pointer hover:bg-[#202530]"
                      >
                        Continue Replay →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SIMULATED ANIMATED USER CURSOR */}
            <div
              className="absolute pointer-events-none transition-all duration-700 ease-out z-40"
              style={{
                left: `${frame.cursorX}%`,
                top: `${frame.cursorY}%`,
              }}
            >
              <MousePointer size={20} className="text-[#0A0D14] fill-[#0A0D14] -rotate-12 drop-shadow-md" />
              <div className="bg-[#0A0D14] text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap ml-3 -mt-2">
                Simulated User
              </div>
            </div>
          </div>

          {/* Real-time Thought Stream Footer Bar */}
          <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#868C98] uppercase">
                {frame.phaseTitle}:
              </span>
              <span className="text-[#0A0D14] font-medium font-mono text-[11px]">
                "{frame.userObservation}"
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 text-[10px] font-mono text-[#525866]">
              <span>Step 0{frame.stepNumber} of 07</span>
            </div>
          </div>
        </div>

        {/* FINAL DIAGNOSIS SUMMARY COMPRESSION (WHEN COMPLETE) */}
        <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl space-y-1">
            <span className="text-[10px] font-mono text-[#868C98] uppercase block">Session Diagnosis</span>
            <div className="flex items-center gap-2 text-xs font-bold text-[#0A0D14]">
              <span>1 Unexpected Path</span>
              <span>·</span>
              <span className="text-[#E11D48]">1 Friction Freeze</span>
            </div>
            <p className="text-[11px] text-[#525866]">User searched in workspace settings before finding projects.</p>
          </div>

          <div className="p-3.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl space-y-1">
            <span className="text-[10px] font-mono text-[#868C98] uppercase block">Probe Signal</span>
            <span className="text-xs font-bold text-[#0A0D14] block">Affordance Ambiguity</span>
            <p className="text-[11px] text-[#525866]">
              Provide a direct "+ New Project" shortcut in the workspace switcher menu.
            </p>
          </div>

          <div className="p-3.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl space-y-1">
            <span className="text-[10px] font-mono text-[#868C98] uppercase block">Synthetic Sample</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>5 of 5 personas tested</span>
            </div>
            <p className="text-[11px] text-[#525866]">Average completion time: 27.4s (target: &lt; 15s).</p>
          </div>
        </div>
      </div>
    </section>
  );
};
