"use client";

import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { createPandiAnswer } from "../pandi-engine";
import type { PandiAnswer, PandiMessage } from "../types";
import { PANDI_QUICK_QUESTIONS } from "../knowledge";

interface PandiAssistantProps {
  title?: string;
  subtitle?: string;
  initialOpen?: boolean;
  onAsk?: (question: string, history: PandiMessage[]) => Promise<PandiAnswer>;
}

export function PandiAssistant({
  title = "PANDI",
  subtitle = "Asistente de PandaPoss",
  initialOpen = false,
  onAsk,
}: PandiAssistantProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [question, setQuestion] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<PandiMessage[]>(() => [
    createMessage(
      "assistant",
      "Hola, soy PANDI. Puedo ayudarte con ventas, productos, clientes, pedidos, delivery, cajas, reportes y configuracion.",
    ),
  ]);

  const quickQuestions = useMemo(() => PANDI_QUICK_QUESTIONS.slice(0, 4), []);

  async function askPandi(nextQuestion: string) {
    const trimmedQuestion = nextQuestion.trim();
    if (!trimmedQuestion || isThinking) return;

    const userMessage = createMessage("user", trimmedQuestion);
    const nextHistory = [...messages, userMessage];

    setMessages(nextHistory);
    setQuestion("");
    setIsThinking(true);

    try {
      const result = onAsk
        ? await onAsk(trimmedQuestion, nextHistory)
        : createPandiAnswer({ question: trimmedQuestion, history: nextHistory });

      setMessages((current) => [...current, createMessage("assistant", result.answer)]);
    } catch {
      setMessages((current) => [
        ...current,
        createMessage("assistant", "No pude responder ahora. Revisa la conexion del asistente e intenta nuevamente."),
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askPandi(question);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/30 transition hover:bg-purple-700"
        aria-label="Abrir asistente PANDI"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <section className="fixed bottom-5 right-5 z-50 flex h-[620px] w-[380px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl shadow-slate-900/15">
      <header className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-950 to-purple-700 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">{title}</h2>
            <p className="text-xs text-purple-100">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-purple-100 transition hover:bg-white/10 hover:text-white"
          aria-label="Cerrar asistente PANDI"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
        {messages.map((message) => (
          <article
            key={message.id}
            className={
              message.role === "assistant"
                ? "mr-8 rounded-2xl rounded-tl-sm border border-purple-100 bg-white px-3 py-2 text-sm leading-6 text-slate-800 shadow-sm"
                : "ml-8 rounded-2xl rounded-tr-sm bg-purple-600 px-3 py-2 text-sm leading-6 text-white shadow-sm"
            }
          >
            {message.content}
          </article>
        ))}

        {isThinking ? (
          <div className="mr-8 flex items-center gap-2 rounded-2xl rounded-tl-sm border border-purple-100 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Pensando...
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-100 bg-white p-3">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {quickQuestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => void askPandi(item)}
              className="shrink-0 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:border-purple-200 hover:bg-purple-100"
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label className="sr-only" htmlFor="pandi-question">
            Pregunta para PANDI
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-purple-400 focus-within:bg-white">
            <Sparkles className="h-4 w-4 shrink-0 text-purple-500" />
            <input
              id="pandi-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Preguntame sobre PandaPoss"
              disabled={isThinking}
            />
          </div>
          <button
            type="submit"
            disabled={isThinking || !question.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Enviar pregunta"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}

function createMessage(role: PandiMessage["role"], content: string): PandiMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}
