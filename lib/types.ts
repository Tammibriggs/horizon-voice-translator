export type TurnStatus = 'listening' | 'translating' | 'speaking' | 'done' | 'error';

export type Turn = {
  id: string;
  createdAt: number;
  status: TurnStatus;
  /** Side of the horizon this turn belongs to: source shore or target shore. */
  side: 'source' | 'target';
  detectedLanguage?: string;
  sourceText?: string;
  translatedText?: string;
  audioUrl?: string;
  error?: string;
};

export type TranslateResponse = {
  spokenSide: 'A' | 'B';
  detectedLanguage: string;
  sourceText: string;
  translatedText: string;
};
