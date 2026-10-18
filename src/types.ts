export interface TranscriptionItem {
  id: string;
  text: string;
  timestamp: number;
  duration?: number;
  dialect?: string;
  task?: 'transcribe' | 'translate';
  wordCount?: number;
  audioUrl?: string;
  provider?: string;
  model?: string;
}

export type ArabicDialect =
  | 'standard'
  | 'moroccan'
  | 'egyptian'
  | 'levantine'
  | 'gulf';

export interface CloudflareSettings {
  accountId: string;
  apiToken: string;
  workerUrl: string;
}

export interface DialectOption {
  id: ArabicDialect;
  name: string;
  arabicName: string;
  region: string;
  samplePrompt: string;
}
