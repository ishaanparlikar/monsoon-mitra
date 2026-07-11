// Monsoon Assistant — Fast Auth User Creation
// Run: node supabase/seed-users.mjs
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];
const REF = 'sojpmpkzpxfruuycshnd';
const URL = `https://${REF}.supabase.co/auth/v1/admin/users`;

if (!SERVICE_KEY) {
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=your-key node supabase/seed-users.mjs');
  process.exit(1);
}

const USERS = [
  { id: 'a0000000-0000-0000-0000-000000000001', phone: '+919876543210' },
  { id: 'a0000000-0000-0000-0000-000000000002', phone: '+919876543211' },
  { id: 'a0000000-0000-0000-0000-000000000003', phone: '+919876543212' },
  { id: 'a0000000-0000-0000-0000-000000000004', phone: '+919876543213' },
  { id: 'a0000000-0000-0000-0000-000000000005', phone: '+919876543214' },
  { id: 'a0000000-0000-0000-0000-000000000006', phone: '+919876543215' },
  { id: 'a0000000-0000-0000-0000-000000000007', phone: '+919876543216' },
  { id: 'a0000000-0000-0000-0000-000000000008', phone: '+919876543217' },
  { id: 'a0000000-0000-0000-0000-000000000009', phone: '+919876543218' },
  { id: 'a0000000-0000-0000-0000-000000000010', phone: '+919876543219' },
  { id: 'a0000000-0000-0000-0000-000000000011', phone: '+919876543220' },
];

const HEADERS = {
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'apikey': SERVICE_KEY,
  'Content-Type': 'application/json',
};

async function createUser(user) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ id: user.id, phone: user.phone, phone_confirm: true }),
  });
  return { user, status: res.status, body: await res.json().catch(() => ({})) };
}

console.log('\n🌧️  Creating auth users in parallel...\n');

const results = await Promise.allSettled(USERS.map(createUser));

let created = 0, skipped = 0, failed = 0;
for (const r of results) {
  if (r.status === 'rejected') {
    console.log(`  ❌ Network error: ${r.reason}`);
    failed++;
    continue;
  }
  const { user, status, body } = r.value;
  if (status === 200 || status === 201) {
    console.log(`  ✅ Created  ${user.phone}`);
    created++;
  } else if (status === 422 || body?.message?.includes('already')) {
    console.log(`  ⚠️  Exists   ${user.phone}`);
    skipped++;
  } else {
    console.log(`  ❌ Failed   ${user.phone} (HTTP ${status}) — ${body?.message || JSON.stringify(body)}`);
    failed++;
  }
}

console.log(`\n  Done: ${created} created, ${skipped} already existed, ${failed} failed`);

if (failed > 0) {
  console.log('\n  ❌ Some users failed. Check your service role key and Supabase project.');
  process.exit(1);
}

console.log('\n✅ All auth users ready!');
console.log('👉 Next: paste supabase/seed.sql into Supabase Dashboard → SQL Editor → Run\n');
console.log(`   Link: https://supabase.com/dashboard/project/${REF}/sql/new\n`);
