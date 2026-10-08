import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';

interface ToolFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

const PROBE_TOOLS: { functionDeclarations: ToolFunctionDeclaration[] }[] = [
  {
    functionDeclarations: [
      {
        name: 'start_investigation',
        description: 'Starts a new empirical investigation in Probe on a business or product idea. Scans Reddit, ScholarXiv, X, and LinkedIn, extracts assumptions, and updates the Living Evidence Graph.',
        parameters: {
          type: 'OBJECT',
          properties: {
            idea: {
              type: 'STRING',
              description: 'The core business idea, problem, or hypothesis to investigate (e.g. "B2B sales automation", "Developer API", "Consumer marketplace", or any user-provided idea).'
            }
          },
          required: ['idea']
        }
      },
      {
        name: 'search_academic_research',
        description: 'Filters or specifically searches academic and peer-reviewed research papers from ScholarXiv for the current investigation.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Specific academic search topic or keywords.'
            }
          }
        }
      },
      {
        name: 'show_strongest_contradiction',
        description: 'Focuses on and highlights the strongest contradictory evidence or opposing stance for the current investigation.',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      },
      {
        name: 'show_strongest_evidence',
        description: 'Displays the highest-confidence evidence items in the current investigation, optionally filtered by stance.',
        parameters: {
          type: 'OBJECT',
          properties: {
            stance: {
              type: 'STRING',
              description: 'Filter by stance: "SUPPORTS", "CHALLENGES", or "ALL".'
            }
          }
        }
      },
      {
        name: 'focus_assumption',
        description: 'Selects and inspects a specific critical assumption or blind spot from the extracted assumptions in the investigation.',
        parameters: {
          type: 'OBJECT',
          properties: {
            assumptionText: {
              type: 'STRING',
              description: 'The assumption or question to focus on.'
            }
          }
        }
      },
      {
        name: 'create_experiment',
        description: 'Creates a validation test / experiment in the Living Evidence Graph to validate an assumption or resolve a contradiction. Uses the currently selected or strongest contradiction/assumption.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'Title or core hypothesis question of the validation experiment.'
            },
            hypothesis: {
              type: 'STRING',
              description: 'What the test aims to validate or disprove.'
            },
            method: {
              type: 'STRING',
              description: 'Testing methodology (e.g. "User interviews", "Landing page smoke test", "Interactive usability test", "A/B test").'
            }
          },
          required: ['title']
        }
      },
      {
        name: 'start_product_test',
        description: 'Navigates to the Product Testing subsystem and launches a real autonomous Playwright browser testing session on any website URL. Trigger immediately when user says "Test chatgpt.com", "Test links.et", or "Test <website URL>".',
        parameters: {
          type: 'OBJECT',
          properties: {
            productUrl: {
              type: 'STRING',
              description: 'The website URL to test (e.g. "https://chatgpt.com", "https://links.et", or any user-specified URL).'
            },
            task: {
              type: 'STRING',
              description: 'Optional specific user journey or test goal. If omitted, defaults to evaluating the landing page and core usability.'
            }
          },
          required: ['productUrl']
        }
      },
      {
        name: 'execute_browser_action',
        description: 'Executes a follow-up live browser action or user journey on the tested website in Probe live preview, such as clicking a button or testing a flow. Trigger when user says "Click the login button", "Test the signup flow", "Click pricing", etc.',
        parameters: {
          type: 'OBJECT',
          properties: {
            action: {
              type: 'STRING',
              description: 'The browser action: "click", "test_flow", "navigate", or "type".'
            },
            target: {
              type: 'STRING',
              description: 'Target element, button, link, or flow to test (e.g. "login button", "signup flow", "pricing link", "get started").'
            },
            text: {
              type: 'STRING',
              description: 'Optional text to type if action is "type".'
            }
          },
          required: ['action', 'target']
        }
      },
      {
        name: 'navigate_view',
        description: 'Navigates the Probe interface to a different tab or section.',
        parameters: {
          type: 'OBJECT',
          properties: {
            view: {
              type: 'STRING',
              description: 'The view to switch to: "research", "testing", "evidence", "home", or "signin".'
            }
          },
          required: ['view']
        }
      },
      {
        name: 'go_back',
        description: 'Navigates back to the previous view or screen in Probe.',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      },
      {
        name: 'share_investigation',
        description: 'Opens the collaboration share modal and generates a shareable room link for teammates.',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      }
    ]
  }
];

const SYSTEM_INSTRUCTION = `You are Probe Voice — the real-time voice intelligence and operating system for Probe.
Probe is an empirical investigation platform for founders to stress-test ideas before building.
Your role:
1. You directly CONTROL and OPERATE the Probe web application using your available tools.
2. When the user asks you to research an idea, check academic papers, find contradictions, create experiments, test a website, or click buttons, YOU MUST CALL THE CORRESPONDING TOOL.
3. Keep spoken responses concise, punchy, confident, and natural (1-3 sentences maximum). Avoid markdown, bullet points, or visual formatting in spoken speech.
4. Voice context & persistent conversation memory:
   - You share FULL conversation memory with Probe's text chat and active workspace.
   - Refer to previously stated ideas, user-provided info, assumptions, and past decisions naturally without asking the user to repeat themselves.
   - When the user says "Create an experiment for that" or "Create an experiment for it", refer to the currently selected or strongest contradiction/assumption from the active investigation.
   - When the user asks to check academic research, call search_academic_research.
   - When the user asks to see contradictions, call show_strongest_contradiction.
5. Voice-controlled live website testing:
   - When the user says "Test chatgpt.com", "Test links.et", or "Test <any website URL>", IMMEDIATELY call start_product_test with the target URL.
   - When the user issues follow-up browser commands like "Click the login button", "Test the signup flow", or "Click get started", IMMEDIATELY call execute_browser_action.
6. Domain Agnostic (NO cooking/restaurant bias):
   - You are completely domain-agnostic. NEVER assume, suggest, or default to cooking, recipes, food, or restaurants unless the user explicitly requested that specific domain.
   - Adapt dynamically to ANY legitimate idea, B2B software, developer tool, consumer tech, or website URL the user presents.
7. Hands-free dialogue:
   - Normal operations execute immediately. Speak natural, conversational confirmations of what was executed.`;

export function setupVoiceBridge(server: HttpServer) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Probe Voice Bridge] GEMINI_API_KEY is not set. Voice features will return configuration error.');
  }

  const wss = new WebSocketServer({ noServer: true });

  wss.on('error', (err: any) => {
    console.warn('[Probe Voice WSS error]:', err?.message || err);
  });

  server.on('upgrade', (request, socket, head) => {
    // Suppress unhandled socket errors on raw upgrade socket
    socket.on('error', (err: any) => {
      console.warn('[Probe Voice Socket upgrade warning]:', err?.message || err);
    });

    const pathname = request.url?.split('?')[0];
    if (pathname === '/api/voice/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    // 1. Attach client socket error listener IMMEDIATELY
    clientWs.on('error', (err: any) => {
      console.warn('[Probe Voice Bridge] Client socket warning:', err?.message || err);
    });

    // Helper: Safe send that always supplies an error callback to avoid unhandled senderOnError
    const safeSend = (payload: any) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        try {
          const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
          clientWs.send(str, (err) => {
            if (err) {
              console.warn('[Probe Voice Bridge] clientWs send error:', err?.message || err);
            }
          });
        } catch (e: any) {
          console.warn('[Probe Voice Bridge] clientWs send caught exception:', e?.message || e);
        }
      }
    };

    console.log('[Probe Voice Bridge] Client connected to live voice socket');

    if (!apiKey) {
      safeSend({
        type: 'error',
        message: 'GEMINI_API_KEY is not configured on the server. Please check your environment variables.'
      });
      try {
        clientWs.close();
      } catch {
        // ignore
      }
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    let liveSession: any = null;
    let isConnectedToGemini = false;

    try {
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede'
              }
            }
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          // @ts-ignore
          tools: PROBE_TOOLS,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            console.log('[Probe Voice Bridge] Connected to Gemini Live API');
            isConnectedToGemini = true;
            safeSend({ type: 'ready' });
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // 1. Audio and Text Model Output
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                safeSend({
                  type: 'audio',
                  audio: part.inlineData.data
                });
              }
              if (part.text) {
                safeSend({
                  type: 'agent_text',
                  text: part.text
                });
              }
            }

            // 2. Interruption / Barge-in
            if (message.serverContent?.interrupted) {
              safeSend({ type: 'interrupted' });
            }

            // 3. Live User Input Transcription
            if (message.serverContent?.inputTranscription?.text) {
              safeSend({
                type: 'user_transcript',
                text: message.serverContent.inputTranscription.text
              });
            }

            // 4. Live Model Output Spoken Transcription
            if (message.serverContent?.outputTranscription?.text) {
              safeSend({
                type: 'agent_transcript',
                text: message.serverContent.outputTranscription.text
              });
            }

            // 5. Turn Complete
            if (message.serverContent?.turnComplete) {
              safeSend({ type: 'turn_complete' });
            }

            // 6. Tool Calls: Expose real Probe actions to the client UI
            if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
              console.log('[Probe Voice Bridge] Model requested tool call:', message.toolCall.functionCalls);
              safeSend({
                type: 'tool_call',
                functionCalls: message.toolCall.functionCalls
              });
            }
          },
          onerror: (err: any) => {
            console.warn('[Probe Voice Bridge] Gemini Live warning/error:', err?.message || err);
            safeSend({
              type: 'error',
              message: err?.message || 'Gemini Live session encountered an error'
            });
          },
          onclose: (e: any) => {
            console.log('[Probe Voice Bridge] Gemini Live connection closed:', e?.reason || e);
            isConnectedToGemini = false;
            safeSend({ type: 'session_closed' });
          }
        }
      });
    } catch (err: any) {
      console.warn('[Probe Voice Bridge] Failed to connect to Gemini Live API:', err?.message || err);
      safeSend({
        type: 'error',
        message: err?.message || 'Failed to initialize Gemini Live session'
      });
      return;
    }

    clientWs.on('message', async (data: any) => {
      try {
        const msg = JSON.parse(data.toString());

        // A. Real-time audio chunks from microphone (16kHz PCM little-endian base64)
        if (msg.type === 'audio' && msg.audio) {
          if (liveSession && isConnectedToGemini) {
            try {
              liveSession.sendRealtimeInput({
                audio: {
                  data: msg.audio,
                  mimeType: 'audio/pcm;rate=16000'
                }
              });
            } catch (e: any) {
              console.warn('[Probe Voice Bridge] Error sending audio chunk:', e?.message || e);
            }
          }
        }

        // B. Context update from client UI
        else if (msg.type === 'context_update' && msg.context) {
          if (liveSession && isConnectedToGemini) {
            try {
              const ctx = msg.context;
              const formattedMessages = Array.isArray(ctx.recentMessages) && ctx.recentMessages.length > 0
                ? ctx.recentMessages
                    .map((m: any) => `  [${(m.role || 'user').toUpperCase()}]: ${m.content}`)
                    .join('\n')
                : 'No prior messages in session';

              const contextText = `[PROBE ACTIVE CONVERSATION MEMORY & WORKSPACE STATE]
- Active Idea / Topic: "${ctx.currentIdea || 'none'}"
- Investigation Title: "${ctx.title || ctx.currentIdea || 'none'}"
- Current Section: ${ctx.activeTab || 'research'}
- Extracted Assumptions: ${JSON.stringify(ctx.assumptions || [])}
- Strongest Contradiction: "${ctx.strongestContradiction || 'none'}"
- Validation Experiments: ${JSON.stringify(ctx.experiments || [])}
- User Decisions & Info: "${ctx.userDecisions || 'none'}"
- Verified Evidence Signals: ${ctx.evidenceCount || 0}
- Attached Context Document: "${ctx.documentFileName || 'none'}"
- Shared Text & Voice Conversation History:
${formattedMessages}

Note: Use this shared memory to answer follow-up questions seamlessly without asking the user to repeat themselves.`;

              liveSession.sendClientContent({
                turns: [
                  {
                    role: 'user',
                    parts: [{ text: contextText }]
                  }
                ],
                turnComplete: false
              });
            } catch (e: any) {
              console.warn('[Probe Voice Bridge] Error sending context update:', e?.message || e);
            }
          }
        }

        // C. Tool execution response from client UI
        else if (msg.type === 'tool_response' && msg.functionResponses) {
          if (liveSession && isConnectedToGemini) {
            try {
              console.log('[Probe Voice Bridge] Sending tool response back to Gemini:', msg.functionResponses);
              liveSession.sendToolResponse({
                functionResponses: msg.functionResponses
              });
            } catch (e: any) {
              console.warn('[Probe Voice Bridge] Error sending tool response:', e?.message || e);
            }
          }
        }

        // D. Text prompt fallback / text injection
        else if (msg.type === 'text_input' && msg.text) {
          if (liveSession && isConnectedToGemini) {
            try {
              liveSession.sendClientContent({
                turns: [
                  {
                    role: 'user',
                    parts: [{ text: msg.text }]
                  }
                ],
                turnComplete: true
              });
            } catch (e: any) {
              console.warn('[Probe Voice Bridge] Error sending text input:', e?.message || e);
            }
          }
        }

        // E. Client requested interrupt
        else if (msg.type === 'interrupt') {
          // Client stopped speaking or barge-in occurred
        }
      } catch (e: any) {
        console.warn('[Probe Voice Bridge] Error processing client message:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('[Probe Voice Bridge] Client disconnected');
      isConnectedToGemini = false;
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // ignore
        }
        liveSession = null;
      }
    });
  });

  return wss;
}
