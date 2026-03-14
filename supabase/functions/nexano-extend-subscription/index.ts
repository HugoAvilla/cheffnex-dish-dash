import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { subscription_id } = payload;

        // 1. Validação de Usuário
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing Authorization header");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            throw new Error("Unauthorized");
        }

        const userId = user.id;

        // 2. Preparar chaves Nexano
        const nexanoPublicKey = Deno.env.get("NEXANO_PUBLIC_KEY");
        const nexanoSecretKey = Deno.env.get("NEXANO_SECRET_KEY");

        if (!nexanoPublicKey || !nexanoSecretKey) {
            throw new Error("Nexano credentials not configured in Edge Function");
        }

        // 3. Chamada para a API da Nexano
        // Ajustado para não passar email na URL para evitar erro 400 de rota REST malformada
        const nexanoEndpoint = `https://api.nexano.com.br/v1/subscriptions/extend`;

        console.log(`Sending extension request to Nexano for email: ${user.email}`);

        const response = await fetch(nexanoEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${nexanoSecretKey}`,
                "x-public-key": nexanoPublicKey,
                "x-secret-key": nexanoSecretKey
            },
            body: JSON.stringify({
                email: user.email,
                days: 30, // Extend for 30 days
                discount_percentage: 100,
                // Fallbacks just in case the gateway expects 'customer_email' or 'document'
                customer_email: user.email,
                document: user.user_metadata?.document || ""
            })
        });

        const nexanoData = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("Nexano Extension Fetch Error HTTP Status:", response.status, nexanoData);
            // We do not throw here so we can still attempt to fulfill the local DB logic if this is a sandbox failure
            return new Response(JSON.stringify({ error: "Nexano API responded with error", details: nexanoData }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 4. Se a API da Nexano retornar sucesso (200 OK), marcamos no DB local
        const { error: dbError } = await supabaseClient
            .from("pesquisa_diagnostico_clientes")
            .update({ bonus_resgatado: true })
            .eq("user_id", userId);

        if (dbError) {
            console.error("Error setting bonus_resgatado in DB:", dbError);
        }

        return new Response(JSON.stringify({
            success: true,
            message: "Bonus resgatado e assinatura estendida com sucesso",
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Function error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
