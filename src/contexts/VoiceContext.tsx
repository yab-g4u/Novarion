import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LiveVoiceManager, VoiceState } from '../lib/voice/live-voice-manager';

export type ToolExecutor = (name: string, args: Record<string, any>) => Promise<any>;

interface VoiceContextType {
  voiceState: VoiceState;
  isConnected: boolean;
  isMuted: boolean;
  userTranscript: string;
  agentTranscript: string;
  currentAction: string | null;
  currentActionArgs: Record<string, any> | null;
  errorMessage: string | null;
  startVoice: () => Promise<void>;
  stopVoice: () => void;
  stopSpeaking: () => void;
  toggleMute: () => void;
  sendTextMessage: (text: string) => void;
  registerExecutor: (executor: ToolExecutor) => () => void;
  updateVoiceContext: (contextData: Record<string, any>) => void;
  dismissError: () => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [agentTranscript, setAgentTranscript] = useState<string>('');
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [currentActionArgs, setCurrentActionArgs] = useState<Record<string, any> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const managerRef = useRef<LiveVoiceManager | null>(null);
  const customExecutorsRef = useRef<ToolExecutor[]>([]);
  const latestContextRef = useRef<Record<string, any>>({});

  // Global default tool executor that operates real Probe UI and storage
  const defaultToolExecutor: ToolExecutor = useCallback(
    async (name: string, args: Record<string, any>) => {
      console.log(`[Voice Context] Executing tool: ${name}`, args);

      // Check custom executors first (e.g. from WorkspacePage or EvidenceGraph)
      for (const exec of customExecutorsRef.current) {
        try {
          const res = await exec(name, args);
          if (res !== undefined) {
            return res;
          }
        } catch (e) {
          console.warn('[Voice Context] Custom executor error:', e);
        }
      }

      // Default application-level handlers
      switch (name) {
        case 'start_investigation': {
          const idea = (args.idea || '').trim();
          if (!idea) throw new Error('Idea is required');
          localStorage.setItem('probe_active_idea', idea);

          // Dispatch custom event for active workspace to catch immediately
          window.dispatchEvent(new CustomEvent('probe_investigate_idea', { detail: { idea } }));

          // Navigate to research workspace
          if (!location.pathname.startsWith('/app/research')) {
            navigate('/app/research');
          }

          // Trigger research API
          try {
            const res = await fetch('/api/pressure-test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idea })
            });
            if (res.ok) {
              const data = await res.json();
              return {
                status: 'investigation_started',
                idea,
                assumptionsCount: data.assumptions?.length || 0,
                evidenceCount: data.allEvidence?.length || 0,
                topAssumptions: data.assumptions?.slice(0, 3).map((a: any) => a.text) || [],
                topContradiction: data.allEvidence?.find((e: any) => e.stance === 'CHALLENGES')?.excerpt || null
              };
            }
          } catch (e) {
            // ignore network err
          }

          return { status: 'investigation_started', idea };
        }

        case 'search_academic_research': {
          if (!location.pathname.startsWith('/app/research')) {
            navigate('/app/research');
          }
          window.dispatchEvent(new CustomEvent('probe_filter_scholarxiv', { detail: { query: args.query } }));
          return { status: 'filtered_scholarxiv', message: 'Displaying peer-reviewed academic papers from ScholarXiv.' };
        }

        case 'show_strongest_contradiction': {
          if (!location.pathname.startsWith('/app/research')) {
            navigate('/app/research');
          }
          window.dispatchEvent(new CustomEvent('probe_filter_contradictions', { detail: {} }));
          const activeIdea = localStorage.getItem('probe_active_idea') || 'Current idea';
          return {
            status: 'contradictions_displayed',
            message: `Highlighted opposing evidence contradicting assumptions for "${activeIdea}".`
          };
        }

        case 'show_strongest_evidence': {
          if (!location.pathname.startsWith('/app/research') && !location.pathname.startsWith('/app/evidence')) {
            navigate('/app/research');
          }
          window.dispatchEvent(new CustomEvent('probe_filter_stance', { detail: { stance: args.stance || 'ALL' } }));
          return { status: 'evidence_displayed', stance: args.stance || 'ALL' };
        }

        case 'focus_assumption': {
          window.dispatchEvent(new CustomEvent('probe_focus_assumption', { detail: { text: args.assumptionText } }));
          return { status: 'assumption_focused', text: args.assumptionText };
        }

        case 'create_experiment': {
          const testTitle = args.title || 'Validate critical unknown';
          const hypothesis = args.hypothesis || 'Empirical user test';
          const method = args.method || 'Founder customer interview';

          window.dispatchEvent(
            new CustomEvent('probe_create_experiment', {
              detail: { title: testTitle, hypothesis, method }
            })
          );

          return {
            status: 'experiment_created',
            title: testTitle,
            hypothesis,
            method
          };
        }

        case 'start_product_test': {
          const productUrl = args.productUrl || 'https://links.et/';
          const task = args.task || 'Verify core user journey and measure friction';

          localStorage.setItem('probe_test_url', productUrl);
          localStorage.setItem('probe_test_task', task);

          if (!location.pathname.startsWith('/app/testing')) {
            navigate('/app/testing');
          }

          window.dispatchEvent(
            new CustomEvent('probe_start_test', {
              detail: { productUrl, task }
            })
          );

          // Trigger test session API
          try {
            const res = await fetch('/api/testing/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productUrl, task, maxSteps: 25, timeoutMs: 120000 })
            });
            if (res.ok) {
              const session = await res.json();
              return { status: 'product_test_launched', sessionId: session.sessionId, productUrl, task };
            }
          } catch (e) {
            // ignore
          }

          return { status: 'product_test_launched', productUrl, task };
        }

        case 'navigate_view': {
          const target = (args.view || '').toLowerCase();
          switch (target) {
            case 'testing':
            case 'product testing':
              navigate('/app/testing');
              return { navigatedTo: '/app/testing' };
            case 'evidence':
            case 'evidence graph':
            case 'graph':
              navigate('/app/evidence');
              return { navigatedTo: '/app/evidence' };
            case 'research':
              navigate('/app/research');
              return { navigatedTo: '/app/research' };
            case 'home':
            case 'landing':
              navigate('/');
              return { navigatedTo: '/' };
            case 'signin':
            case 'login':
              navigate('/signin');
              return { navigatedTo: '/signin' };
            default:
              navigate('/app/research');
              return { navigatedTo: '/app/research' };
          }
        }

        case 'go_back': {
          window.history.back();
          return { status: 'navigated_back' };
        }

        case 'share_investigation': {
          window.dispatchEvent(new CustomEvent('probe_open_share_modal', { detail: {} }));
          return { status: 'share_dialog_opened' };
        }

        default:
          return { status: 'completed', action: name };
      }
    },
    [navigate, location.pathname]
  );

  const startVoice = useCallback(async () => {
    setErrorMessage(null);
    if (!managerRef.current) {
      managerRef.current = new LiveVoiceManager({
        onStateChange: (st) => setVoiceState(st),
        onUserTranscript: (txt) => setUserTranscript(txt),
        onAgentTranscript: (txt) => setAgentTranscript(txt),
        onToolExecuting: (tool, args) => {
          setCurrentAction(tool);
          setCurrentActionArgs(args);
        },
        onToolComplete: (_tool, _res) => {
          setTimeout(() => {
            setCurrentAction(null);
            setCurrentActionArgs(null);
          }, 1500);
        },
        onError: (err) => {
          console.error('[Voice Provider Error]:', err);
          setErrorMessage(err);
          setVoiceState('idle');
          setIsConnected(false);
        },
        onInterrupted: () => {
          setAgentTranscript('');
        },
        toolExecutor: (name, args) => defaultToolExecutor(name, args)
      });
    }

    // Prime initial context into manager before connecting
    const currentIdea = typeof window !== 'undefined' ? localStorage.getItem('probe_active_idea') || '' : '';
    managerRef.current.updateContext({
      currentIdea,
      activeTab: location.pathname.includes('/testing') ? 'testing' : location.pathname.includes('/evidence') ? 'evidence' : 'research',
      ...latestContextRef.current
    });

    // Optimistically wake up UI immediately on user click
    setIsConnected(true);
    setVoiceState('listening');

    try {
      await managerRef.current.connect();
      setIsConnected(true);
      setIsMuted(false);
    } catch (e: any) {
      console.warn('[VoiceContext] Error connecting to voice service:', e);
      setIsConnected(false);
      setVoiceState('idle');
    }
  }, [defaultToolExecutor, location.pathname]);

  const stopVoice = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.disconnect();
      managerRef.current = null;
    }
    setIsConnected(false);
    setVoiceState('idle');
    setCurrentAction(null);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stopAudioPlayback();
    }
    setVoiceState('listening');
  }, []);

  const toggleMute = useCallback(() => {
    if (managerRef.current) {
      const muted = managerRef.current.toggleMute();
      setIsMuted(muted);
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (managerRef.current) {
      managerRef.current.sendTextMessage(text);
    }
  }, []);

  const registerExecutor = useCallback((executor: ToolExecutor) => {
    customExecutorsRef.current.push(executor);
    return () => {
      customExecutorsRef.current = customExecutorsRef.current.filter((e) => e !== executor);
    };
  }, []);

  const updateVoiceContext = useCallback((contextData: Record<string, any>) => {
    latestContextRef.current = { ...latestContextRef.current, ...contextData };
    if (managerRef.current && isConnected) {
      managerRef.current.updateContext(latestContextRef.current);
    }
  }, [isConnected]);

  const dismissError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Update current path in voice context whenever route changes
  useEffect(() => {
    updateVoiceContext({
      currentPath: location.pathname,
      activeTab: location.pathname.includes('/testing')
        ? 'testing'
        : location.pathname.includes('/evidence')
        ? 'evidence'
        : 'research'
    });
  }, [location.pathname, updateVoiceContext]);

  return (
    <VoiceContext.Provider
      value={{
        voiceState,
        isConnected,
        isMuted,
        userTranscript,
        agentTranscript,
        currentAction,
        currentActionArgs,
        errorMessage,
        startVoice,
        stopVoice,
        stopSpeaking,
        toggleMute,
        sendTextMessage,
        registerExecutor,
        updateVoiceContext,
        dismissError
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
