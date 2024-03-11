import * as djwt from "https://deno.land/x/djwt@v3.0.1/mod.ts";

globalThis.addEventListener("unhandledrejection", (e) => {
  console.log(Date.now() + ":" + e.reason);
  e.preventDefault();
});

console.log("From Worker", self);

const AsyncFunction = async function () {}.constructor;

self.onmessage = (evt) => {
  console.log(evt.data);
  evt.data.asdf = "rrrr"
  const unsafe_code = `async function test(req, decode, verify) {
    console.log(decode, verify)
    return "test"
  }`;

  (async function () {
    const test = AsyncFunction(
      "request",
      "decode",
      "verify",
      `
      "use strict"
      const Deno = undefined;
      return (${unsafe_code.replaceAll("deno.land", "")})(request, decode, verify)
      `
    );

    try {
      await test(
        "adf",
        (jwt) => djwt.decode(jwt),
        (jwt, key, options) => djwt.verify(jwt, key, options)
      ).catch((e) => {
        console.error(e);
      });
      console.log("WORKER", djwt.decode.xxx);
    } catch (e) {
      console.error(e);
    } finally {
      self.postMessage({ test: "asdf" });
    }
  })();
};
