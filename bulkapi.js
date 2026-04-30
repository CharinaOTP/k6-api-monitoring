// Swagger → find API → inspect params → copy curl → Postman → manually put in bulkapi.js
import http from "k6/http";
import { sleep } from "k6";

const FAST_LIMIT_MS = 500;
const WARNING_LIMIT_MS = 1000;

const BEARER_TOKEN = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YmE5M2Y5Zi0yZDRhLTQ1MDctOTI1OS02ZmQ0MzYyMTAyYzgiLCJzdWIiOiIyIiwibmFtZSI6IjAwMTE1OCIsInJvbGUiOiJCaWxsaW5nIEFkbWluIiwibmJmIjoxNzc3NTA1OTA4LCJleHAiOjE3NzgxMTA3MDgsImlhdCI6MTc3NzUwNTkwOCwiaXNzIjoiZXJwQkNBQVBJIiwiYXVkIjoiZXJwQkNBQVBJIn0.3uYY4AHltaFDEDhN2Tg-TXJ2O97kvwrM0-QYne3XAH0ctSJ5wAm1CQliG6E8tURvXIqfCO6kLmCfLec6FrDRLA";

const apis = [
  {
    name: "Bill Calculator",
    method: "GET",
    url: "https://dev-api3.davao-water.gov.ph/dcwd-erp-billing-collection/api/v1/billing/bill-calculator?accountNumber=051649713&ratesKey=02-01-2014&meterMaintenanceChargeFlag=1&consumption=25",
  },
  {
    name: "BillingAdjustmentMemo-CreationBulkBamRequest",
    method: "POST",
    url: "https://dev-api3.davao-water.gov.ph/dcwd-erp-billing-collection/api/v1/billing/bam/create-bulk-bam-request",
    body: {
    documentNumberType: 1,
    requests: [
      {
        bamRequestType: 1,
        jmsId: 0,
        documentId: 0,
        documentNumber: "string",
        highConsumptionAmount: 0,
        averageConsumptionAmount: 0,
        meteredSaleAmount: 0,
        penaltyAmount: 0,
        adjustmentAmount: 0,
        transactionId: 0,
        contraTransactionId: 0,
        asBilledAmount: 0,
        shoudBeAmount: 0,
        actionRecommended: "string",
        remarks: "string",
        requestedBy: "string",
        contactNumber: "string",
        preparedBy: "string"
      }
    ]
  }
},
  {
    name: "BillingAdjustmentMemo-CreateLeakAdjustment",
    method: "POST",
    url: "https://dev-api3.davao-water.gov.ph/dcwd-erp-billing-collection/api/v1/billing/bam/create-leak-adjustment",
   },
  // {
  //   name: "HTTPBin Get With Params",
  //   method: "GET",
  //   url: "https://httpbin.org/get?customerId=000001&type=test",
  // },
  // {
  //   name: "Restful Booker Ping",
  //   method: "GET",
  //   url: "https://restful-booker.herokuapp.com/ping",
  // }
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