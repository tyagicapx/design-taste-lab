import { TextProvider, VisionProvider, ImageGenerationProvider } from './provider';
import { claudeText, claudeVision } from './claude';
import { openaiImages } from './openai-images';
import { demoText, demoVision } from './demo';
import { AICapability } from '../types';

// Provider registry — reads from env vars to determine which provider handles each capability
// Default: text=claude, vision=claude, image_generation=openai
// Demo mode: DEMO_MODE=true uses mock providers (no API keys needed)

const IS_DEMO = process.env.DEMO_MODE === 'true';

function getTextProvider(): TextProvider {
  if (IS_DEMO) return demoText;
  return claudeText;
}

function getVisionProvider(): VisionProvider {
  if (IS_DEMO) return demoVision;

  return claudeVision;
}

function getImageGenerationProvider(): ImageGenerationProvider {
  return openaiImages;
}

export function getProvider(capability: AICapability) {
  switch (capability) {
    case 'text':
      return getTextProvider();
    case 'vision':
      return getVisionProvider();
    case 'image_generation':
      return getImageGenerationProvider();
  }
}

export const textProvider = getTextProvider();
export const visionProvider = getVisionProvider();
export const imageProvider = getImageGenerationProvider();
