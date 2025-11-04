export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context as { request: Request; env: any };
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const debug = url.searchParams.get("debug") === "1";

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
    if (debug) return htmlResponse(debugHtml({ step: 'state', ok: false, state, cookieState: cookies["oauth_state"] }), 400, true);
    return htmlResponse(errorHtml("Invalid state"), 400, true);
  }

  if (!code) {
    if (debug) return htmlResponse(debugHtml({ step: 'code', ok: false, msg: 'Missing code' }), 400, true);
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

  const data = await tokenRes.json();
  if (!tokenRes.ok || !data.access_token) {
    if (debug) return htmlResponse(debugHtml({ step: 'exchange', ok: false, status: tokenRes.status, data }), 500, true);
    return htmlResponse(errorHtml("Token exchange failed"), 500, true);
  }

  const token = data.access_token as string;
  const body = debug ? debugHtml({ step:'success', ok:true, tokenPrefix: token.slice(0,6), tokenLen: token.length }) : successHtml(token);
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
        document.body.innerText = 'OAuth success. You can close this window.';
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

function debugHtml(info: any) {
  const safe = (o: any) => JSON.stringify(o, null, 2)
    .replace(/[<>&]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;'} as any)[c]);
  return `<!doctype html><meta charset="utf-8" />
<title>OAuth Debug</title>
<body style="font:14px/1.5 ui-sans-serif,system-ui; padding:16px;">
  <h1>OAuth Debug</h1>
  <pre>${safe(info)}</pre>
  <p>이 페이지는 debug=1일 때만 표시됩니다. 정상 플로우에서는 팝업이 자동 닫힙니다.</p>
</body>`;
}
