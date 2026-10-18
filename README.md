# Sawtify - Arabic Speech-to-Text with Whisper-large-v3-turbo on Cloudflare Workers AI

Application web moderne et réactive pour convertir la voix et le discours en langue arabe (Arabe standard moderne / الفصحى et dialectes : marocain, égyptien, levantin, golfe) en texte écrit en utilisant le modèle **`@cf/openai/whisper-large-v3-turbo`** de Cloudflare Workers AI via le binding natif `env.AI`.

---

## 🚀 Fonctionnalités clés

1. **Bouton Micro Interactif & Tactile** :
   - Enregistrement direct depuis le navigateur avec MediaRecorder et annulation d'écho.
   - Visualiseur audio de fréquences en temps réel (Web Audio API `AnalyserNode`).
   - Chronomètre de durée d'enregistrement avec boutons Pause, Reprendre, Annuler et Valider.
2. **Support des dialectes arabes** :
   - الفصحى (العربية المعيارية الحديثة - Modern Standard)
   - الدارجة المغربية (Moroccan Darija)
   - اللهجة المصرية (Egyptian Arabic)
   - اللهجة الشامية (Levantine Arabic)
   - اللهجة الخليجية (Gulf Arabic)
3. **Double mode** :
   - Transcription directe en texte arabe avec police Cairo optimisée RTL.
   - Traduction vers l'anglais/français.
4. **Outils de transcription** :
   - Copie instantanée dans le presse-papiers avec toast.
   - Lecture vocale arabe (Text-to-Speech).
   - Export en `.TXT`, `.SRT` (sous-titres) et `.JSON`.
   - Compteur de mots et de caractères.
   - Édition de texte intégrée.
5. **Options d'entrée supplémentaires** :
   - Glisser-déposer de fichiers audio (MP3, WAV, M4A, WEBM, OGG).
   - Échantillons de phrases arabes pré-enregistrées pour tester immédiatement.
6. **Historique local** :
   - Sauvegarde automatique des transcriptions dans le stockage local du navigateur.

---

## ⚡ Déploiement sur Cloudflare Workers (avec AI Binding)

Le projet est configuré avec les fichiers prêts à l'emploi :
- `wrangler.jsonc` (configuration Cloudflare Workers avec le binding `AI` et les assets statiques)
- `wrangler.toml` (format compatible TOML)
- `src/worker.ts` (script Cloudflare Worker avec `env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio: ... })`)

### Étapes de déploiement en 1 minute :

1. **Installer Cloudflare Wrangler CLI** :
   ```bash
   npm install -g wrangler
   ```

2. **Se connecter à votre compte Cloudflare** :
   ```bash
   npx wrangler login
   ```

3. **Compiler le frontend React** :
   ```bash
   npm run build
   ```

4. **Déployer sur Cloudflare Workers** :
   ```bash
   npx wrangler deploy
   ```

Votre application sera automatiquement mise en ligne sur votre sous-domaine Cloudflare Workers :
`https://sawtify-arabic-stt.<votre-compte>.workers.dev`

---

## 🛠️ Exécution en local (Développement)

```bash
# Lancer le serveur de développement
npm run dev
```

L'application démarre sur `http://localhost:3000`.
Le serveur Node/Express intégré gère automatiquement les requêtes `/api/transcribe` en mode développement.
