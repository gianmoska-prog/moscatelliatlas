import { getSupabaseClient } from '../auth-adapter.js';

const capabilities = Object.freeze([
  'profiles.read','content.read','search.query','bookmarks.readWrite',
  'progress.readWrite','acknowledgements.readWrite','updates.read','audit.append',
]);

function client() {
  const value = getSupabaseClient();
  if (!value) throw new Error('Supabase is not connected.');
  return value;
}

async function rows(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export const supabaseDescriptor = Object.freeze({
  name: 'supabase', kind: 'data', enabled: true, implemented: true,
  serverBoundary: false, capabilities,
});

export const supabaseAdapter = Object.freeze({
  ...supabaseDescriptor,
  async getProfile() {
    const { data: auth } = await client().auth.getUser();
    return rows(client().from('profiles').select('id,email,display_name,role,division,grammatical_gender,is_active').eq('id',auth.user.id).single());
  },
  listCategories: () => rows(client().from('atlas_categories').select('*').order('sort_order')),
  listArticles: ({ category = null } = {}) => rows((category ? client().from('atlas_content').select('*').eq('content_type','article').eq('category_slug',category) : client().from('atlas_content').select('*').eq('content_type','article'))),
  getArticle: ({ slug }) => rows(client().from('atlas_content').select('*').eq('content_type','article').eq('slug',slug).single()),
  listPlaybooks: () => rows(client().from('atlas_content').select('*').eq('content_type','playbook')),
  getPlaybook: ({ slug }) => rows(client().from('atlas_content').select('*').eq('content_type','playbook').eq('slug',slug).single()),
  listCourses: () => rows(client().from('atlas_courses').select('*').order('sort_order')),
  getCourse: ({ slug }) => rows(client().from('atlas_courses').select('*').eq('slug',slug).single()),
  getLesson: ({ slug }) => rows(client().from('atlas_content').select('*').eq('content_type','academia-lesson').eq('slug',slug).single()),
  listUpdates: () => rows(client().from('atlas_content').select('*').eq('content_type','update')),
  search: ({ query, limit = 20 }) => rows(client().rpc('atlas_search',{search_query:query,result_limit:limit})),
});
