const supabaseClient =
    window.supabase.createClient(
        window.APP_CONFIG.supabaseUrl,
        window.APP_CONFIG.supabaseKey
    );

window.supabaseClient =
    supabaseClient;
