// Fetch the original image
let headersList = {
  Accept: "*/*",
  "Content-Type": "application/json",
  Authorization:
    "Bearer eyJraWQiOiJhc2RmIiwiYWxnIjoiUlMyNTYifQ.eyJleHAiOjE3MTAwMzk5NzksImlhdCI6MTcxMDAzOTM3OSwic3ViIjoidGVzdEB0ZXN0LmNvbSIsImlzcyI6Ilp3Y0F1dGhTZXJ2ZXIiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJmaXJzdE5hbWUiOiJaYWNoIiwibGFzdE5hbWUiOiJMYW5rdG9uIiwidXNlcklkIjoidGVzdEB0ZXN0LmNvbSIsIl9jb3VjaGRiLnJvbGVzIjpbXX0.ypdgdfeMKj9srKTH-ouzC03AMIBH98GV4bkJ8CaB_koxBL2FWejE_kwTfYj4XEejYq84CF3UWrQA8JPjoOKDp9489grEnzoXv9u4YyHPC10FZrdHBz--BHbc_XnlupDU_a4udfz6VIX_9ihdexy4jVQspuOkjjebBe85sDVJaP4iEXbz00OeZ7E8ZREn0_udUpfAaqa3oTdnSqJzwVzGaFpuIqsWqTV8R6Mw2msCW41tTmcFMjDU0LoAQEUFwTjjVVKZF7u9OIlt9deXa6g8UQzPV_GwCQEg8iIMFkzf5rxhpt7hEpEywYV1yQ1YCpZAdGIREG9uuUYvgGhcR8vpz2GNrK6VWbcCctuioKUvFe_IiuAIIp7ixlkKScLorDExs0fZaqcYUOlUu5miTWFFF4QjFmjFfTQDYtoma59FWkPvPiNox24Dx9qqztbZ8n7-n8UXXbya-AcMZG2CivoKEwT6OLKqUwLqJXnCLNrDUczPrRm-IP-S7YVwegvmvE_4hlXiv_3RxNSsJRVdGMKHAfS80SEvYXno0R2GanaKzqPuIJtEzsReT2aPyjhuKrsgt5VyJF60mtuLgX-JQGEQ2JEgkIfrZMmukW5TMODBU8znoLvzXTP6r1hBl-1_bFb9rWxUYerzPIyPNzuX3QIKpsdw9kyMDg6Z0ZtFUA1zKbo",
};
let start = performance.now();
// fetch("https://couchdb.zwc-software.com/fv/_design/test/_view/all", {headers: headersList})
fetch(
  "http://localhost:8000/fv/_changes?filter=test/filterfun&include_docs=true&feed=continuous&since=now&heartbeat=1000",
  { headers: headersList, method: "GET" }
)
  // fetch("https://couchdb.zwc-software.com/fv/_all_docs?include_docs=true")
  // Retrieve its body as ReadableStream
  .then((response) => {
    const reader = response.body.getReader();
    return new ReadableStream({
      start(controller) {
        let lastRow = "";
        return pump();
        function pump() {
          return reader.read().then(({ done, value }) => {
            // When no more data needs to be consumed, close the stream
            if (done) {
              console.log("closing controller")
              controller.close();
              return;
            }
            // Enqueue the next data chunk into our target stream
            const str = new TextDecoder().decode(value);
            const strSplit = str.split("\r\n");
            strSplit[0] = lastRow + strSplit[0];
            console.log({ strSplit });
            console.log(performance.now() - start);
            strSplit.forEach((row, idx) => {
              const lastChar = row[row.length - 1];
              if (lastChar === "[") return;
              if (row === "") return;

              try {
                const parsed = JSON.parse(row.substring(0, row.length - 1));
                // console.log({parsed})
              } catch (e) {
                if ((idx = strSplit.length - 1)) {
                  lastRow = row;
                } else {
                  throw new Error("failed to parse a row", row);
                }
              }
            });
            controller.enqueue(value);
            return pump();
          });
        }
      },
    });
  })
  // Create a new response out of the stream
  // .then((stream) => new Response(stream))
  // .then((response) => response.blob())
  .catch((err) => console.error(err));
