/**
 * Mock LLM Provider
 * Used when AWS Bedrock credentials not available
 */

import { ILLMProvider, LLMMessage, LLMResponse } from './llm-provider.interface';

export class MockLLMProvider implements ILLMProvider {
  async generate(messages: LLMMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<LLMResponse> {
    console.log('[MockLLMProvider] Generating response for', messages.length, 'messages');
    
    // Extract the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const query = lastUserMessage?.content || '';

    // Simple mock responses based on query patterns
    let response = '';

    if (query.toLowerCase().includes('should i')) {
      response = JSON.stringify({
        recommendation: {
          option: 'skip',
          confidence: 0.72,
          reasoning: 'Given your current hackathon deadline and limited time remaining, focusing on your primary goal would be more beneficial. The workshop opportunity, while valuable, can be pursued after the deadline.'
        },
        tradeoffs: [
          {
            option: 'attend',
            gains: ['Career development', 'Networking opportunity', 'AWS knowledge'],
            costs: ['4 hours from hackathon work', 'Increased deadline pressure', 'Reduced recovery time']
          },
          {
            option: 'skip',
            gains: ['Protected deep work time', 'Reduced stress', 'Better deadline alignment'],
            costs: ['Missed networking', 'Delayed learning opportunity']
          }
        ]
      });
    } else if (query.toLowerCase().includes('context') || query.toLowerCase().includes('calendar')) {
      response = JSON.stringify({
        goals: [
          { id: 'g1', description: 'Complete hackathon MVP', deadline: '2026-09-25', priority: 'high' }
        ],
        commitments: [],
        preferences: [
          { id: 'p1', category: 'work', description: 'Prefer morning deep work sessions', value: 'morning-focus' }
        ],
        confidence: 0.65
      });
    } else {
      response = JSON.stringify({
        message: 'Mock LLM response - Bedrock credentials not configured',
        note: 'This is a placeholder response from the mock LLM provider'
      });
    }

    return {
      content: response,
      usage: {
        inputTokens: messages.reduce((sum, m) => sum + m.content.length / 4, 0),
        outputTokens: response.length / 4
      }
    };
  }
}
