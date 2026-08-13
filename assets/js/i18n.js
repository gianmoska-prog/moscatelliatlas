const STORAGE_KEY = 'moscatelli.atlas.locale.v1';
export const SUPPORTED_LOCALES = Object.freeze(['en', 'it', 'pt-BR']);
export const MAINHUB_LOCALES = Object.freeze(['en', 'pt-BR']);
const labels = Object.freeze({ en: 'English', it: 'Italiano', 'pt-BR': 'Português (Brasil)' });

const it = {
  'Private institutional reference':'Riferimento istituzionale riservato','Welcome back.':'Bentornato.','Sign in to enter MOSCATELLI Atlas.':'Accedi a MOSCATELLI Atlas.','Email':'Email','Password':'Password','Sign in':'Accedi','Alternative sign-in options':'Opzioni di accesso alternative','Use email code':'Usa il codice via email','Forgot password?':'Password dimenticata?','Send email code':'Invia il codice via email','Six-digit code':'Codice a sei cifre','Use password instead':'Usa la password','New password':'Nuova password','Confirm new password':'Conferma la nuova password','Update password':'Aggiorna password','Send reset email':'Invia email di reimpostazione','Return to sign in':'Torna all’accesso','Protected by MOSCATELLI Supabase authentication and database-level Row Level Security.':'Protetto dall’autenticazione Supabase di MOSCATELLI e dalla sicurezza Row Level Security a livello database.','Skip to content':'Vai al contenuto','Browse':'Esplora','What are you looking for?':'Che cosa stai cercando?','Search Atlas':'Cerca in Atlas','Search knowledge, standards and procedures':'Cerca conoscenze, standard e procedure','Close menu':'Chiudi menu','Primary Atlas navigation':'Navigazione principale di Atlas','Home':'Home','Library':'Biblioteca','Playbooks':'Playbook','Academia':'Academia','Updates':'Aggiornamenti','Manual research':'Ricerca manuale','Browse the Library by subject.':'Esplora la Biblioteca per argomento.','Library categories':'Categorie della Biblioteca','The House':'La Maison','Brand':'Brand','Products & Quality':'Prodotti e qualità','Operations':'Operazioni','Suppliers':'Fornitori','Finance & Administration':'Finanza e amministrazione','People':'Persone','Systems':'Sistemi','Personal':'Personale','Bookmarks':'Preferiti','Continue reading':'Continua a leggere','Reading history':'Cronologia di lettura','Profile':'Profilo','Sign out':'Esci','Return to MainHub':'Torna a MainHub','Integration later':'Integrazione successiva','Knowledge, standards and practice.':'Conoscenze, standard e pratica.','Search':'Cerca','Close search':'Chiudi ricerca','Search references, playbooks and Academia lessons.':'Cerca riferimenti, playbook e lezioni di Academia.','Esc to close':'Esc per chiudere','Open full search':'Apri la ricerca completa','Reload':'Ricarica','Dismiss notification':'Ignora notifica','Language':'Lingua','English':'Inglese','Italiano':'Italiano','Português (Brasil)':'Português (Brasil)','All':'Tutti','Important':'Importanti','Required reading':'Letture obbligatorie','New':'Novità','Demonstration knowledge':'Contenuti dimostrativi','What changed':'Che cosa è cambiato','Acknowledge reading':'Conferma la presa visione','Acknowledged':'Presa visione confermata','Notify Slack':'Notifica su Slack','Browse Atlas.':'Esplora Atlas.','Search Atlas.':'Cerca in Atlas.','Preparing learning paths…':'Preparazione dei percorsi formativi…','Preparing situational guidance…':'Preparazione delle guide operative…','Save':'Salva','Saved':'Salvato','Share':'Condividi','Copy link':'Copia link','Copied':'Copiato','Contents':'Indice','Related references':'Riferimenti correlati','Related procedures':'Procedure correlate','Reading time':'Tempo di lettura','minutes':'minuti','Lesson':'Lezione','Reference':'Riferimento','Update':'Aggiornamento','Playbook':'Playbook','No results found.':'Nessun risultato.','Try a broader term or browse the Library by subject.':'Prova un termine più ampio o esplora la Biblioteca per argomento.'
};
const pt = {
  'Private institutional reference':'Referência institucional privada','Welcome back.':'Boas-vindas.','Sign in to enter MOSCATELLI Atlas.':'Entre no MOSCATELLI Atlas.','Email':'E-mail','Password':'Senha','Sign in':'Entrar','Alternative sign-in options':'Opções alternativas de acesso','Use email code':'Usar código por e-mail','Forgot password?':'Esqueceu a senha?','Send email code':'Enviar código por e-mail','Six-digit code':'Código de seis dígitos','Use password instead':'Usar a senha','New password':'Nova senha','Confirm new password':'Confirmar nova senha','Update password':'Atualizar senha','Send reset email':'Enviar e-mail de redefinição','Return to sign in':'Voltar ao acesso','Protected by MOSCATELLI Supabase authentication and database-level Row Level Security.':'Protegido pela autenticação Supabase da MOSCATELLI e por Row Level Security no banco de dados.','Skip to content':'Ir para o conteúdo','Browse':'Explorar','What are you looking for?':'O que você está procurando?','Search Atlas':'Pesquisar no Atlas','Search knowledge, standards and procedures':'Pesquise conhecimentos, padrões e procedimentos','Close menu':'Fechar menu','Primary Atlas navigation':'Navegação principal do Atlas','Home':'Início','Library':'Biblioteca','Playbooks':'Playbooks','Academia':'Academia','Updates':'Atualizações','Manual research':'Pesquisa manual','Browse the Library by subject.':'Explore a Biblioteca por assunto.','Library categories':'Categorias da Biblioteca','The House':'A Maison','Brand':'Marca','Products & Quality':'Produtos e qualidade','Operations':'Operações','Suppliers':'Fornecedores','Finance & Administration':'Finanças e administração','People':'Pessoas','Systems':'Sistemas','Personal':'Pessoal','Bookmarks':'Favoritos','Continue reading':'Continuar lendo','Reading history':'Histórico de leitura','Profile':'Perfil','Sign out':'Sair','Return to MainHub':'Voltar ao MainHub','Integration later':'Integração posterior','Knowledge, standards and practice.':'Conhecimento, padrões e prática.','Search':'Pesquisar','Close search':'Fechar pesquisa','Search references, playbooks and Academia lessons.':'Pesquise referências, playbooks e aulas da Academia.','Esc to close':'Esc para fechar','Open full search':'Abrir pesquisa completa','Reload':'Recarregar','Dismiss notification':'Dispensar notificação','Language':'Idioma','English':'English','Italiano':'Italiano','Português (Brasil)':'Português (Brasil)','All':'Todos','Important':'Importantes','Required reading':'Leitura obrigatória','New':'Novidades','Demonstration knowledge':'Conteúdo demonstrativo','What changed':'O que mudou','Acknowledge reading':'Confirmar leitura','Acknowledged':'Leitura confirmada','Notify Slack':'Notificar no Slack','Browse Atlas.':'Explore o Atlas.','Search Atlas.':'Pesquise no Atlas.','Preparing learning paths…':'Preparando trilhas de aprendizagem…','Preparing situational guidance…':'Preparando orientações operacionais…','Save':'Salvar','Saved':'Salvo','Share':'Compartilhar','Copy link':'Copiar link','Copied':'Copiado','Contents':'Conteúdo','Related references':'Referências relacionadas','Related procedures':'Procedimentos relacionados','Reading time':'Tempo de leitura','minutes':'minutos','Lesson':'Aula','Reference':'Referência','Update':'Atualização','Playbook':'Playbook','No results found.':'Nenhum resultado encontrado.','Try a broader term or browse the Library by subject.':'Tente um termo mais amplo ou explore a Biblioteca por assunto.'
};
Object.assign(it, {
  'Use an email code.':'Usa un codice via email.','Request a one-time sign-in link or code from the connected authentication provider.':'Richiedi al provider di autenticazione collegato un link o un codice di accesso monouso.','Reset your password.':'Reimposta la password.','Request the secure password-reset flow for your Atlas account.':'Avvia la procedura sicura di reimpostazione della password per il tuo account Atlas.','Choose a new password.':'Scegli una nuova password.','Use at least 12 characters and a password unique to MOSCATELLI.':'Usa almeno 12 caratteri e una password riservata a MOSCATELLI.','Enter both your email address and password.':'Inserisci indirizzo email e password.','Signing in…':'Accesso in corso…','Access confirmed.':'Accesso confermato.','Atlas could not sign in.':'Impossibile accedere ad Atlas.','Enter your email address.':'Inserisci il tuo indirizzo email.','Verifying email code…':'Verifica del codice in corso…','Requesting email access…':'Richiesta di accesso via email…','Enter the six-digit email code.':'Inserisci il codice a sei cifre ricevuto via email.','Verify email code':'Verifica il codice','Check your email, then enter the six-digit code or use the secure link.':'Controlla l’email, quindi inserisci il codice a sei cifre oppure usa il link sicuro.','Use at least 12 characters for the new password.':'Usa almeno 12 caratteri per la nuova password.','The password confirmation does not match.':'Le password non coincidono.','Updating password…':'Aggiornamento della password…','Password updated. Opening Atlas…':'Password aggiornata. Apertura di Atlas…','Preparing password reset…':'Preparazione della reimpostazione…','Check your email for the secure password-reset message.':'Controlla l’email per il messaggio sicuro di reimpostazione della password.','Checking your session…':'Verifica della sessione…','Atlas is offline. The application shell remains available; private knowledge is not cached by default.':'Atlas è offline. L’applicazione resta disponibile; per impostazione predefinita i contenuti riservati non vengono memorizzati nella cache.','Connection restored. Atlas can load current knowledge again.':'Connessione ripristinata. Atlas può caricare nuovamente i contenuti aggiornati.','A newer Atlas shell is ready.':'È disponibile una nuova versione di Atlas.'
});
Object.assign(pt, {
  'Use an email code.':'Use um código por e-mail.','Request a one-time sign-in link or code from the connected authentication provider.':'Solicite ao provedor de autenticação conectado um link ou código de acesso de uso único.','Reset your password.':'Redefina sua senha.','Request the secure password-reset flow for your Atlas account.':'Inicie o processo seguro de redefinição de senha da sua conta Atlas.','Choose a new password.':'Escolha uma nova senha.','Use at least 12 characters and a password unique to MOSCATELLI.':'Use pelo menos 12 caracteres e uma senha exclusiva para a MOSCATELLI.','Enter both your email address and password.':'Digite seu e-mail e sua senha.','Signing in…':'Entrando…','Access confirmed.':'Acesso confirmado.','Atlas could not sign in.':'Não foi possível entrar no Atlas.','Enter your email address.':'Digite seu e-mail.','Verifying email code…':'Verificando o código…','Requesting email access…':'Solicitando acesso por e-mail…','Enter the six-digit email code.':'Digite o código de seis dígitos recebido por e-mail.','Verify email code':'Verificar código','Check your email, then enter the six-digit code or use the secure link.':'Confira seu e-mail e digite o código de seis dígitos ou use o link seguro.','Use at least 12 characters for the new password.':'Use pelo menos 12 caracteres na nova senha.','The password confirmation does not match.':'As senhas não coincidem.','Updating password…':'Atualizando a senha…','Password updated. Opening Atlas…':'Senha atualizada. Abrindo o Atlas…','Preparing password reset…':'Preparando a redefinição da senha…','Check your email for the secure password-reset message.':'Confira seu e-mail para acessar a mensagem segura de redefinição de senha.','Checking your session…':'Verificando sua sessão…','Atlas is offline. The application shell remains available; private knowledge is not cached by default.':'O Atlas está offline. A estrutura do aplicativo continua disponível; por padrão, o conteúdo privado não é armazenado em cache.','Connection restored. Atlas can load current knowledge again.':'Conexão restabelecida. O Atlas pode carregar novamente o conteúdo atualizado.','A newer Atlas shell is ready.':'Uma nova versão do Atlas está disponível.'
});
Object.assign(it, {
  'Knowledge organised for deliberate manual research — by subject, standard and procedure.':'Conoscenze organizzate per una ricerca intenzionale: per argomento, standard e procedura.',
  'Library subjects':'Argomenti della Biblioteca','Filter the current Library view':'Filtra la vista corrente della Biblioteca',
  'Development preview.':'Anteprima di sviluppo.','These entries are demonstration content used to validate Atlas and are not final MOSCATELLI policy.':'Questi contenuti dimostrativi servono a convalidare Atlas e non costituiscono una policy MOSCATELLI definitiva.',
  'Subject information':'Informazioni sull’argomento','Use the subject strip or the Browse menu to narrow the institutional reference by area.':'Usa la barra degli argomenti o il menu Esplora per restringere il riferimento istituzionale per area.',
  'subjects':'argomenti','demo references':'riferimenti dimostrativi','All subjects':'Tutti gli argomenti','Under review':'In revisione','Demo':'Dimostrazione','Current':'Corrente','Filter':'Filtra'
});
Object.assign(pt, {
  'Knowledge organised for deliberate manual research — by subject, standard and procedure.':'Conhecimento organizado para pesquisa intencional: por assunto, padrão e procedimento.',
  'Library subjects':'Assuntos da Biblioteca','Filter the current Library view':'Filtrar a visualização atual da Biblioteca',
  'Development preview.':'Ambiente de demonstração.','These entries are demonstration content used to validate Atlas and are not final MOSCATELLI policy.':'Estes conteúdos demonstrativos servem para validar o Atlas e não constituem uma política final da MOSCATELLI.',
  'Subject information':'Informações sobre o assunto','Use the subject strip or the Browse menu to narrow the institutional reference by area.':'Use a faixa de assuntos ou o menu Explorar para restringir a referência institucional por área.',
  'subjects':'assuntos','demo references':'referências demonstrativas','All subjects':'Todos os assuntos','Under review':'Em revisão','Demo':'Demonstração','Current':'Atual','Filter':'Filtrar'
});
Object.assign(it, { 'reference':'riferimento','references':'riferimenti','result':'risultato','results':'risultati' });
Object.assign(pt, { 'reference':'referência','references':'referências','result':'resultado','results':'resultados' });
Object.assign(it, { 'Mobile Atlas navigation':'Navigazione mobile di Atlas','Filter this view':'Filtra questa vista' });
Object.assign(pt, { 'Mobile Atlas navigation':'Navegação móvel do Atlas','Filter this view':'Filtrar esta visualização' });
const dictionaries = Object.freeze({ en: Object.freeze({}), it: Object.freeze(it), 'pt-BR': Object.freeze(pt) });

function savedLocale() {
  try { const value = localStorage.getItem(STORAGE_KEY); if (SUPPORTED_LOCALES.includes(value)) return value; } catch {}
  return 'en';
}

export function linkedLocale(search = '') {
  try {
    const value = new URLSearchParams(search).get('lang');
    return MAINHUB_LOCALES.includes(value) ? value : null;
  } catch { return null; }
}

function initialLocale() {
  const linked = linkedLocale(globalThis.location?.search || '');
  if (!linked) return savedLocale();
  try { localStorage.setItem(STORAGE_KEY, linked); } catch {}
  return linked;
}

export function localeURL(next, href) {
  const url = new URL(href);
  if (MAINHUB_LOCALES.includes(next)) url.searchParams.set('lang', next);
  else url.searchParams.delete('lang');
  return url.toString();
}

let locale = initialLocale();
export function getLocale() { return locale; }
export function getLocaleLabel(value = locale) { return labels[value] || labels.en; }
export function t(value) {
  const exact = dictionaries[locale]?.[value];
  if (exact) return exact;
  const count = String(value).match(/^(\d+) (references?|results?)$/);
  if (count && locale === 'it') return `${count[1]} ${count[2].startsWith('reference') ? 'riferimenti' : 'risultati'}`;
  if (count && locale === 'pt-BR') return `${count[1]} ${count[2].startsWith('reference') ? 'referências' : 'resultados'}`;
  return value;
}

function translateTextNode(node) {
  const value = node.nodeValue; const trimmed = value?.trim();
  if (!trimmed) return;
  const translated = t(trimmed);
  if (translated !== trimmed) node.nodeValue = value.replace(trimmed, translated);
}

export function translateDOM(root = document) {
  if (locale === 'en') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(node) {
    return node.parentElement?.closest('script,style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
  }});
  while (walker.nextNode()) translateTextNode(walker.currentNode);
  const elements = [
    ...(root.matches?.('[placeholder],[aria-label],[title]') ? [root] : []),
    ...(root.querySelectorAll?.('[placeholder],[aria-label],[title]') || [])
  ];
  elements.forEach((element) => {
    for (const attribute of ['placeholder','aria-label','title']) {
      const value = element.getAttribute(attribute); if (value) element.setAttribute(attribute, t(value));
    }
  });
}

export function setLocale(next) {
  if (!SUPPORTED_LOCALES.includes(next) || next === locale) return;
  try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  window.location.replace(localeURL(next, window.location.href));
}

export function initI18n() {
  document.documentElement.lang = locale;
  document.documentElement.dataset.locale = locale;
  document.querySelectorAll('[data-language-select]').forEach((select) => {
    select.value = locale;
    select.setAttribute('aria-label', t('Language'));
    select.addEventListener('change', () => setLocale(select.value));
  });
  translateDOM(document);
  if (locale !== 'en') new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
    else if (node.nodeType === Node.ELEMENT_NODE) translateDOM(node);
  }))).observe(document.body, { childList: true, subtree: true });
}
