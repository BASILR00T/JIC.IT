// Supabase Configuration
const SUPABASE_URL = 'https://rseukxeqmkhgjiomhumt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXVreGVxbWtoZ2ppb21odW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTMxMjMsImV4cCI6MjA4NTc4OTEyM30.bG56KlNzCzA3UDS0vlLIyepogvdkfvOm7-bPWdQ-CsQ';

// Initialize Supabase Client
// We use a distinct name to avoid conflict with the library factory
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
