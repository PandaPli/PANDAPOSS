export type PandiRole = "assistant" | "user";

export type PandiTopic =
  | "ventas"
  | "productos"
  | "clientes"
  | "pedidos"
  | "delivery"
  | "cajas"
  | "reportes"
  | "usuarios"
  | "mesas"
  | "carta_qr"
  | "kiosko"
  | "cupones"
  | "rrhh"
  | "configuracion"
  | "general";

export interface PandiMessage {
  id: string;
  role: PandiRole;
  content: string;
  createdAt: string;
}

export interface PandiKnowledgeItem {
  id: string;
  topic: PandiTopic;
  title: string;
  keywords: string[];
  answer: string;
  relatedModules?: string[];
}

export interface PandiAnswer {
  answer: string;
  confidence: number;
  matchedTopics: PandiTopic[];
  suggestions: string[];
}

export interface PandiAskInput {
  question: string;
  history?: PandiMessage[];
}
