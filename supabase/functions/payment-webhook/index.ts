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
        // 1. Validação do Token de Segurança (Webhook Token)
        // Extraindo do header customizado ou Authorization
        const receivedToken =
            req.headers.get("X-Webhook-Token") || req.headers.get("Authorization");
        const expectedToken = Deno.env.get("WEBHOOK_SECRET_TOKEN");

        console.log("=== INÍCIO REQUEST WEBHOOK ===");
        console.log("Headers Recebidos:");
        for (const [key, value] of req.headers.entries()) {
            console.log(`${key}: ${value}`);
        }

        // Validação estrita se o token estiver configurado no ambiente
        if (expectedToken && receivedToken !== expectedToken) {
            console.error(`Token recebido '${receivedToken}' não corresponde ao esperado. Bloqueando.`);
            return new Response(JSON.stringify({ error: "Unauthorized / Invalid Token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. Extração dinâmica do payload
        let payload;
        try {
            payload = await req.json();
            console.log("Recebido Payload Webhook:", JSON.stringify(payload, null, 2));
        } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON format" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Adaptando-se ao modelo do objeto (buscando em possíveis chaves)
        const email =
            payload.email ||
            payload?.customer?.email ||
            payload?.buyer?.email ||
            payload?.client?.email ||
            findDeep(payload, ["email"]);

        let name =
            payload.name ||
            payload.full_name ||
            payload?.customer?.name ||
            payload?.buyer?.name ||
            findDeep(payload, ["name", "full_name"]);

        if (!name) name = "Usuário Novo (Webhook)";

        let rawDocument =
            payload.document ||
            payload.cpf ||
            payload.cnpj ||
            payload?.customer?.document ||
            payload?.buyer?.document ||
            findDeep(payload, ["document", "cpf", "cnpj"]);

        // Remover caracteres não numéricos do documento (para virar senha e login seguro)
        const documentStr = rawDocument ? String(rawDocument).replace(/\D/g, "") : null;

        if (!email) {
            console.warn("Nenhum email encontrado no payload. Chaves providas:", Object.keys(payload));
            // Retornar 200 de qualquer forma para algumas plataformas de pagamento não ficarem em loop, mas indicando erro interno
            return new Response(JSON.stringify({ message: "Payload ignorado (email ausente)", keys: Object.keys(payload) }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!documentStr) {
            console.warn("Nenhum documento (CPF/CNPJ) encontrado para utilizar como senha temporária. Usando timestamp.");
        }

        // A senha temporária será o documento limpo ou um valor seguro default caso não exista
        const tempPassword = documentStr || `temp_${Date.now()}`;

        // Inicializar Supabase Admin Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const adminClient = createClient(supabaseUrl, serviceRoleKey);

        // 3. Garantir a Idempotência e 4. Criar Usuário com Senha Hash
        // O Supabase lida automaticamente com o hash da senha usando bcrypt/argon internally

        // Tentar criar o usuário
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: email,
            password: tempPassword,
            email_confirm: true, // Auto-confirmar e-mail para esse tipo de payload (ou false se preferir)
            user_metadata: {
                full_name: name,
                temp_password: true, // Marcação exigindo a troca no primeiro login
                document: documentStr, // Guardar o CPF/CNPJ nos metadados
            },
        });

        if (createError) {
            // Garantir Idempotência: Se o usuário já existe, não deve duplicar. 
            // Supabase já impede duplicação de e-mail e retorna erro específico
            const errorStr = createError.message.toLowerCase();
            if (
                errorStr.includes("already registered") ||
                errorStr.includes("already been registered") ||
                errorStr.includes("já está registrado") ||
                errorStr.includes("unique")
            ) {
                console.log(`Evento ignorado por idempotência: usuário ${email} já existe.`);
                return new Response(
                    JSON.stringify({ success: true, message: "Usuário já existe. Evento processado (idempotência)." }),
                    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            console.error("Erro ao criar usuário via webhook:", createError);
            return new Response(JSON.stringify({ error: createError.message }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Atribuir User Role padrão se existir tabela de roles no projeto
        // (Opcional: dependendo de como o projeto gerencia planos, por ex)
        const userId = newUser.user.id;
        await adminClient.from("user_roles").insert({ user_id: userId, role: "OWNER" }).select().single()
            .catch(e => console.log("Role assignment ignorable error or not existing table", e));

        // Também podemos inserir no `profiles` se a trigger demorar ou falhar, mas deixaremos a cargo do projeto base
        await adminClient.from("profiles").upsert({ id: userId, full_name: name, document: documentStr }).select().single()
            .catch(e => console.log("Profile upsert ignorable error", e));

        console.log(`Usuário gerado com sucesso pelo Webhook. ID: ${userId}, Email: ${email}`);

        // 5. Retornar status adequado
        return new Response(
            JSON.stringify({ success: true, user_id: userId }),
            {
                status: 201,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (err: any) {
        console.error("Erro crítico no webhook:", err);
        return new Response(JSON.stringify({
            error: "Erro interno no processamento do webhook",
            details: err?.message || err,
            stack: err?.stack || "No stack trace available"
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
