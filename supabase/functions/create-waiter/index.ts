import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is ADMIN
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminId = claimsData.claims.sub;

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is ADMIN
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: adminId,
      _role: "ADMIN",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem criar garçons" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin's restaurant_id
    const { data: restaurantId } = await adminClient.rpc("get_user_restaurant_id", {
      _user_id: adminId,
    });

    if (!restaurantId) {
      return new Response(JSON.stringify({ error: "Restaurante não encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get restaurant plan
    const { data: restaurant } = await adminClient
      .from("restaurants")
      .select("plan_id")
      .eq("id", restaurantId)
      .single();

    let maxWaiters = 2; // default
    if (restaurant?.plan_id) {
      const { data: plan } = await adminClient
        .from("plans")
        .select("max_waiters")
        .eq("id", restaurant.plan_id)
        .single();
      if (plan) maxWaiters = plan.max_waiters;
    }

    // Count current waiters
    const { data: currentCount } = await adminClient.rpc("count_restaurant_waiters", {
      _restaurant_id: restaurantId,
    });

    if ((currentCount || 0) >= maxWaiters) {
      return new Response(
        JSON.stringify({
          error: `Limite de garçons atingido (${currentCount}/${maxWaiters}). Faça upgrade do plano.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "Email, senha e nome são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user in auth
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;

    // Update profile with restaurant_id and full_name
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ restaurant_id: restaurantId, full_name })
      .eq("id", userId);

    if (profileError) {
      // If profile doesn't exist yet (trigger may not have fired), insert it
      await adminClient.from("profiles").upsert({
        id: userId,
        restaurant_id: restaurantId,
        full_name,
      });
    }

    // Insert STAFF role
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role: "STAFF" });

    if (roleError) {
      // Rollback: delete created user
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Erro ao atribuir role de garçon" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        waiter: { id: userId, email, full_name },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
