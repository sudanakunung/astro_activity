import type { APIRoute } from 'astro';
import crypto from 'crypto';

function generateSignature(clientId: string, requestId: string, requestTimestamp: string, requestBody: string, secretKey: string, targetPath: string) {
  // Digest
  const digest = crypto.createHash('sha256').update(requestBody).digest('base64');

  // Signature Component
  const signatureComponent =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${requestTimestamp}\n` +
    `Request-Target:${targetPath}\n` +
    `Digest:${digest}`;
    console.log('Signature Component:\n', signatureComponent);
  // Signature
  const signature = crypto.createHmac('sha256', secretKey)
    .update(signatureComponent)
    .digest('base64');

  return signature;
}

export const POST: APIRoute = async ({ request }) => {
 
  const clientId = import.meta.env.DOKU_CLIENT_ID_sandbox;
  const secretKey = import.meta.env.DOKU_SECRET_KEY_sandbox;
  const requestId = crypto.randomUUID();
  const requestTimestamp = new Date().toISOString();
  const requestBody = JSON.stringify({
    order: {
        amount: 20000,
        invoice_number: "INV-20210231-0001"
    },
    payment: {
        payment_due_date: 60
    }
});
  const targetPath = '/checkout/v1/payment';

  // Generate Signature
  const signature = generateSignature(clientId, requestId, requestTimestamp, requestBody, secretKey, targetPath);
    console.log('Generated Signature:', signature);

  const dokuApiUrl = 'https://api-sandbox.doku.com/checkout/v1/payment';

  const res = await fetch(dokuApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': clientId,
      'Request-Id': requestId,
      'Request-Timestamp': requestTimestamp,
      'Signature': signature,
    },
    body: requestBody,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = await res.text();
  }
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const prerender = false;