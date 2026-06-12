# Recipe: Webhook Handler

When implementing a webhook receiver for BeeL events, always include these four things:

1. **Signature verification** — validate `BeeL-Signature` header
2. **Deduplication** — track `BeeL-Event-Id` to avoid double-processing
3. **Fast response** — return 200 immediately, process async
4. **Retry awareness** — BeeL retries up to 5 times on failure

⚠️ **Always verify the exact signature format and event types from the live docs:**
```bash
curl https://docs.beel.es/llms.txt | grep -i webhook
curl https://docs.beel.es/llms.txt | grep -i signature
```

## Express (Node.js) Example

```typescript
import crypto from 'crypto';
import express from 'express';

const app = express();
const processedEvents = new Set<string>(); // Use Redis/DB in production

app.post('/webhooks/beel', express.raw({ type: 'application/json' }), (req, res) => {
  // 1. Verify signature
  const signature = req.headers['beel-signature'] as string;
  if (!verifySignature(req.body, signature, process.env.BEEL_WEBHOOK_SECRET!)) {
    return res.status(401).send('Invalid signature');
  }

  // 2. Deduplicate
  const eventId = req.headers['beel-event-id'] as string;
  if (processedEvents.has(eventId)) {
    return res.status(200).send('Already processed');
  }

  // 3. Respond fast
  res.status(200).send('OK');

  // 4. Process async
  const event = JSON.parse(req.body.toString());
  processedEvents.add(eventId);
  handleEvent(event).catch(console.error);
});

function verifySignature(payload: Buffer, header: string, secret: string): boolean {
  // BeeL-Signature format: t=timestamp,v1=hmac
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  if (!parts.t || !parts.v1) return false;

  // Reject stale timestamps (replay protection) — verify the exact window in the live docs
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(parts.t, 10)) > 300) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${payload.toString()}`)
    .digest('hex');

  // timingSafeEqual throws on length mismatch — guard first
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(parts.v1);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

async function handleEvent(event: any) {
  // Fetch docs for the full list of event types:
  // curl https://docs.beel.es/llms.txt | grep -i events
  switch (event.type) {
    case 'invoice.emitted':
      break;
    case 'verifactu.status.updated':
      break;
  }
}
```

⚠️ This shows the **pattern**. Always verify the exact signature algorithm and payload structure from the live webhook docs before deploying to production.
