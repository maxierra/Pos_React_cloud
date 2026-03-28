import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // 10 usuarios gradual
    { duration: '1m', target: 10 },   // mantener 10 usuarios por 1 min
    { duration: '30s', target: 0 },    // bajar a 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% de requests < 2s
    http_req_failed: ['rate<0.1'],     // menos de 10% errores
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const EMAIL = __ENV.EMAIL || 'test@test.com';
const PASSWORD = __ENV.PASSWORD || 'test1234';

export default function () {
  // Login
  const loginRes = http.post(`${BASE_URL}/auth/login`, 
    `email=${encodeURIComponent(EMAIL)}&password=${encodeURIComponent(PASSWORD)}&redirect=/app`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  
  check(loginRes, {
    'login status 200 or 302': (r) => [200, 302].includes(r.status),
  });

  sleep(5);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  let output = '\n';
  output += `${indent}=== RESUMEN DE LOAD TEST ===\n`;
  output += `${indent}Requests_totales: ${data.metrics.http_reqs.values.count}\n`;
  output += `${indent}Duración_p95: ${data.metrics.http_req_duration.values['p(95)']}ms\n`;
  output += `${indent}Errores: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  return output;
}