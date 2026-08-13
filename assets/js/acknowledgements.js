import { getSupabaseClient } from './auth-adapter.js';

let acknowledgements = [];

export async function hydrateAcknowledgements() {
  const client = getSupabaseClient();
  if (!client) return;
  const { data, error } = await client.from('atlas_acknowledgements').select('version,atlas_content!inner(slug)');
  if (error) throw error;
  acknowledgements = (data || []).map((row) => row.atlas_content.slug);
}

export function getAcknowledgements() { return [...acknowledgements]; }

export async function setAcknowledgement(slug, version, acknowledged) {
  const client = getSupabaseClient();
  const { data: content, error: lookupError } = await client.from('atlas_content').select('id').eq('content_type','update').eq('slug',slug).single();
  if (lookupError) throw lookupError;
  const operation = acknowledged
    ? client.from('atlas_acknowledgements').upsert({ content_id: content.id, version })
    : client.from('atlas_acknowledgements').delete().eq('content_id', content.id).eq('version', version);
  const { error } = await operation;
  if (error) throw error;
  acknowledgements = acknowledged ? [...new Set([...acknowledgements, slug])] : acknowledgements.filter((item) => item !== slug);
}
