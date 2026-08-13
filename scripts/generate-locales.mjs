import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = new URL('../', import.meta.url);
const CONTENT = new URL('../content/', import.meta.url);
const locales = { it: 'it', 'pt-BR': 'pt' };
const scalarKeys = new Set(['title','text','summary','topic','eyebrow','heading','label','contentNotice','requirement','role','when','changeSummary','scenario','name','shortName','description','area','notice','permissionHint','attribution']);
const arrayKeys = new Set(['topics','keywords','audience','items','immediateAction','whatToRecord','escalationConditions']);
const cachePath = new URL('./.translation-cache.json', import.meta.url);
let cache = {};
try { cache = JSON.parse(await readFile(cachePath, 'utf8')); } catch {}

const protect = (value) => String(value)
  .replaceAll('MOSCATELLI Atlas', 'ZXQATLASZXQ')
  .replaceAll('MOSCATELLI ATLAS', 'ZXQATLASCAPSZXQ')
  .replaceAll('MOSCATELLI', 'ZXQHOUSEZXQ')
  .replaceAll('MainHub', 'ZXQMAINHUBZXQ')
  .replaceAll('Supabase', 'ZXQSUPABASEZXQ')
  .replaceAll('Slack', 'ZXQSLACKZXQ');

function polish(value, locale) {
  let result = String(value)
    .replaceAll('ZXQATLASCAPSZXQ', 'MOSCATELLI ATLAS')
    .replaceAll('ZXQATLASZXQ', 'MOSCATELLI Atlas')
    .replaceAll('ZXQHOUSEZXQ', 'MOSCATELLI')
    .replaceAll('ZXQMAINHUBZXQ', 'MainHub')
    .replaceAll('ZXQSUPABASEZXQ', 'Supabase')
    .replaceAll('ZXQSLACKZXQ', 'Slack')
    .replaceAll('__MOSCATELLI_ATLAS_CAPS__', 'MOSCATELLI ATLAS')
    .replaceAll('__MOSCATELLI_ATLAS__', 'MOSCATELLI Atlas')
    .replaceAll('__MOSCATELLI__', 'MOSCATELLI')
    .replaceAll('__MAINHUB__', 'MainHub')
    .replaceAll('__SUPABASE__', 'Supabase')
    .replaceAll('__SLACK__', 'Slack');
  if (locale === 'pt-BR') {
    const brazilian = [
      [/\bficheiros?\b/gi, (m) => /^F/.test(m) ? 'Arquivos' : 'arquivos'],
      [/\butilizadores?\b/gi, (m) => /^U/.test(m) ? 'Usuários' : 'usuários'],
      [/\bpalavra-passe\b/gi, 'senha'], [/\bequipa\b/gi, 'equipe'],
      [/\bformação\b/gi, 'treinamento'], [/correio eletrónico/gi, 'e-mail'],
      [/\bregisto(s)?\b/gi, (_, plural) => plural ? 'registros' : 'registro'],
      [/\becrã(s)?\b/gi, (_, plural) => plural ? 'telas' : 'tela'],
      [/\bregistada\b/gi, 'registrada'], [/\bregistado\b/gi, 'registrado'],
      [/\brasto institucional\b/gi, 'trilha institucional'],
      [/\bproprietário\b/gi, 'responsável'], [/\bproprietária\b/gi, 'responsável'],
      [/\bpropriedade\b/gi, 'responsabilidade'],
      [/ · Fundação\b/g, ' · Fundamentos'],
      [/\bFundações da marca\b/g, 'Fundamentos da marca'],
      [/\bresposta perdida do fornecedor\b/gi, 'falta de resposta do fornecedor'],
      [/\btrabalho ao vivo\b/gi, 'trabalho em andamento'],
      [/\bgravação ao vivo\b/gi, 'registro em andamento'],
      [/\bA casa\b/g, 'A Maison'], [/\bFinanciar\b/g, 'Finanças'],
      [/\bum trilha institucional\b/gi, 'uma trilha institucional'], [/\bCitações\b/g, 'Cotações'],
      [/\bTrabalhando com padrões em MOSCATELLI\b/g, 'Trabalhando com os padrões da MOSCATELLI'],
      [/\bRevisando uma cotação de fornecedor\b/g, 'Como revisar uma cotação de fornecedor'],
      [/\bSolução de problemas de acesso MainHub\b/g, 'Solução de problemas de acesso ao MainHub'],
    ];
    brazilian.forEach(([pattern, replacement]) => { result = result.replace(pattern, replacement); });
  }
  if (locale === 'it') {
    const italian = [
      [/\bproprietario\b/gi, 'responsabile'], [/\bproprietaria\b/gi, 'responsabile'],
      [/\bproprietà\b/gi, 'responsabilità'], [/ · Fondazione\b/g, ' · Fondamenti'],
      [/\brecensiscono\b/gi, 'revisionano'], [/\blavoro dal vivo\b/gi, 'lavoro in corso'],
      [/\bqualsiasi registri finanziario\b/gi, 'qualsiasi registro finanziario'],
      [/\bsospetti registri duplicati\b/gi, 'sospetti record duplicati'],
      [/\bschede numeriche e datarie\b/gi, 'forme numeriche e di data'],
      [/\bApertura con\b/g, 'Apri con'],
      [/\bLa Casa\b/g, 'La Maison'], [/\bCitazioni\b/g, 'Preventivi'],
      [/\bCosti di formazione\b/g, 'Spese di formazione'],
      [/\bMainHub accedi alla risoluzione dei problemi\b/g, 'Risoluzione dei problemi di accesso a MainHub'],
      [/\bUna convention dimostrativa\b/g, 'Una convenzione dimostrativa'],
    ];
    italian.forEach(([pattern, replacement]) => { result = result.replace(pattern, replacement); });
  }
  return result.replace(/\s+([,.;:!?])/g, '$1').trim();
}

async function translate(value, locale) {
  if (!/[A-Za-z]{2}/.test(value) || /^(MOSCATELLI|Atlas|MainHub|Slack|Supabase)$/.test(value)) return value;
  const key = `${locale}\u0000${value}`;
  if (cache[key]) return cache[key];
  const params = new URLSearchParams({ client: 'gtx', sl: 'en', tl: locales[locale], dt: 't', q: protect(value) });
  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
    if (response.ok) break;
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }
  if (!response?.ok) throw new Error(`Translation failed (${response?.status})`);
  const payload = await response.json();
  const translated = polish((payload[0] || []).map((part) => part[0]).join(''), locale);
  cache[key] = translated;
  return translated;
}

async function mapLimit(values, limit, mapper) {
  const result = new Array(values.length); let cursor = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (cursor < values.length) { const index = cursor++; result[index] = await mapper(values[index], index); }
  }));
  return result;
}

function collect(node, parentKey, entries) {
  if (typeof node === 'string') {
    if (scalarKeys.has(parentKey) || arrayKeys.has(parentKey)) entries.add(node);
    return;
  }
  if (Array.isArray(node)) return node.forEach((entry) => collect(entry, parentKey, entries));
  if (node && typeof node === 'object') Object.entries(node).forEach(([key, value]) => collect(value, key, entries));
}

function localize(node, parentKey, translations) {
  if (typeof node === 'string') return (scalarKeys.has(parentKey) || arrayKeys.has(parentKey)) ? (translations.get(node) || node) : node;
  if (Array.isArray(node)) return node.map((entry) => localize(entry, parentKey, translations));
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, localize(value, key, translations)]));
  return node;
}

const files = (await readdir(CONTENT, { recursive: true })).filter((file) => file.endsWith('.json') && !file.startsWith('locales\\') && !file.startsWith('locales/'));
const documents = await Promise.all(files.map(async (file) => [file, JSON.parse(await readFile(new URL(file.replaceAll('\\','/'), CONTENT), 'utf8'))]));
const strings = new Set(); documents.forEach(([, document]) => collect(document, '', strings));

for (const locale of Object.keys(locales)) {
  const values = [...strings];
  console.log(`Translating ${values.length} strings to ${locale}…`);
  const translated = await mapLimit(values, 8, (value, index) => translate(value, locale).then((output) => {
    if ((index + 1) % 50 === 0) console.log(`${locale}: ${index + 1}/${values.length}`);
    return output;
  }));
  const map = new Map(values.map((value, index) => [value, translated[index]]));
  for (const [file, document] of documents) {
    const destination = path.join(new URL(`../content/locales/${locale}/`, import.meta.url).pathname.slice(1), file);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, `${JSON.stringify(localize(document, '', map), null, 2)}\n`, 'utf8');
  }
  await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

console.log(`Localized ${documents.length} documents.`);
