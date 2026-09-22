import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ILLMProvider, LLMMessage, LLMResponse } from './llm-provider.interface';

export class BedrockLLMProvider implements ILLMProvider {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(region?: string, accessKeyId?: string, secretAccessKey?: string) {
    this.client = new BedrockRuntimeClient({
      region: region || process.env.AWS_REGION || 'ap-southeast-1',
      credentials: (accessKeyId && secretAccessKey)
        ? { accessKeyId, secretAccessKey }
        : undefined
    });
    this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
  }

  async generate(messages: LLMMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<LLMResponse> {
    const systemMessage = messages.find(m => m.role === 'system');
    const systemPrompt = systemMessage ? systemMessage.content : undefined;
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: [{ type: 'text', text: m.content }]
      }));

    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature !== undefined ? options.temperature : 0,
      system: systemPrompt,
      messages: conversationMessages
    };

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody)
      });

      const response = await this.client.send(command);
      const decodedBody = new TextDecoder().decode(response.body);
      const responseBody = JSON.parse(decodedBody) as {
        content?: Array<{ text: string }>;
        usage?: { input_tokens: number; output_tokens: number };
      };

      const content = responseBody.content && responseBody.content.length > 0
        ? responseBody.content[0].text
        : '';

      return {
        content,
        usage: {
          inputTokens: responseBody.usage?.input_tokens || 0,
          outputTokens: responseBody.usage?.output_tokens || 0,
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Bedrock generation failed: ${error.message}`);
      }
      throw new Error(`Bedrock generation failed: ${String(error)}`);
    }
  }
}
