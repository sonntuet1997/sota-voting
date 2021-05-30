const https = require("https");
const fs = require("fs");

const options = {
  hostname: "dev.azure.com",
  port: 443,
  path:
    "/sonntuet1997/e37c3a4a-1c2e-4cf4-bcff-8d5e4211089a/_apis/build/latest/NFT-FE?api-version=6.0-preview",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization:
      "Basic " +
      Buffer.from(
        "PAT" + ":" + "cra5qtmztvnsmmxjb3gb5rbzm6oooecmjvo4i4ag4uxg52lownma"
      ).toString("base64"),
    "X-TFS-FedAuthRedirect": "Suppress",
  },
};

const req = https.request(options, (res) => {
  let result = "";
  res.on("data", (d) => {
    result += d;
  });
  res.on("end", function () {
    let fbResponse = JSON.parse(result);
    let link =
      fbResponse?._links?.self?.href +
      "/artifacts?artifactName=react&api-version=6.0&%24format=zip";
    console.log("build version:", fbResponse?.id);
    console.log("link", link);
    const file = fs.createWriteStream("download.zip");
    const path = link.split('https://dev.azure.com')[1];
    console.log("downloading");
    const request = https.request(
      {
        ...options,
        timeout: 300000,
        path,
        headers: {
            "Content-Type": "application/octet-stream",

          Authorization:
            "Basic " +
            Buffer.from(
              "PAT" +
                ":" +
                "cra5qtmztvnsmmxjb3gb5rbzm6oooecmjvo4i4ag4uxg52lownma"
            ).toString("base64"),
},
      },
      (res) => {
        // res.on("data", (d) => {
          // console.log(d);
        // });
        res.pipe(file);
        file.on('finish', function() {
          file.close(()=>{});  // close() is async, call cb after close completes.
          console.log("downloaded!");


          
        });
      }
    );
    request.end();
  });
});

req.on("error", (error) => {
  console.error(error);
});

req.end();
