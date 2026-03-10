import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-webhook-token",
};

/**
 * Função utilitária para buscar um campo em um objeto aninhado.
 * Útil para adaptar ao payload dinâmico.
 */
function findDeep(obj: any, keys: string[]): any {
    if (!obj || typeof obj !== "object") return null;
    for (const key of keys) {
        if (obj[key]) return obj[key];
    }
    for (const k in obj) {
        if (typeof obj[k] === "object") {
            const found = findDeep(obj[k], keys);
            if (found) return found;
        }
    }
    return null;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log("=== INÍCIO REQUEST WEBHOOK PAGAMENTO RECUSADO ===");

        // 1. Extração do payload primeiro para podermos ler o token do body
        let payload: any = {};
        try {
            payload = await req.json();
            console.log("Recebido Payload Webhook Pagamento Recusado:", JSON.stringify(payload, null, 2));
        } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON format" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // URL parsing for query params
        const url = new URL(req.url);

        // 2. Validação do Token de Segurança (Webhook Token)
        // Verificamos em 3 lugares: Headers, Query Params (URL) e Body Payload
        const receivedToken =
            req.headers.get("token") ||
            req.headers.get("X-Webhook-Token") ||
            req.headers.get("Authorization") ||
            url.searchParams.get("token") ||
            url.searchParams.get("secret") ||
            payload?.token ||
            payload?.webhook_token ||
            payload?.secret;

        const expectedToken = Deno.env.get("WEBHOOK_DECLINED_SECRET_TOKEN");

        if (expectedToken && receivedToken !== expectedToken) {
            console.error(`Token recebido '${receivedToken}' não corresponde ao esperado. Bloqueando.`);

            // Debug de headers para ajudar caso ainda falhe
            const headerDebug: Record<string, string> = {};
            for (const [key, value] of req.headers.entries()) {
                headerDebug[key] = value;
            }

            return new Response(JSON.stringify({
                error: "Unauthorized / Invalid Token",
                received_token: receivedToken || "none",
                debug_hint: "Verifique se o token é enviado no header, URL param ou no JSON",
                received_headers: headerDebug
            }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const email =
            payload.email ||
            payload?.customer?.email ||
            payload?.buyer?.email ||
            payload?.client?.email ||
            findDeep(payload, ["email"]);

        let rawDocument =
            payload.document ||
            payload.cpf ||
            payload.cnpj ||
            payload?.customer?.document ||
            payload?.buyer?.document ||
            findDeep(payload, ["document", "cpf", "cnpj"]);

        const documentStr = rawDocument ? String(rawDocument).replace(/\D/g, "") : null;

        if (!email && !documentStr) {
            console.warn("Nenhum email ou documento encontrado no payload. Chaves providas:", Object.keys(payload));
            return new Response(JSON.stringify({ message: "Payload ignorado (email e documento ausentes)", keys: Object.keys(payload) }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Inicializar Supabase Admin Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const adminClient = createClient(supabaseUrl, serviceRoleKey);

        // 3. Buscar usuário existente usando a RPC public.get_user_id_by_email_or_document
        const { data: userId, error: rpcError } = await adminClient.rpc('get_user_id_by_email_or_document', {
            p_email: email,
            p_document: documentStr
        });

        if (rpcError) {
            console.error("Erro ao executar RPC de busca de usuário:", rpcError);
            return new Response(JSON.stringify({ error: rpcError.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!userId) {
            // Regra: Nenhum novo usuário deve ser criado a partir de eventos de compra recusada.
            // Apenas registra e retorna sucesso para evitar retries do provider
            console.log(`Evento ignorado: Usuário com email '${email}' e documento '${documentStr}' não encontrado no sistema.`);
            return new Response(JSON.stringify({ success: true, message: "Usuário não encontrado. Evento registrado (ignorando retries)." }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`Usuário encontrado para bloqueio. ID: ${userId}`);

        // 4. Marcar o usuário como pagamento atrasado (Sem bloquear acesso imediatamente)
        // Buscamos o metadata atual para alterá-lo e aplicar a idempotência
        const { data: userCurrentData, error: getUserError } = await adminClient.auth.admin.getUserById(userId);

        if (getUserError || !userCurrentData?.user) {
            console.error("Erro ao resgatar detalhes do usuário para marcação:", getUserError);
            return new Response(JSON.stringify({ error: getUserError?.message || "User not found by id" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const currentMetadata = userCurrentData.user.user_metadata || {};

        if (currentMetadata.status === "payment_declined" || currentMetadata.status === "blocked") {
            console.log(`Evento ignorado por idempotência: O usuário ${userId} já está marcado como pendente ou bloqueado.`);
            return new Response(JSON.stringify({ success: true, message: "Usuário já estava pendente (Idempotência)." }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const newMetadata = {
            ...currentMetadata,
            status: "payment_declined",
            payment_declined_at: new Date().toISOString()
        };

        // Atualizamos apenas o metadata. Removemos o ban_duration para não derrubar o acesso do usuário
        const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: newMetadata,
            // ban_duration: null // Opcional, caso queira garantir o desbanimento
        });

        if (updateError) {
            console.error("Erro ao atualizar perfil do usuário com marcação de pagamento atrasado:", updateError);
            return new Response(JSON.stringify({ error: updateError.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`Usuário ${userId} (${email}) marcado como 'payment_declined' com sucesso.`);

        // 5. Retornar status 200 em caso de sucesso
        return new Response(
            JSON.stringify({ success: true, message: "Usuário alertado de pagamento recusado com sucesso.", user_id: userId }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (err: any) {
        console.error("Erro crítico no processamento de pagamento recusado:", err);
        return new Response(JSON.stringify({
            error: "Erro interno no processamento do webhook",
            details: err?.message || err,
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
