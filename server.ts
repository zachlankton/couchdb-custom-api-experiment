import * as djwt from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const serviceUrl = "http://localhost:5984";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "access-control-max-age": "3600",
  "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// const AsyncFunction = async function () {}.constructor;

const worker = new Worker(import.meta.resolve("./worker.js"), {
  type: "module",
  deno: {
    permissions: "none",
  },
});
worker.addEventListener("message", (ev) => {
  console.log(ev.data);
});

Deno.serve(async (req) => {
  worker.postMessage({ test: "ASDF" });
  // return new Response(JSON.stringify({ ok: true }));

  const url = new URL(req.url);
  console.log(url);
  const opts = { method: req.method, headers: req.headers, body: undefined };
  
  let bodyResp = null;
  try {
    bodyResp = await req.json();
  } catch (_e) {
    bodyResp = await req.text();
  }

  if (bodyResp) {
    opts.body = bodyResp;
  }

  const response = await fetch(
    `${serviceUrl}${url.pathname + url.search}`,
    opts
  );

  if (!response.body) {
    return new Response(JSON.stringify({ failed: true }), {
      headers: { ...response.headers, ...corsHeaders },
    });
  }

  return new Response(response.body, {
    headers: { ...response.headers, ...corsHeaders },
  });
});
