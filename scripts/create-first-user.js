const { createClient } = require('@supabase/supabase-js')

// Supabase credentials
const supabaseUrl = 'https://tcuzoubdhmikhypniqtm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.log('\nTo get your service role key:')
  console.log('1. Go to https://supabase.com/dashboard/project/tcuzoubdhmikhypniqtm/settings/api')
  console.log('2. Copy the "service_role" key (not the anon key)')
  console.log('3. Run: SUPABASE_SERVICE_ROLE_KEY="your-key" node scripts/create-first-user.js')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createFirstUser() {
  const email = 'terrizoaguimor@gmail.com'
  const password = 'Ch@2025$Hub!Secure#1'

  console.log('Creating first user...')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('')

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log('User already exists in auth, fetching user...')
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === email)
        if (existingUser) {
          console.log('Found existing user:', existingUser.id)
          await setupUserData(existingUser.id, email)
          return
        }
      }
      throw authError
    }

    console.log('Auth user created:', authData.user.id)

    // 2. Set up user data
    await setupUserData(authData.user.id, email)

  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

async function setupUserData(userId, email) {
  try {
    // 1. Create or update user record
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        full_name: 'Mario Gutierrez',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (userError) {
      console.error('Error creating user record:', userError.message)
    } else {
      console.log('User record created/updated')
    }

    // 2. Create default organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'My Organization',
        slug: 'my-org',
        storage_quota: 5368709120, // 5GB
        storage_used: 0,
      })
      .select()
      .single()

    if (orgError) {
      if (orgError.message.includes('duplicate')) {
        console.log('Organization already exists, fetching...')
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select()
          .eq('slug', 'my-org')
          .single()

        if (existingOrg) {
          await createMembership(existingOrg.id, userId)
        }
        return
      }
      throw orgError
    }

    console.log('Organization created:', orgData.name)

    // 3. Create membership
    await createMembership(orgData.id, userId)

  } catch (error) {
    console.error('Error setting up user data:', error.message)
  }
}

async function createMembership(orgId, userId) {
  const { error: memberError } = await supabase
    .from('organization_members')
    .upsert({
      organization_id: orgId,
      user_id: userId,
      role: 'owner',
      joined_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,user_id' })

  if (memberError) {
    console.error('Error creating membership:', memberError.message)
  } else {
    console.log('Membership created (owner role)')
  }

  console.log('')
  console.log('='.repeat(50))
  console.log('First user setup complete!')
  console.log('='.repeat(50))
  console.log('')
  console.log('Login credentials:')
  console.log('  Email:    terrizoaguimor@gmail.com')
  console.log('  Password: Ch@2025$Hub!Secure#1')
  console.log('')
}

createFirstUser()
