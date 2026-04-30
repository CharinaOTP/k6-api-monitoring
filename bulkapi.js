import http from "k6/http";
import { sleep, check } from "k6";

// ================= CONFIG =================
const BASE_URL = "https://dev-api3.davao-water.gov.ph/dcwd-erp-billing-collection";

const BEARER_TOKEN = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyYWQ2MzU0YS1iNGExLTQwMmEtYWU2NC0xYTVhN2MwMDEzZTkiLCJzdWIiOiIyIiwibmFtZSI6IjAwMTE1OCIsInJvbGUiOiJCaWxsaW5nIEFkbWluIiwibmJmIjoxNzc3NTA4OTA4LCJleHAiOjE3NzgxMTM3MDgsImlhdCI6MTc3NzUwODkwOCwiaXNzIjoiZXJwQkNBQVBJIiwiYXVkIjoiZXJwQkNBQVBJIn0.4ThoXKuXMbc2QvvWv1i656klondleWdW9EoTOhbjOaXu54qGvNA0OR1rueFRUqcpA8idTKKZzYenW7M83O_pOQ";

// speed thresholds
const FAST_LIMIT_MS = 500;
const WARNING_LIMIT_MS = 1000;

// ================= OPTIONS =================
export const options = {
  stages: [
    { duration: "10s", target: 300 },   // ramp up
    { duration: "10s", target: 1000 },  // peak load
    { duration: "10s", target: 0 },     // ramp down
  ],
};

// ================= HEADERS =================
const params = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${BEARER_TOKEN}`,
  },
};

// ================= API LIST =================
const apis = [
  {
    name: "Bill Calculator",
    method: "GET",
    url: `${BASE_URL}/api/v1/billing/bill-calculator?accountNumber=051649713&ratesKey=02-01-2014&meterMaintenanceChargeFlag=1&consumption=25`,
  },
  // {
  //   name: "Create Bulk BAM",
  //   method: "POST",
  //   url: `${BASE_URL}/api/v1/billing/bam/create-bulk-bam-request`,
  //   body: {
  //     documentNumberType: 1,
  //     requests: [
  //       {
  //         bamRequestType: 1,
  //         jmsId: 0,
  //         documentId: 0,
  //         documentNumber: "string",
  //         highConsumptionAmount: 0,
  //         averageConsumptionAmount: 0,
  //         meteredSaleAmount: 0,
  //         penaltyAmount: 0,
  //         adjustmentAmount: 0,
  //         transactionId: 0,
  //         contraTransactionId: 0,
  //         asBilledAmount: 0,
  //         shoudBeAmount: 0,
  //         actionRecommended: "string",
  //         remarks: "string",
  //         requestedBy: "string",
  //         contactNumber: "string",
  //         preparedBy: "string",
  //       },
  //     ],
  //   },
  // },
  // {
  //   name: "Leak Adjustment",
  //   method: "POST",
  //   url: `${BASE_URL}/api/v1/billing/bam/create-leak-adjustment`,
  //   body: {
  //     // ⚠️ PUT REAL REQUIRED BODY HERE (from Swagger)
  //   },
  // },
];

// ================= CSV FORMAT =================
function csv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

// ================= MAIN TEST =================
export default function () {
  for (const api of apis) {
    const start = Date.now();
    let res;

    try {
      // ✅ correct GET vs POST handling
      if (api.method === "GET") {
        res = http.get(api.url, params);
      } else {
        res = http.request(
          api.method,
          api.url,
          JSON.stringify(api.body || {}),
          params
        );
      }

      const duration = Date.now() - start;

      // ================= CHECKS =================
      const result = check(res, {
        "status OK (200-399)": (r) => r.status >= 200 && r.status < 400,
        "fast (<500ms)": (r) => r.timings.duration < 500,
        "acceptable (<2s)": (r) => r.timings.duration < 2000,
      })
        ? "PASS"
        : "FAIL";

      // ================= SPEED STATUS =================
      let speedStatus = "FAST";
      if (duration > WARNING_LIMIT_MS) {
        speedStatus = "SLOW";
      } else if (duration > FAST_LIMIT_MS) {
        speedStatus = "WARNING";
      }

      // ================= CSV OUTPUT =================
      const row = [
        new Date().toLocaleString(),
        api.name,
        api.method,
        api.url,
        res.status,
        duration,
        result,
        speedStatus,
        res.error || "",
      ]
        .map(csv)
        .join(",");

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
        error.message,
      ]
        .map(csv)
        .join(",");

      console.log("CSVROW:" + row);
    }

    sleep(1); // small pause per API
  }
}