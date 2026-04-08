import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env.local');

interface KeyConfig {
  id: string;
  envVar: string;
  label: string;
  required: boolean;
  description: string;
}

const KEYS: KeyConfig[] = [
  { id: 'anthropic', envVar: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', required: true, description: 'Powers all AI analysis, questionnaires, probes, and compilation' },
  { id: 'openai', envVar: 'OPENAI_API_KEY', label: 'OpenAI API Key', required: false, description: 'Probe image generation (imagery-driven designs only)' },
  { id: 'openai_image', envVar: 'OPENAI_IMAGE_API_KEY', label: 'OpenAI Image API Key', required: false, description: 'Separate key for GPT Image (falls back to OpenAI key)' },
  { id: 'apify', envVar: 'APIFY_API_TOKEN', label: 'Apify API Token', required: false, description: 'Pinterest board ingestion' },
  { id: 'unsplash_access', envVar: 'UNSPLASH_ACCESS_KEY', label: 'Unsplash Access Key', required: false, description: 'Editorial image search for probe visuals' },
  { id: 'unsplash_secret', envVar: 'UNSPLASH_SECRET_KEY', label: 'Unsplash Secret Key', required: false, description: 'Required alongside access key' },
];

function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

function readEnvFile(): Record<string, string> {
  if (!fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (val) vars[key] = val;
  }
  return vars;
}

function writeEnvVar(envVar: string, value: string): void {
  // Sanitize: strip newlines/carriage returns to prevent env var injection
  const sanitized = value.replace(/[\r\n]/g, '');
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
  // Escape envVar for regex safety (only whitelisted vars reach here, but defense in depth)
  const escaped = envVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escaped}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${envVar}=${sanitized}`);
  } else {
    content = content.trimEnd() + `\n${envVar}=${sanitized}\n`;
  }
  fs.writeFileSync(ENV_PATH, content);
}

// GET: Return key status (masked, never full values)
export async function GET() {
  const env = readEnvFile();
  const keys = KEYS.map((k) => ({
    id: k.id,
    envVar: k.envVar,
    label: k.label,
    required: k.required,
    description: k.description,
    isSet: !!env[k.envVar],
    masked: env[k.envVar] ? maskKey(env[k.envVar]) : null,
  }));
  return NextResponse.json({ keys });
}

// PATCH: Update a key value
export async function PATCH(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { envVar, value } = body as { envVar: string; value: string };
  if (!envVar || !value) {
    return NextResponse.json({ error: 'envVar and value required' }, { status: 400 });
  }

  const validVars = KEYS.map((k) => k.envVar);
  if (!validVars.includes(envVar)) {
    return NextResponse.json({ error: 'Unknown environment variable' }, { status: 400 });
  }

  writeEnvVar(envVar, value);

  return NextResponse.json({ success: true, masked: maskKey(value) });
}
