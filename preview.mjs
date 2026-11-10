import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./docs', import.meta.url)));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const escapeXml = text => text.replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);

async function api(req, res, path) {
  if (req.method !== 'POST') return res.writeHead(405).end();
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 10000) return res.writeHead(413).end();
  }
  let input;
  try { input = JSON.parse(body); } catch { return res.writeHead(400).end(); }
  const text = input?.text?.trim?.();
  if (!text || text.length > 1500) return res.writeHead(400).end();
  const speech = path === '/api/speech';
  const key = process.env[speech ? 'AZURE_SPEECH_KEY' : 'AZURE_TRANSLATOR_KEY'];
  const region = process.env[speech ? 'AZURE_SPEECH_REGION' : 'AZURE_TRANSLATOR_REGION'];
  if (!key || (speech && !/^[a-z0-9]+$/.test(region ?? ''))) return res.writeHead(503).end();
  const headers = { 'Ocp-Apim-Subscription-Key': key };
  let url;
  let payload;
  if (speech) {
    url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    headers['Content-Type'] = 'application/ssml+xml';
    headers['X-Microsoft-OutputFormat'] = 'audio-24khz-48kbitrate-mono-mp3';
    payload = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural"><prosody rate="${input.slow === true ? '-20%' : '0%'}">${escapeXml(text)}</prosody></voice></speak>`;
  } else {
    url = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hant';
    headers['Content-Type'] = 'application/json';
    if (region) headers['Ocp-Apim-Subscription-Region'] = region;
    payload = JSON.stringify([{ Text: text }]);
  }
  const upstream = await fetch(url, { method: 'POST', headers, body: payload, signal: AbortSignal.timeout(15000) });
  if (!upstream.ok) {
    const details = await upstream.json().catch(() => null);
    const code = String(details?.error?.code ?? '');
    const safeCode = /^[A-Za-z0-9_-]{1,40}$/.test(code) ? ' (' + code + ')' : '';
    console.error((speech ? 'Speech' : 'Translator') + ' Azure HTTP ' + upstream.status + safeCode);
    return res.writeHead(502).end();
  }
  const output = Buffer.from(await upstream.arrayBuffer());
  res.writeHead(200, { 'Content-Type': speech ? 'audio/mpeg' : 'application/json', 'Cache-Control': 'no-store' }).end(output);
}

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/api/speech' || path === '/api/translate') return await api(req, res, path);
    const file = resolve(root, path === '/' ? 'index.html' : '.' + path);
    if (!file.startsWith(root + sep)) return res.writeHead(404).end();
    const content = await readFile(file).catch(() => null);
    if (!content) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }).end(content);
  } catch (error) {
    console.error('Preview request failed:', error.cause?.code ?? error.name);
    res.writeHead(502).end();
  }
}).listen(8766, '127.0.0.1');
