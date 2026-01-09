// @ts-expect-error
import keyManifest from "./key-manifest.json";

function wrapResponse(response: Response): Response {
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
}

function wrapTextResponse(message: String, status: number): Response {
    return wrapResponse(new Response(
        `
<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; font-family: sans-serif;">
  <div style="width: 100%; max-width: 600px;">
    <p>${message}</p>
    <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;">
    <p style="color: #666; font-size: 0.9em;">
      Powered by <a href="https://github.com/LamGC/gpg-wkd-worker" style="color: #0066cc; text-decoration: none;">gpg-wkd-worker</a>
    </p>
  </div>
</div>
        `, 
        {
            status,
            headers: {
                'Content-Type': 'text/html;charset=UTF-8'
            }
        }
    ));
}

export default {
    async fetch(request, env, ctx): Promise<Response> {
        const reqUrl = new URL(request.url);
        const isAdvancedMode = reqUrl.hostname.startsWith("openpgpkey.");

        const parts = reqUrl.pathname.split('/').filter(Boolean);
        if (parts[0] !== '.well-known' || parts[1] !== 'openpgpkey') {
            return wrapTextResponse("I'm a WKD server! This is not the key you're looking for.", 404);
        }

        const requestType = isAdvancedMode ? parts[3] : parts[2];
        if (requestType?.toLowerCase() === "policy") {
            // Keep empty content.
            return wrapResponse(new Response("", {
                status: 200,
            }));
        } else if (requestType !== "hu") {
            return wrapTextResponse("Not found.", 404);
        }
        
        // Direct Mode: /.well-known/openpgpkey/(hu|policy)/{wkdHash}
        // Advanced Mode: /.well-known/openpgpkey/{domain}/(hu|policy)/{wkdHash}
        const domain = isAdvancedMode ? parts[2] : reqUrl.hostname;
        const userIdHash = isAdvancedMode ? parts[4] : parts[3];
        const lookupKey = `${domain}/${userIdHash}`;
        if (!keyManifest[lookupKey]) {
            return wrapTextResponse("This is not the key you're looking for.", 404);
        }

        const assetRequest = new Request(`${reqUrl.origin}/${keyManifest[lookupKey]}`);
        const assetResponse = await env.ASSETS.fetch(assetRequest);

        const newResponse = new Response(assetResponse.body, assetResponse);
        newResponse.headers.set('Content-Type', 'application/octet-stream');
        return wrapResponse(newResponse);
    },
} satisfies ExportedHandler<Env>;
