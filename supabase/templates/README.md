# LaunchVault — Auth Email Templates

Premium HTML templates for the 6 Supabase Auth emails. Each uses a gradient header tuned to the email's purpose (purple for signup, cyan for magic link, rose for recovery, indigo for email change, emerald for invite, amber for reauthentication code).

Variables used by Supabase Go template engine:
- `{{ .ConfirmationURL }}` — the click-to-confirm link
- `{{ .SiteURL }}` — your app's base URL (set under Auth → URL Configuration)
- `{{ .Email }}` / `{{ .NewEmail }}` — user emails
- `{{ .Token }}` — 6-digit reauthentication code

## How to apply

### Option A — Paste each into the dashboard (fastest, no CLI)
1. Go to **https://supabase.com/dashboard/project/fymvlygdmqpketfwevit/auth/templates**
2. For each template type, open the corresponding `.html` file in this folder
3. Click the template type in Supabase → "Source" tab → paste the entire HTML
4. Update the **Subject** field (see subjects in `supabase/config.toml`)
5. Click **Save**

| Supabase template | File |
|---|---|
| Confirm signup | `confirm-signup.html` |
| Magic Link | `magic-link.html` |
| Reset Password | `recovery.html` |
| Change Email Address | `email-change.html` |
| Invite User | `invite.html` |
| Reauthentication | `reauthentication.html` |

### Option B — Push via Supabase CLI
```
npx supabase link --project-ref fymvlygdmqpketfwevit
npx supabase config push
```
This reads `supabase/config.toml` (already configured) and uploads all templates in one shot.

## When you get a custom domain

The templates use `{{ .SiteURL }}` for the brand link in the footer, which Supabase pulls from **Auth → URL Configuration → Site URL**. So when you hook up `launchvault.com` (or whatever):

1. Go to https://supabase.com/dashboard/project/fymvlygdmqpketfwevit/auth/url-configuration
2. Set **Site URL** to your custom domain (e.g. `https://launchvault.com`)
3. Add the same domain (with `/auth/callback` etc.) under **Redirect URLs**
4. All emails will instantly reflect the new domain — no template changes needed
