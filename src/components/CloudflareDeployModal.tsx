import React, { useState } from 'react';
import {
  X,
  Cloud,
  Terminal,
  Cpu,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Zap,
} from 'lucide-react';

interface CloudflareDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerUrl: string;
  onSaveWorkerUrl: (url: string) => void;
}

export const CloudflareDeployModal: React.FC<CloudflareDeployModalProps> = ({
  isOpen,
  onClose,
  workerUrl,
  onSaveWorkerUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'wrangler' | 'worker' | 'test'>('guide');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState(workerUrl);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const wranglerConfig = `{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "sawtify-arabic-stt",
  "main": "src/worker.ts",
  "compatibility_date": "2024-11-12",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "ai": {
    "binding": "AI"
  },
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  },
  "observability": {
    "enabled": true
  }
}`;

  const workerCode = `/**
 * Cloudflare Worker with AI Binding
 * Model: @cf/openai/whisper-large-v3-turbo
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    if (url.pathname === '/api/transcribe' && request.method === 'POST') {
      const audioBuffer = await request.arrayBuffer();
      const task = request.headers.get('X-Task') || 'transcribe';
      const language = request.headers.get('X-Language') || 'ar';

      // Execute Whisper-large-v3-turbo on Cloudflare Workers AI
      const aiResponse = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
        audio: [...new Uint8Array(audioBuffer)],
        task,
        language,
      });

      return new Response(JSON.stringify(aiResponse), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Serve static SPA assets from dist/
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not Found', { status: 404 });
  },
};`;

  const handleTestWorker = async () => {
    if (!inputUrl) {
      setTestStatus('Veuillez entrer une URL valide de Cloudflare Worker.');
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    try {
      const cleanUrl = inputUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/api/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setTestStatus(`✅ Connecté avec succès au Worker! Modèle: ${data.model || '@cf/openai/whisper-large-v3-turbo'}`);
        onSaveWorkerUrl(cleanUrl);
      } else {
        setTestStatus(`⚠️ Réponse du Worker (${res.status}): Vérifiez que la route /api/health ou /api/transcribe est déployée.`);
      }
    } catch (e: any) {
      setTestStatus(`❌ Échec de la connexion: ${e.message}. Vérifiez les en-têtes CORS.`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Déploiement Cloudflare Workers & AI Binding</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 font-mono">
                  Workers AI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configuration native de <code className="text-amber-300">@cf/openai/whisper-large-v3-turbo</code> avec le binding <code className="text-amber-300">env.AI</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6">
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Guide de déploiement (Wrangler)</span>
          </button>

          <button
            onClick={() => setActiveTab('wrangler')}
            className={`py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'wrangler'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>wrangler.jsonc</span>
          </button>

          <button
            onClick={() => setActiveTab('worker')}
            className={`py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'worker'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>src/worker.ts</span>
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'test'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Tester l'URL déployée</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs md:text-sm space-y-1">
                  <p className="font-bold text-orange-200">
                    Configuration prête pour Cloudflare Workers AI :
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    Les fichiers <code className="font-mono text-amber-300">wrangler.jsonc</code>, <code className="font-mono text-amber-300">wrangler.toml</code> et <code className="font-mono text-amber-300">src/worker.ts</code> sont déjà générés et intégrés à la racine du projet avec le binding AI activé.
                  </p>
                </div>
              </div>

              {/* Step 1 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center text-xs font-mono font-bold">1</span>
                  <span>Installer Cloudflare Wrangler CLI (si non installé)</span>
                </h4>
                <div className="relative group">
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-400 overflow-x-auto">
                    npm install -g wrangler
                  </pre>
                  <button
                    onClick={() => copyToClipboard('npm install -g wrangler', 'step1')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {copiedCode === 'step1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center text-xs font-mono font-bold">2</span>
                  <span>Connexion à votre compte Cloudflare</span>
                </h4>
                <div className="relative group">
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-400 overflow-x-auto">
                    npx wrangler login
                  </pre>
                  <button
                    onClick={() => copyToClipboard('npx wrangler login', 'step2')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {copiedCode === 'step2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center text-xs font-mono font-bold">3</span>
                  <span>Compiler l'interface React et déployer sur Workers AI</span>
                </h4>
                <div className="relative group">
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-400 overflow-x-auto">
{`npm run build
npx wrangler deploy`}
                  </pre>
                  <button
                    onClick={() => copyToClipboard('npm run build\nnpx wrangler deploy', 'step3')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {copiedCode === 'step3' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Cloudflare déploiera l'application sur un domaine gratuit <code className="text-orange-400">*.workers.dev</code> avec Whisper-large-v3-turbo activé instantanément !
                </p>
              </div>
            </div>
          )}

          {activeTab === 'wrangler' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Fichier de configuration Cloudflare avec le binding AI <code className="text-orange-400">ai = &#123; binding = "AI" &#125;</code> :
                </p>
                <button
                  onClick={() => copyToClipboard(wranglerConfig, 'wranglerConfig')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  {copiedCode === 'wranglerConfig' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copier wrangler.jsonc</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-slate-300 overflow-x-auto">
                {wranglerConfig}
              </pre>
            </div>
          )}

          {activeTab === 'worker' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Code du Worker exécutant l'inférence Whisper-large-v3-turbo directement à l'Edge :
                </p>
                <button
                  onClick={() => copyToClipboard(workerCode, 'workerCode')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  {copiedCode === 'workerCode' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copier le Worker</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-slate-300 overflow-x-auto max-h-80">
                {workerCode}
              </pre>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Après avoir exécuté <code className="text-orange-400">wrangler deploy</code>, entrez votre URL Cloudflare Workers pour connecter directement cette interface à votre Worker déployé :
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  placeholder="https://sawtify-stt.your-subdomain.workers.dev"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 font-mono"
                />
                <button
                  onClick={handleTestWorker}
                  disabled={isTesting || !inputUrl}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs md:text-sm transition-all disabled:opacity-50 shrink-0"
                >
                  {isTesting ? 'Test en cours...' : 'Tester & Enregistrer'}
                </button>
              </div>

              {testStatus && (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm font-medium">
                  {testStatus}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <a
            href="https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-400 transition-colors"
          >
            <span>Documentation officielle Cloudflare Workers AI</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs md:text-sm font-bold text-slate-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
