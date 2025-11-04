export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context as { request: Request; env: any };
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const clientId: string | undefined = env.GITHUB_CLIENT_ID;
  const clientSecret: string | undefined = env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response("Missing GitHub OAuth env", { status: 500 });
  }

  // Verify state (best-effort)
  const cookies = Object.fromEntries(
    (request.headers.get("Cookie") || "")
      .split(/;\s*/)
      .filter(Boolean)
      .map((s) => {
        const i = s.indexOf("=");
        return [decodeURIComponent(s.substring(0, i)), decodeURIComponent(s.substring(i + 1))];
      })
  );
  if (!state || !cookies["oauth_state"] || cookies["oauth_state"] !== state) {
    return htmlResponse(errorHtml("Invalid state"), 400, true);
  }

  if (!code) {
    return htmlResponse(errorHtml("Missing code"), 400, true);
  }

  // Exchange code for token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${url.origin}/oauth/callback`,
      state,
    }),
  });

  const data = await tokenRes.json<any>();
  if (!tokenRes.ok || !data.access_token) {
    return htmlResponse(errorHtml("Token exchange failed"), 500, true);
  }

  const token = data.access_token as string;
  const body = successHtml(token);
  // Clear state cookie
  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
  headers.append(
    "Set-Cookie",
    "oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure"
  );
  return new Response(body, { status: 200, headers });
};

function htmlResponse(html: string, status = 200, noCache = false): Response {
  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8" });
  if (noCache) headers.set("Cache-Control", "no-store");
  return new Response(html, { status, headers });
}

function successHtml(token: string) {
  // Decap CMS expects postMessage: 'authorization:github:success:' + JSON.stringify({ token })
  return `<!doctype html><meta charset="utf-8" />
<title>OAuth Success</title>
<script>
  (function(){
    try {
      var data = JSON.stringify({ token: ${JSON.stringify(token)} });
      if (window.opener) {
        window.opener.postMessage('authorization:github:success:' + data, '*');
        window.close();
      } else {
        document.body.innerText = 'Token: ' + ${JSON.stringify(token)};
      }
    } catch (e) {
      if (window.opener) {
        window.opener.postMessage('authorization:github:error:' + JSON.stringify(e && e.message || 'error'), '*');
      }
      document.body.innerText = 'OAuth error';
    }
  })();
</script>`;
}

function errorHtml(msg: string) {
  return `<!doctype html><meta charset="utf-8" />
<title>OAuth Error</title>
<script>
  (function(){
    if (window.opener) {
      window.opener.postMessage('authorization:github:error:' + ${JSON.stringify(msg)}, '*');
      window.close();
    } else {
      document.body.innerText = 'OAuth error: ' + ${JSON.stringify(msg)};
    }
  })();
</script>`;
}

