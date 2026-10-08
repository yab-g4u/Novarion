/**
 * Live Voice Manager for Probe using Gemini Live API
 * Handles 16kHz microphone capture, downsampling, WebSocket streaming,
 * gapless 24kHz PCM audio playback, barge-in interruption, and bidirectional tool execution.
 */

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'executing' | 'speaking';

export interface ToolCallPayload {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface LiveVoiceManagerCallbacks {
  onStateChange: (state: VoiceState) => void;
  onUserTranscript: (text: string) => void;
  onAgentTranscript: (text: string) => void;
  onAgentTextChunk?: (text: string) => void;
  onTurnComplete?: (userText: string, agentText: string) => void;
  onToolExecuting: (toolName: string, args: Record<string, any>) => void;
  onToolComplete: (toolName: string, result: any) => void;
  onError: (error: string) => void;
  onInterrupted: () => void;
  toolExecutor: (name: string, args: Record<string, any>) => Promise<any>;
}

export class LiveVoiceManager {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  
  private activeSources: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;
  private isMuted = false;
  private isConnected = false;
  private currentState: VoiceState = 'idle';
  private callbacks: LiveVoiceManagerCallbacks;
  
  private silenceTimer: any = null;
  private speakingActive = false;
  private currentUserTranscript = '';
  private currentAgentTranscript = '';

  constructor(callbacks: LiveVoiceManagerCallbacks) {
    this.callbacks = callbacks;
  }

  public getState(): VoiceState {
    return this.currentState;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  private setState(newState: VoiceState) {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  public async connect(): Promise<void> {
    if (this.isConnected || this.ws) {
      return;
    }

    try {
      this.setState('listening');

      // 1. Initialize Microphone Audio Stream & AudioContext
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Browser native AudioContext (can be 44.1k or 48k or 16k)
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtxClass();
      
      // Output AudioContext at 24,000 Hz for Gemini Live PCM
      this.outputAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
      if (this.outputAudioCtx.state === 'suspended') {
        await this.outputAudioCtx.resume();
      }

      // 2. Setup WebSocket connection to server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/voice/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Probe Voice] Connected to Live Voice socket');
        this.isConnected = true;
        this.startMicrophoneCapture();
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('[Probe Voice] Failed to parse message from server:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[Probe Voice] WebSocket error:', e);
        this.callbacks.onError('Voice connection error occurred.');
      };

      this.ws.onclose = () => {
        console.log('[Probe Voice] WebSocket closed');
        this.disconnect();
      };
    } catch (err: any) {
      console.error('[Probe Voice] Connection error:', err);
      this.disconnect();
      const message = err.name === 'NotAllowedError' 
        ? 'Microphone access was denied. Please allow microphone permissions in your browser.' 
        : (err.message || 'Could not connect to Gemini Live voice service.');
      this.callbacks.onError(message);
      throw err;
    }
  }

  private startMicrophoneCapture() {
    if (!this.inputAudioCtx || !this.mediaStream || !this.ws) return;

    this.sourceNode = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
    // 4096 buffer size gives a good balance between latency (~85ms) and CPU efficiency
    this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

    const inputSampleRate = this.inputAudioCtx.sampleRate;
    const targetSampleRate = 16000;

    this.scriptProcessor.onaudioprocess = (e) => {
      if (this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const inputChannelData = e.inputBuffer.getChannelData(0);

      // Check input volume for active speaking detection
      let sum = 0;
      for (let i = 0; i < inputChannelData.length; i++) {
        sum += inputChannelData[i] * inputChannelData[i];
      }
      const rms = Math.sqrt(sum / inputChannelData.length);
      if (rms > 0.02 && !this.speakingActive && this.currentState !== 'speaking' && this.currentState !== 'executing') {
        this.setState('listening');
      }

      // Resample down to 16,000 Hz 16-bit PCM little-endian
      const pcm16 = this.downsampleTo16k(inputChannelData, inputSampleRate, targetSampleRate);
      const base64Audio = this.int16ToBase64(pcm16);

      this.ws.send(JSON.stringify({
        type: 'audio',
        audio: base64Audio
      }));
    };

    this.sourceNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioCtx.destination);
  }

  private async handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'ready':
        this.setState('listening');
        break;

      case 'audio':
        if (msg.audio) {
          this.handleIncomingAudioChunk(msg.audio);
        }
        break;

      case 'user_transcript':
        if (msg.text) {
          this.currentUserTranscript += (this.currentUserTranscript ? ' ' : '') + msg.text;
          this.callbacks.onUserTranscript(msg.text);
          this.setState('thinking');
        }
        break;

      case 'agent_transcript':
        if (msg.text) {
          this.currentAgentTranscript += (this.currentAgentTranscript ? ' ' : '') + msg.text;
          this.callbacks.onAgentTranscript(msg.text);
        }
        break;

      case 'agent_text':
        if (msg.text && this.callbacks.onAgentTextChunk) {
          this.callbacks.onAgentTextChunk(msg.text);
        }
        break;

      case 'interrupted':
        this.stopAudioPlayback();
        this.currentAgentTranscript = '';
        this.callbacks.onInterrupted();
        this.setState('listening');
        break;

      case 'turn_complete':
        if (this.callbacks.onTurnComplete && (this.currentUserTranscript.trim() || this.currentAgentTranscript.trim())) {
          this.callbacks.onTurnComplete(this.currentUserTranscript.trim(), this.currentAgentTranscript.trim());
          this.currentUserTranscript = '';
          this.currentAgentTranscript = '';
        }
        if (this.activeSources.length === 0) {
          this.setState('listening');
        }
        break;

      case 'tool_call':
        if (msg.functionCalls && msg.functionCalls.length > 0) {
          await this.executeToolCalls(msg.functionCalls);
        }
        break;

      case 'error':
        this.callbacks.onError(msg.message || 'Voice error occurred');
        break;

      default:
        break;
    }
  }

  private handleIncomingAudioChunk(base64Audio: string) {
    if (!this.outputAudioCtx) return;

    this.setState('speaking');
    this.speakingActive = true;

    try {
      const float32Samples = this.base64ToFloat32(base64Audio);
      if (float32Samples.length === 0) return;

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Samples.length, 24000);
      audioBuffer.getChannelData(0).set(float32Samples);

      const sourceNode = this.outputAudioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.outputAudioCtx.destination);

      const now = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < now) {
        this.nextStartTime = now + 0.02; // Tiny 20ms jitter buffer
      }

      sourceNode.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.activeSources.push(sourceNode);

      sourceNode.onended = () => {
        const idx = this.activeSources.indexOf(sourceNode);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }

        if (this.activeSources.length === 0) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            if (this.activeSources.length === 0 && this.currentState === 'speaking') {
              this.speakingActive = false;
              this.setState('listening');
            }
          }, 200);
        }
      };
    } catch (e) {
      console.error('[Probe Voice] Audio chunk playback error:', e);
    }
  }

  public stopAudioPlayback() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // ignore
      }
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
    this.speakingActive = false;
  }

  private async executeToolCalls(functionCalls: any[]) {
    this.setState('executing');
    const responses: any[] = [];

    for (const call of functionCalls) {
      const { id, name, args } = call;
      console.log(`[Probe Voice] Executing action: ${name}`, args);
      this.callbacks.onToolExecuting(name, args || {});

      try {
        const result = await this.callbacks.toolExecutor(name, args || {});
        this.callbacks.onToolComplete(name, result);
        responses.push({
          id,
          name,
          response: {
            output: result ?? { status: 'success' }
          }
        });
      } catch (err: any) {
        console.error(`[Probe Voice] Error executing action ${name}:`, err);
        responses.push({
          id,
          name,
          response: {
            error: err.message || 'Action failed to execute'
          }
        });
      }
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'tool_response',
        functionResponses: responses
      }));
    }
  }

  public updateContext(contextData: Record<string, any>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'context_update',
        context: contextData
      }));
    }
  }

  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.setState('thinking');
      this.ws.send(JSON.stringify({
        type: 'text_input',
        text
      }));
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public disconnect() {
    this.stopAudioPlayback();

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch (e) {
        // ignore
      }
      this.inputAudioCtx = null;
    }
    if (this.outputAudioCtx) {
      try {
        this.outputAudioCtx.close();
      } catch (e) {
        // ignore
      }
      this.outputAudioCtx = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    this.isConnected = false;
    this.setState('idle');
  }

  // Linear downsampling from inputSampleRate (e.g. 48kHz or 44.1kHz) to 16kHz
  private downsampleTo16k(buffer: Float32Array, inputRate: number, targetRate: number): Int16Array {
    if (inputRate === targetRate) {
      const result = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, buffer[i]));
        result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return result;
    }

    const ratio = inputRate / targetRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      const avg = count > 0 ? accum / count : 0;
      const s = Math.max(-1, Math.min(1, avg));
      result[offsetResult] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }

    return result;
  }

  private int16ToBase64(int16Array: Int16Array): string {
    const bytes = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToFloat32(base64: string): Float32Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    return float32Array;
  }
}
