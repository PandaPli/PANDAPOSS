"use client";

import { useCallback, useRef, useState } from "react";

type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "responding" | "executing" | "error";

type UsePandiVoiceRealtimeOptions = {
  onUserTranscript?: (text: string) => void;
  onAssistantTranscript?: (text: string) => void;
  onToolCall?: (name: string, result: { ok: boolean; message: string }) => void;
  onError?: (message: string) => void;
};

const REALTIME_URL = "https://api.openai.com/v1/realtime";

export function usePandiVoiceRealtime(options: UsePandiVoiceRealtimeOptions = {}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [level, setLevel] = useState(0);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const assistantBufferRef = useRef("");
  const userBufferRef = useRef("");
  // Acumular argumentos parciales de function calls
  const fnCallBufferRef = useRef<Record<string, { name: string; args: string }>>({});

  const stopMeter = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setLevel(0);
  }, []);

  const startMeter = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    audioContextRef.current = audioContext;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / data.length;
      setLevel(Math.min(1, average / 90));
      animationRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, []);

  const cleanup = useCallback(() => {
    dataChannelRef.current?.close();
    peerConnectionRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteAudioRef.current?.remove();
    dataChannelRef.current = null;
    peerConnectionRef.current = null;
    mediaStreamRef.current = null;
    remoteAudioRef.current = null;
    assistantBufferRef.current = "";
    userBufferRef.current = "";
    fnCallBufferRef.current = {};
    stopMeter();
    setState("idle");
  }, [stopMeter]);

  /** Envia un evento al modelo via data channel */
  const sendEvent = useCallback((event: Record<string, unknown>) => {
    const dc = dataChannelRef.current;
    if (dc?.readyState === "open") {
      dc.send(JSON.stringify(event));
    }
  }, []);

  /** Ejecuta un function call contra /api/voice/action y devuelve el resultado al modelo */
  const executeFunctionCall = useCallback(
    async (callId: string, name: string, argsJson: string) => {
      setState("executing");

      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(argsJson);
      } catch {
        args = {};
      }

      try {
        const response = await fetch("/api/voice/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, arguments: args }),
        });

        const result = await response.json();
        options.onToolCall?.(name, result);

        // Enviar resultado al modelo
        sendEvent({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify(result),
          },
        });

        // Disparar respuesta del modelo
        sendEvent({ type: "response.create" });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Error ejecutando accion";

        sendEvent({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify({ ok: false, message: errorMsg }),
          },
        });

        sendEvent({ type: "response.create" });
      }
    },
    [options, sendEvent],
  );

  const handleRealtimeEvent = useCallback(
    (event: MessageEvent<string>) => {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      const type = payload.type as string;

      // ── Audio / VAD events ──
      if (type === "input_audio_buffer.speech_started") setState("listening");
      if (type === "input_audio_buffer.speech_stopped") setState("thinking");
      if (type === "response.audio.delta") setState("responding");

      // ── User transcript (streamed) ──
      if (type === "conversation.item.input_audio_transcription.delta" && payload.delta) {
        userBufferRef.current += payload.delta as string;
      }

      if (type === "conversation.item.input_audio_transcription.completed") {
        const transcript = (payload.transcript as string) ?? userBufferRef.current;
        userBufferRef.current = "";
        if (transcript.trim()) options.onUserTranscript?.(transcript.trim());
      }

      // ── Assistant transcript (streamed) ──
      if (type === "response.audio_transcript.delta" && payload.delta) {
        assistantBufferRef.current += payload.delta as string;
      }

      if (type === "response.audio_transcript.done") {
        const transcript = (payload.transcript as string) ?? assistantBufferRef.current;
        assistantBufferRef.current = "";
        if (transcript.trim()) options.onAssistantTranscript?.(transcript.trim());
        setState("listening");
      }

      // ── Function call: argumentos parciales ──
      if (type === "response.function_call_arguments.delta") {
        const callId = payload.call_id as string;
        if (!fnCallBufferRef.current[callId]) {
          fnCallBufferRef.current[callId] = { name: (payload.name as string) ?? "", args: "" };
        }
        fnCallBufferRef.current[callId].args += (payload.delta as string) ?? "";
        // Capturar nombre si viene en este delta
        if (payload.name) fnCallBufferRef.current[callId].name = payload.name as string;
      }

      // ── Function call: completo → ejecutar ──
      if (type === "response.function_call_arguments.done") {
        const callId = payload.call_id as string;
        const name = (payload.name as string) ?? fnCallBufferRef.current[callId]?.name ?? "";
        const argsJson = (payload.arguments as string) ?? fnCallBufferRef.current[callId]?.args ?? "{}";
        delete fnCallBufferRef.current[callId];

        void executeFunctionCall(callId, name, argsJson);
      }

      // ── Response done (sin audio = fin de turno sin habla) ──
      if (type === "response.done") {
        const response = payload.response as Record<string, unknown> | undefined;
        const output = response?.output as Array<Record<string, unknown>> | undefined;
        // Si la respuesta solo tenia function calls (sin audio), quedamos en listening
        const hasAudio = output?.some((o) => o.type === "audio");
        if (!hasAudio) setState("listening");
      }

      // ── Errores ──
      if (type === "error") {
        const errorData = payload.error as Record<string, unknown> | undefined;
        const message = (errorData?.message as string) ?? "Error en sesion de voz";
        options.onError?.(message);
      }
    },
    [options, executeFunctionCall],
  );

  const start = useCallback(async () => {
    try {
      setState("connecting");

      // 1. Obtener ephemeral key del backend
      const tokenResponse = await fetch("/api/voice/realtime-session", { method: "POST" });
      const tokenData = await tokenResponse.json();

      const ephemeralKey =
        tokenData.client_secret?.value ?? tokenData.value ?? tokenData.key;

      if (!tokenResponse.ok || !ephemeralKey) {
        throw new Error(tokenData.error ?? "No se pudo iniciar sesion de voz");
      }

      // 2. Crear WebRTC peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = pc;

      // 3. Audio remoto (respuestas habladas del modelo)
      const remoteAudio = document.createElement("audio");
      remoteAudio.autoplay = true;
      remoteAudioRef.current = remoteAudio;
      pc.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0] ?? null;
      };

      // 4. Capturar microfono con optimizaciones para restaurantes ruidosos
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 24000,
        },
      });
      mediaStreamRef.current = stream;
      startMeter(stream);
      pc.addTrack(stream.getAudioTracks()[0], stream);

      // 5. Data channel para eventos bidireccionales
      const dataChannel = pc.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      dataChannel.onmessage = handleRealtimeEvent;
      dataChannel.onopen = () => setState("listening");

      // 6. SDP offer → OpenAI Realtime
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(`${REALTIME_URL}?model=${tokenData.model ?? "gpt-4o-realtime-preview"}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) throw new Error("OpenAI Realtime no acepto la conexion WebRTC");

      await pc.setRemoteDescription({
        type: "answer",
        sdp: await sdpResponse.text(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error de voz";
      options.onError?.(message);
      cleanup();
      setState("error");
    }
  }, [cleanup, handleRealtimeEvent, options, startMeter]);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    state,
    level,
    isActive: state !== "idle" && state !== "error",
    start,
    stop,
  };
}
