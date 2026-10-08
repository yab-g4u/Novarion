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
              description: 'The core business idea, problem, or hypothesis to investigate (e.g. "AI inventory system for restaurants").'
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
              description: 'Testing methodology (e.g. "Interview 10 restaurant GMs", "Landing page smoke test", "Usability test").'
            }
          },
          required: ['title']
        }
      },
      {
        name: 'start_product_test',
        description: 'Navigates to the Product Testing subsystem and launches an autonomous browser agent session to empirically test a product workflow.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productUrl: {
              type: 'STRING',
              description: 'Product URL to test (defaults to "https://links.et/" or user specified URL).'
            },
            task: {
              type: 'STRING',
              description: 'The user journey task to execute in the browser.'
            }
          },
          required: ['productUrl', 'task']
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
2. When the user asks you to research an idea, check academic papers, find contradictions, create experiments, or start a product test, YOU MUST CALL THE CORRESPONDING TOOL.
3. Keep spoken responses concise, punchy, confident, and natural (1-3 sentences maximum). Avoid markdown, bullet points, or visual formatting in spoken speech.
4. Voice context awareness:
   - When the user says "Create an experiment for that" or "Create an experiment for it", refer to the currently selected or strongest contradiction or assumption from the active investigation.
   - When the user asks to check academic research, call search_academic_research.
   - When the user asks to start a product test, call start_product_test with appropriate product URL and task.
   - When the user asks to see contradictions, call show_strongest_contradiction.
5. You operate in continuous hands-free dialogue. The user can speak anytime, interrupt you, or give follow-up commands without touching the keyboard.
6. Safety: Normal actions (research, filtering, experiments, navigation) execute immediately. If the user asks for destructive operations like deleting all data, ask for confirmation first.`;

export function setupVoiceBridge(server: HttpServer) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Probe Voice Bridge] GEMINI_API_KEY is not set. Voice features will return configuration error.');
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url?.split('?')[0];
    if (pathname === '/api/voice/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Probe Voice Bridge] Client connected to live voice socket');

    if (!apiKey) {
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'GEMINI_API_KEY is not configured on the server. Please check your environment variables.'
      }));
      clientWs.close();
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
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'ready' }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // 1. Audio and Text Model Output
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({
                  type: 'audio',
                  audio: part.inlineData.data
                }));
              }
              if (part.text) {
                clientWs.send(JSON.stringify({
                  type: 'agent_text',
                  text: part.text
                }));
              }
            }

            // 2. Interruption / Barge-in
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            // 3. Live User Input Transcription
            if (message.serverContent?.inputTranscription?.text) {
              clientWs.send(JSON.stringify({
                type: 'user_transcript',
                text: message.serverContent.inputTranscription.text
              }));
            }

            // 4. Live Model Output Spoken Transcription
            if (message.serverContent?.outputTranscription?.text) {
              clientWs.send(JSON.stringify({
                type: 'agent_transcript',
                text: message.serverContent.outputTranscription.text
              }));
            }

            // 5. Turn Complete
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turn_complete' }));
            }

            // 6. Tool Calls: Expose real Probe actions to the client UI
            if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
              console.log('[Probe Voice Bridge] Model requested tool call:', message.toolCall.functionCalls);
              clientWs.send(JSON.stringify({
                type: 'tool_call',
                functionCalls: message.toolCall.functionCalls
              }));
            }
          },
          onerror: (err: any) => {
            console.error('[Probe Voice Bridge] Gemini Live error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'error',
                message: err?.message || 'Gemini Live session encountered an error'
              }));
            }
          },
          onclose: (e: any) => {
            console.log('[Probe Voice Bridge] Gemini Live connection closed:', e?.reason || e);
            isConnectedToGemini = false;
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'session_closed' }));
            }
          }
        }
      });
    } catch (err: any) {
      console.error('[Probe Voice Bridge] Failed to connect to Gemini Live API:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'error',
          message: err?.message || 'Failed to initialize Gemini Live session'
        }));
      }
      return;
    }

    clientWs.on('message', async (data: any) => {
      try {
        const msg = JSON.parse(data.toString());

        // A. Real-time audio chunks from microphone (16kHz PCM little-endian base64)
        if (msg.type === 'audio' && msg.audio) {
          if (liveSession && isConnectedToGemini) {
            liveSession.sendRealtimeInput({
              audio: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000'
              }
            });
          }
        }

        // B. Context update from client UI
        else if (msg.type === 'context_update' && msg.context) {
          if (liveSession && isConnectedToGemini) {
            const ctx = msg.context;
            const contextText = `[PROBE UI CONTEXT UPDATE]
- Active Idea: "${ctx.currentIdea || 'none'}"
- Current Section: ${ctx.activeTab || 'research'}
- Extracted Assumptions: ${JSON.stringify(ctx.assumptions || [])}
- Strongest Contradiction: "${ctx.strongestContradiction || 'none'}"
- Selected Item: "${ctx.selectedItem || 'none'}"
- Verified Evidence Count: ${ctx.evidenceCount || 0}`;

            liveSession.sendClientContent({
              turns: [
                {
                  role: 'user',
                  parts: [{ text: contextText }]
                }
              ],
              turnComplete: false
            });
          }
        }

        // C. Tool execution response from client UI
        else if (msg.type === 'tool_response' && msg.functionResponses) {
          if (liveSession && isConnectedToGemini) {
            console.log('[Probe Voice Bridge] Sending tool response back to Gemini:', msg.functionResponses);
            liveSession.sendToolResponse({
              functionResponses: msg.functionResponses
            });
          }
        }

        // D. Text prompt fallback / text injection
        else if (msg.type === 'text_input' && msg.text) {
          if (liveSession && isConnectedToGemini) {
            liveSession.sendClientContent({
              turns: [
                {
                  role: 'user',
                  parts: [{ text: msg.text }]
                }
              ],
              turnComplete: true
            });
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
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {
          // ignore
        }
      }
    });

    clientWs.on('error', (err) => {
      console.error('[Probe Voice Bridge] Client socket error:', err);
    });
  });

  return wss;
}
