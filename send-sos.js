// /api/send-sos.js
// Serverless function (runs on Vercel, not in the browser).
// Reads Twilio credentials from environment variables — never from the request —
// so they're never exposed to anyone visiting the site.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const { reason, mapsLink, contacts } = req.body || {};

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: 'No contacts provided' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: 'Twilio environment variables are not set on the server' });
  }

  const body = `Vision Guard alert: ${reason || 'Emergency detected'}.` +
    (mapsLink ? ` Last known location: ${mapsLink}` : ' Location unavailable.');

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const results = [];

  for (const contact of contacts) {
    const to = contact.phone;
    if (!to) continue;

    try {
      const params = new URLSearchParams({ To: to, From: fromNumber, Body: body });
      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        }
      );
      const data = await resp.json();
      results.push({ to, ok: resp.ok, sid: data.sid, error: resp.ok ? null : data.message });
    } catch (err) {
      results.push({ to, ok: false, error: err.message });
    }
  }

  const anyFailed = results.some(r => !r.ok);
  return res.status(anyFailed ? 207 : 200).json({ results });
}
