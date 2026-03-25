import { TokenUsage } from '../types';

export interface TextProvider {
  generateText(params: {
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
  }): Promise<{ text: string; usage: TokenUsage }>;
}

export interface VisionProvider {
  analyzeImage(params: {
    systemPrompt: string;
    userPrompt: string;
    images: Array<{ base64: string; mediaType: string }>;
    maxTokens?: number;
  }): Promise<{ text: string; usage: TokenUsage }>;
}

export interface ImageGenerationProvider {
  generateImage(params: {
    prompt: string;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
  }): Promise<{ imageData: Buffer; cost: number }>;
}
