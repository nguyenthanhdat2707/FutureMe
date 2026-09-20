/**
 * LLM Provider Interface
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ILLMProvider {
  generate(messages: LLMMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<LLMResponse>;
}
