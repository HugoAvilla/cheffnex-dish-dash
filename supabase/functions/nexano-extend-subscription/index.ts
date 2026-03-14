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
        const nexanoEndpoint = `https://app.nexano.com.br/api/v1/subscriptions/${subscription_id || user.email}/extend`;

        console.log(`Sending extension request to Nexano: ${nexanoEndpoint}`);

        const response = await fetch(nexanoEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-public-key": nexanoPublicKey,
                "x-secret-key": nexanoSecretKey
            },
            body: JSON.stringify({
                email: user.email,
                document: user.user_metadata?.document,
                days: 30, // Extend for 30 days
                discount_percentage: 100 // Ou aplicar cupom 100%
            })
        });

        const nexanoData = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("Nexano Extension Error:", nexanoData);
            return new Response(JSON.stringify({ error: "Failed to extend subscription on Nexano", details: nexanoData }), {
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
