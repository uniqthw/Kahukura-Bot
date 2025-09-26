Email setup for Kahukura Bot

This document explains how to configure SMTP settings for the bot so it can send verification emails, and how to run a quick test script.

1) Preferred approach: use an SMTP provider

- SendGrid, Mailgun, Postmark, Amazon SES, or others provide API/SMTP. They usually provide a username and password or an API key for SMTP.
- Configure `settings.json` -> `email` with the provider values. Example (SendGrid SMTP):

{
  "host": "smtp.sendgrid.net",
  "port": 587,
  "secure": false,
  "auth": {
    "user": "apikey",
    "pass": "YOUR_SENDGRID_API_KEY"
  }
}

2) Using Gmail

- Option A: App Passwords (recommended if using a Gmail account and 2FA enabled)
  - Enable 2-Step Verification on the Google account.
  - Create an App Password (select Mail -> Other (Custom name) -> generate) and copy it.
  - In `settings.json`, set:

  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "auth": {
    "user": "your-email@gmail.com",
    "pass": "APP_PASSWORD_HERE"
  }

- Option B: OAuth2 (more secure for long-lived credentials)
  - Requires client ID/secret and refresh token. Nodemailer supports OAuth2 transport; if you need this, I can add an example.

3) Secrets handling

- Do NOT commit real credentials to the repo.
- For local testing, `settings.json` is fine but for production, prefer environment variables or a secret manager.
- If you want, I can change the code to read SMTP config from environment variables instead.

4) Test the SMTP configuration locally

- Install dependencies (you already have them): nodemailer is listed in package.json.
- Run the test script (PowerShell):

```powershell
pnpm exec ts-node scripts/send_test_email.ts
# or to send to a specific target address
pnpm exec ts-node scripts/send_test_email.ts someone@example.com
```

- Expected outcome: you should see `Message sent: <messageId>` in the console and receive email at the target address.
- If you see an error from nodemailer, read the error. Common reasons:
  - Authentication failed (wrong pass or app password needed)
  - Blocked by provider (Gmail may block sign-in attempts from less-secure apps)
  - Port blocked by firewall

5) Next steps I can help with

- Add OAuth2 nodemailer example for Gmail.
- Move SMTP config into environment variables and update code to read env vars.
- Add verification email template with nicer HTML (brand colours, expiry info).

If you want me to enable OAuth2 for Gmail or switch to env var configuration, tell me which option you prefer and I will implement it and a small how-to for obtaining credentials.