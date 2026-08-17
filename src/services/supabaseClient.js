import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whdpoxpgjguqlxkepcop.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZHBveHBnamd1cWx4a2VwY29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI3MzQsImV4cCI6MjA5MzEyODczNH0.C0EtDu28kBf4EpF9pO0rf54wEMBIXRUHl58zAdAvEdo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);