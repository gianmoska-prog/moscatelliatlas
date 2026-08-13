import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const contentDir = new URL('../content/', import.meta.url);
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const quote = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
const jsonb = (value) => `${quote(JSON.stringify(value ?? {}))}::jsonb`;
const date = (value) => value ? quote(value) : 'null';
const index = await json(new URL('index.json', contentDir));
const updates = (await json(new URL('updates/index.json', contentDir))).updates || [];
const statements = ['begin;'];

index.categories.forEach((category, order) => statements.push(
  `insert into public.atlas_categories (slug,name,short_name,description,topics,sort_order) values (${quote(category.slug)},${quote(category.name)},${quote(category.shortName || category.name)},${quote(category.description || '')},${jsonb(category.topics || [])},${order * 10}) on conflict (slug) do update set name=excluded.name,short_name=excluded.short_name,description=excluded.description,topics=excluded.topics,sort_order=excluded.sort_order,updated_at=now();`
));

const sourceFor = (item) => item.type === 'article' ? `articles/${item.slug}.json` : item.type === 'playbook' ? `playbooks/${item.slug}.json` : `academia/lesson-${item.slug}.json`;
for (const item of index.items.filter((item) => ['article','playbook','academia-lesson'].includes(item.type))) {
  const document = await json(new URL(sourceFor(item), contentDir));
  statements.push(`insert into public.atlas_content (id,slug,content_type,category_slug,title,summary,topic,status,version,audience,permissions,keywords,reading_minutes,metadata,document,is_demo,published_at) values (${quote(item.id)},${quote(item.slug)},${quote(item.type)},${quote(item.category)},${quote(item.title)},${quote(item.summary || '')},${quote(item.topic || '')},${quote(item.status || 'current')},${quote(item.version || '1.0')},${jsonb(item.audience || [])},${jsonb(item.permissions || [])},${jsonb(item.keywords || [])},${Number(item.readingMinutes || 0)},${jsonb(item)},${jsonb(document)},${Boolean(item.demo)},${date(item.publishedDate)}) on conflict (id) do update set slug=excluded.slug,content_type=excluded.content_type,category_slug=excluded.category_slug,title=excluded.title,summary=excluded.summary,topic=excluded.topic,status=excluded.status,version=excluded.version,audience=excluded.audience,permissions=excluded.permissions,keywords=excluded.keywords,reading_minutes=excluded.reading_minutes,metadata=excluded.metadata,document=excluded.document,is_demo=excluded.is_demo,published_at=excluded.published_at,updated_at=now();`);
}
for (const item of updates) {
  statements.push(`insert into public.atlas_content (id,slug,content_type,category_slug,title,summary,topic,status,version,audience,permissions,keywords,reading_minutes,metadata,document,is_demo,published_at) values (${quote(item.id)},${quote(item.slug)},'update',${quote(item.category)},${quote(item.title)},${quote(item.summary || '')},${quote(item.topic || '')},${quote(item.status || 'current')},${quote(item.version || '1.0')},${jsonb(item.audience || [])},${jsonb(item.permissions || [])},${jsonb(item.keywords || [])},${Number(item.readingMinutes || 0)},${jsonb(item)},${jsonb(item)},${Boolean(item.demo)},${date(item.publishedDate)}) on conflict (id) do update set metadata=excluded.metadata,document=excluded.document,title=excluded.title,summary=excluded.summary,status=excluded.status,updated_at=now();`);
}

const academy = await json(new URL('academia/index.json', contentDir));
for (const meta of academy.courses || []) {
  const document = await json(new URL(`academia/course-${meta.slug}.json`, contentDir));
  statements.push(`insert into public.atlas_courses (id,slug,title,area,summary,status,sort_order,audience,document,is_demo) values (${quote(document.id)},${quote(document.slug)},${quote(document.title)},${quote(document.area || '')},${quote(document.summary || '')},${quote(document.status || 'current')},${Number(document.sortOrder || 100)},${jsonb(document.audience || [])},${jsonb(document)},${Boolean(document.demo)}) on conflict (id) do update set title=excluded.title,area=excluded.area,summary=excluded.summary,status=excluded.status,sort_order=excluded.sort_order,audience=excluded.audience,document=excluded.document,is_demo=excluded.is_demo,updated_at=now();`);
}
statements.push('commit;');
await mkdir(new URL('../supabase/', import.meta.url), { recursive: true });
await writeFile(new URL('../supabase/seed.sql', import.meta.url), `${statements.join('\n')}\n`);
console.log(`Generated ${statements.length - 2} Atlas seed statements.`);
