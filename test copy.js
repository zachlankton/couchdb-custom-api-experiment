// Fetch the original image
const headersList = {
  Accept: "*/*",
  "Content-Type": "application/json",
  Authorization:
    "Bearer eyJraWQiOiJhc2RmIiwiYWxnIjoiUlMyNTYifQ.eyJleHAiOjE3MTAwMzk5NzksImlhdCI6MTcxMDAzOTM3OSwic3ViIjoidGVzdEB0ZXN0LmNvbSIsImlzcyI6Ilp3Y0F1dGhTZXJ2ZXIiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJmaXJzdE5hbWUiOiJaYWNoIiwibGFzdE5hbWUiOiJMYW5rdG9uIiwidXNlcklkIjoidGVzdEB0ZXN0LmNvbSIsIl9jb3VjaGRiLnJvbGVzIjpbXX0.ypdgdfeMKj9srKTH-ouzC03AMIBH98GV4bkJ8CaB_koxBL2FWejE_kwTfYj4XEejYq84CF3UWrQA8JPjoOKDp9489grEnzoXv9u4YyHPC10FZrdHBz--BHbc_XnlupDU_a4udfz6VIX_9ihdexy4jVQspuOkjjebBe85sDVJaP4iEXbz00OeZ7E8ZREn0_udUpfAaqa3oTdnSqJzwVzGaFpuIqsWqTV8R6Mw2msCW41tTmcFMjDU0LoAQEUFwTjjVVKZF7u9OIlt9deXa6g8UQzPV_GwCQEg8iIMFkzf5rxhpt7hEpEywYV1yQ1YCpZAdGIREG9uuUYvgGhcR8vpz2GNrK6VWbcCctuioKUvFe_IiuAIIp7ixlkKScLorDExs0fZaqcYUOlUu5miTWFFF4QjFmjFfTQDYtoma59FWkPvPiNox24Dx9qqztbZ8n7-n8UXXbya-AcMZG2CivoKEwT6OLKqUwLqJXnCLNrDUczPrRm-IP-S7YVwegvmvE_4hlXiv_3RxNSsJRVdGMKHAfS80SEvYXno0R2GanaKzqPuIJtEzsReT2aPyjhuKrsgt5VyJF60mtuLgX-JQGEQ2JEgkIfrZMmukW5TMODBU8znoLvzXTP6r1hBl-1_bFb9rWxUYerzPIyPNzuX3QIKpsdw9kyMDg6Z0ZtFUA1zKbo",
};

const controller = new AbortController();

// fetch("https://couchdb.zwc-software.com/fv/_design/test/_view/all", {headers: headersList})
const response = await fetch(
  "http://localhost:8000/fv/_changes?filter=test/filterfun&include_docs=true&feed=continuous&since=now&heartbeat=10000",
  // "http://localhost:8000/fv/_changes?filter=test/filterfun&include_docs=true",
  {
    headers: headersList,
    method: "POST",
    body: JSON.stringify({}),
    signal: controller.signal,
  }
);

const reader = response.body.getReader();
while (true) {
  console.log("reading");
  const chunk = await reader.read().catch((err) => ({ err }));

  if (chunk.err) {
    if (chunk.err.name === "AbortError") {
      console.log(test);
    }else{
      throw new Error(chunk.err)
    }
    break;
  }

  if (chunk.value) {
    const str = new TextDecoder().decode(chunk.value);
    console.log({ str });
  }

  if (chunk.done) {
    console.log("done");
    break;
  }
}
