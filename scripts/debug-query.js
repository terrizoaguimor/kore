const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tcuzoubdhmikhypniqtm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdXpvdWJkaG1pa2h5cG5pcXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODEzMTIsImV4cCI6MjA4MDQ1NzMxMn0.38peWSPt_V_yOceiQL09lvsY4Au4mQ4xhXwwUlzsBMQ'

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const anonClient = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
  const userId = 'b07992b9-799c-4059-8ac4-08c246b9a4c1'

  console.log('=== Testing with ADMIN client (bypasses RLS) ===\n')

  // Test 1: Check organization_members table directly
  console.log('1. organization_members for user:')
  const { data: members, error: membersError } = await adminClient
    .from('organization_members')
    .select('*')
    .eq('user_id', userId)

  if (membersError) {
    console.log('   ERROR:', membersError.message)
  } else {
    console.log('   Found:', members?.length || 0, 'memberships')
    console.log('   Data:', JSON.stringify(members, null, 2))
  }

  // Test 2: Check organizations table
  console.log('\n2. organizations table:')
  const { data: orgs, error: orgsError } = await adminClient
    .from('organizations')
    .select('*')

  if (orgsError) {
    console.log('   ERROR:', orgsError.message)
  } else {
    console.log('   Found:', orgs?.length || 0, 'organizations')
    console.log('   Data:', JSON.stringify(orgs, null, 2))
  }

  // Test 3: Check the JOIN query with admin client
  console.log('\n3. JOIN query (admin):')
  const { data: joinAdmin, error: joinAdminError } = await adminClient
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', userId)

  if (joinAdminError) {
    console.log('   ERROR:', joinAdminError.message)
    console.log('   Details:', JSON.stringify(joinAdminError, null, 2))
  } else {
    console.log('   SUCCESS! Data:', JSON.stringify(joinAdmin, null, 2))
  }

  // Test 4: Sign in as user and test
  console.log('\n=== Testing with ANON client (uses RLS) ===\n')

  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: 'terrizoaguimor@gmail.com',
    password: 'Ch@2025$Hub!Secure#1'
  })

  if (signInError) {
    console.log('Sign in ERROR:', signInError.message)
    return
  }

  console.log('4. Signed in successfully as:', signInData.user.id)

  // Test 5: Query organization_members with RLS
  console.log('\n5. organization_members with RLS:')
  const { data: membersRls, error: membersRlsError } = await anonClient
    .from('organization_members')
    .select('*')
    .eq('user_id', userId)

  if (membersRlsError) {
    console.log('   ERROR:', membersRlsError.message)
    console.log('   Details:', JSON.stringify(membersRlsError, null, 2))
  } else {
    console.log('   Found:', membersRls?.length || 0, 'memberships')
    console.log('   Data:', JSON.stringify(membersRls, null, 2))
  }

  // Test 6: Query organizations with RLS
  console.log('\n6. organizations with RLS:')
  const { data: orgsRls, error: orgsRlsError } = await anonClient
    .from('organizations')
    .select('*')

  if (orgsRlsError) {
    console.log('   ERROR:', orgsRlsError.message)
    console.log('   Details:', JSON.stringify(orgsRlsError, null, 2))
  } else {
    console.log('   Found:', orgsRls?.length || 0, 'organizations')
    console.log('   Data:', JSON.stringify(orgsRls, null, 2))
  }

  // Test 7: The problematic JOIN query with RLS
  console.log('\n7. JOIN query with RLS (the problematic one):')
  const { data: joinRls, error: joinRlsError } = await anonClient
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', userId)

  if (joinRlsError) {
    console.log('   ERROR:', joinRlsError.message)
    console.log('   Code:', joinRlsError.code)
    console.log('   Details:', JSON.stringify(joinRlsError, null, 2))
  } else {
    console.log('   SUCCESS! Data:', JSON.stringify(joinRls, null, 2))
  }

  // Test 8: Check what policies exist
  console.log('\n=== Checking RLS policies ===\n')
  const { data: policies, error: policiesError } = await adminClient
    .rpc('get_policies_info')

  if (policiesError) {
    console.log('Could not fetch policies (function may not exist)')
  } else {
    console.log('Policies:', policies)
  }

  console.log('\n=== Done ===')
}

debug().catch(console.error)
