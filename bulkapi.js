// Swagger → find API → inspect params → copy curl → Postman → manually put in bulkapi.js
import http from "k6/http";
import { sleep } from "k6";

const FAST_LIMIT_MS = 500;
const WARNING_LIMIT_MS = 1000;

const BEARER_TOKEN = "test123456789";

const apis = [
  {
    name: "JSONPlaceholder Posts",
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts",
  },
  {
    name: "JSONPlaceholder Users",
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/users",
  },
  {
    name: "HTTPBin Bearer Test",
    method: "GET",
    url: "https://httpbin.org/bearer",
  },
  {
    name: "HTTPBin Get With Params",
    method: "GET",
    url: "https://httpbin.org/get?customerId=000001&type=test",
  },
  {
    name: "Restful Booker Ping",
    method: "GET",
    url: "https://restful-booker.herokuapp.com/ping",
  }
];

export const options = {
  vus: 1,
  iterations: 1,
};

function csv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function () {
  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
  };

  for (const api of apis) {
    const start = Date.now();
    let res;

    try {
      res = http.request(api.method, api.url, JSON.stringify(api.body || {}), params);

      const duration = Date.now() - start;
      const result = res.status >= 200 && res.status < 400 ? "PASS" : "FAIL";

      let speedStatus = "FAST";
      if (duration > WARNING_LIMIT_MS) {
        speedStatus = "SLOW";
      } else if (duration > FAST_LIMIT_MS) {
        speedStatus = "WARNING";
      }

      const row = [
        new Date().toLocaleString(),
        api.name,
        api.method,
        api.url,
        res.status,
        duration,
        result,
        speedStatus,
        res.error || ""
      ].map(csv).join(",");

      console.log("CSVROW:" + row);

    } catch (error) {
      const row = [
        new Date().toLocaleString(),
        api.name,
        api.method,
        api.url,
        "ERROR",
        0,
        "FAIL",
        "ERROR",
        error.message
      ].map(csv).join(",");

      console.log("CSVROW:" + row);
    }

    sleep(1);
  }
}

// Swagger → understand API docs
// Chrome DevTools → discover hidden APIs
// Postman → organize endpoints
// Postman collection → convert to k6
// k6 → load/performance test
// Jenkins/GitHub Actions → automation