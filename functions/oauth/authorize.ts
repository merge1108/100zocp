export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context as { request: Request; env: any };
  const url = new URL(request.url);

  const clientId: string | undefined = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response("Missing GITHUB_CLIENT_ID env", { status: 500 });
  }

  const debug = url.searchParams.get("debug");
  const redirectUri = `${url.origin}/oauth/callback${debug ? "?debug=1" : ""}`;
  const scope = url.searchParams.get("scope") || "repo";

  // CSRF state
  const stateArr = new Uint8Array(16);
  crypto.getRandomValues(stateArr);
  const state = Array.from(stateArr).map((b) => b.toString(16).padStart(2, "0")).join("");

  const gh = new URL("https://github.com/login/oauth/authorize");
  gh.searchParams.set("client_id", clientId);
  gh.searchParams.set("redirect_uri", redirectUri);
  gh.searchParams.set("scope", scope);
  gh.searchParams.set("state", state);
  gh.searchParams.set("allow_signup", "true");

  const headers = new Headers({ Location: gh.toString() });
  headers.append(
    "Set-Cookie",
    `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`
  );
  return new Response(null, { status: 302, headers });
};
