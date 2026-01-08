// @ts-expect-error
import keyManifest from "./key-manifest.json";

function wrapResponse(response: Response): Response {
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
}

export default {
    async fetch(request, env, ctx): Promise<Response> {
        const reqUrl = new URL(request.url);
        const isAdvancedMode = reqUrl.hostname.startsWith("openpgpkey.");

        const parts = reqUrl.pathname.split('/').filter(Boolean);
        if (parts[0] !== '.well-known' || parts[1] !== 'openpgpkey') {
            return wrapResponse(new Response("I'm a WKD server! This is not the key you're looking for.", {
                status: 404
            }));
        }

        const requestType = isAdvancedMode ? parts[3] : parts[2];
        if (requestType?.toLowerCase() === "policy") {
            // Keep empty content.
            return wrapResponse(new Response("", {
                status: 200
            }));
        } else if (requestType !== "hu") {
            return wrapResponse(new Response("This is not the key you're looking for.", {
                status: 404
            }));
        }
        
        // Direct Mode: /.well-known/openpgpkey/(hu|policy)/{wkdHash}
        // Advanced Mode: /.well-known/openpgpkey/{domain}/(hu|policy)/{wkdHash}
        const domain = isAdvancedMode ? parts[2] : reqUrl.hostname;
        const userIdHash = isAdvancedMode ? parts[4] : parts[3];
        const lookupKey = `${domain}/${userIdHash}`;
        if (!keyManifest[lookupKey]) {
            return wrapResponse(new Response("This is not the key you're looking for.", {
                status: 404
            }));
        }

        const assetRequest = new Request(`${reqUrl.origin}/${keyManifest[lookupKey]}`);
        const assetResponse = await env.ASSETS.fetch(assetRequest);

        const newResponse = new Response(assetResponse.body, assetResponse);
        newResponse.headers.set('Content-Type', 'application/octet-stream');
        return wrapResponse(newResponse);
    },
} satisfies ExportedHandler<Env>;
