/**
 * Cloudflare Worker for Arabic Speech-to-Text
 * Model: @cf/openai/whisper-large-v3-turbo
 * Uses Cloudflare Workers AI binding (env.AI)
 */

export interface Env {
  AI: {
    run: (
      model: string,
      inputs: {
        audio: number[] | Uint8Array;
        task?: 'transcribe' | 'translate';
        language?: string;
        initial_prompt?: string;
      }
    ) => Promise<{
      text?: string;
      vtt?: string;
      words?: Array<{ word: string; start: number; end: number }>;
      word_count?: number;
    }>;
  };
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Task, X-Language',
        },
      });
    }

    // Healthcheck / metadata endpoint
    if (url.pathname === '/api/health' || url.pathname === '/api/info') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'Cloudflare Workers AI Speech-to-Text',
          model: '@cf/openai/whisper-large-v3-turbo',
          supportedLanguages: ['ar', 'en', 'fr', 'auto'],
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Main speech-to-text API endpoint
    if (url.pathname === '/api/transcribe' && request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        let audioBytes: Uint8Array;
        let task: 'transcribe' | 'translate' = (request.headers.get('X-Task') as any) || 'transcribe';
        let language = request.headers.get('X-Language') || 'ar';
        let prompt = request.headers.get('X-Prompt') || 'نص عربي دقيق وفصيح';

        // Read audio payload based on content-type
        if (contentType.includes('application/json')) {
          const body: any = await request.json();
          if (!body.audio) {
            return new Response(
              JSON.stringify({ error: 'Missing "audio" base64 or array in JSON payload' }),
              { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            );
          }
          if (typeof body.audio === 'string') {
            // Base64 string
            const binary = atob(body.audio);
            audioBytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              audioBytes[i] = binary.charCodeAt(i);
            }
          } else if (Array.isArray(body.audio)) {
            audioBytes = new Uint8Array(body.audio);
          } else {
            return new Response(JSON.stringify({ error: 'Invalid audio format' }), { status: 400 });
          }

          if (body.task) task = body.task;
          if (body.language) language = body.language;
          if (body.prompt) prompt = body.prompt;
        } else {
          // Direct binary stream (Blob, ArrayBuffer, audio/webm, audio/wav, audio/mp3)
          const arrayBuffer = await request.arrayBuffer();
          if (arrayBuffer.byteLength === 0) {
            return new Response(
              JSON.stringify({ error: 'Empty audio buffer received' }),
              { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            );
          }
          audioBytes = new Uint8Array(arrayBuffer);
        }

        // Call Cloudflare Workers AI with Whisper-large-v3-turbo
        // Note: Whisper-large-v3-turbo takes an array of numbers or Uint8Array
        const aiResponse = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
          audio: [...audioBytes],
          task,
          language: language === 'auto' ? undefined : language,
          initial_prompt: prompt,
        });

        const text = aiResponse.text || '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

        return new Response(
          JSON.stringify({
            success: true,
            model: '@cf/openai/whisper-large-v3-turbo',
            provider: 'cloudflare-workers-ai',
            task,
            language,
            text,
            vtt: aiResponse.vtt || null,
            words: aiResponse.words || [],
            wordCount,
            detectedLanguage: language,
            processedAt: new Date().toISOString(),
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (err: any) {
        console.error('Cloudflare Workers AI transcription error:', err);
        return new Response(
          JSON.stringify({
            success: false,
            error: err.message || 'Error executing Whisper-large-v3-turbo on Cloudflare Workers AI',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Serve static assets if ASSETS binding is present (Cloudflare Workers Static Assets)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
