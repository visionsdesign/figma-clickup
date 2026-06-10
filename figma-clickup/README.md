# Figma → ClickUp Sync Tool

A lightweight web app that fetches comments from any Figma file and creates them as tasks in ClickUp. Runs entirely in the browser — no local setup needed for your team.

---

## Deploy to Vercel (5 minutes)

### 1. Create a free Vercel account
Go to [vercel.com](https://vercel.com) and sign up with email. No credit card needed.

### 2. Deploy the project
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Deploy without a Git repository"** (or "Browse" to upload)
3. Drag and drop this entire project folder onto the upload area
4. Click **Deploy**

### 3. Add your API tokens as environment variables
Once deployed, go to your project in Vercel:
1. Click **Settings → Environment Variables**
2. Add these two variables:

| Name | Value |
|------|-------|
| `FIGMA_TOKEN` | Your Figma personal access token |
| `CLICKUP_TOKEN` | Your ClickUp API token |

3. Click **Save** then go to **Deployments** and click **Redeploy** (so the variables take effect)

### 4. Share the URL
Vercel gives you a URL like `https://your-project.vercel.app`. Share this with your team — that's all they need.

---

## Getting your tokens

### Figma token
1. Open Figma → click your avatar → **Settings**
2. Go to **Security → Personal access tokens**
3. Click **Generate new token**
4. Set expiry to maximum (or no expiration if available)
5. Tick scopes: `file_comments:read` and `file_comments:write`
6. Copy the token immediately (it won't show again)

### ClickUp token
1. Open ClickUp → **Settings** (bottom left)
2. Go to **Apps → API token**
3. Click **Generate** and copy the token

---

## How to use

1. Open the app URL in any browser
2. Paste a Figma file URL (e.g. `https://figma.com/design/abc123/My-File`)
3. Click **Fetch comments** — all comments load instantly
4. Filter by Open / Resolved, select the ones you want
5. Enter your ClickUp list ID (from the ClickUp URL)
6. Set priority, tag, and whether to auto-resolve Figma comments on create
7. Click **Create tasks in ClickUp**

---

## Finding your ClickUp list ID
Open the list in ClickUp. The URL looks like:
`https://app.clickup.com/12345678/v/l/901234567`
The list ID is the last number: `901234567`

---

## Moving to GitHub later
1. Create a new repo on GitHub
2. Push this folder to it
3. In Vercel, go to Settings → Git → Connect Git Repository
4. Select your repo — done. Future pushes auto-deploy.

---

## Scheduled syncing (twice a day)
To run automatically without anyone clicking anything:
1. In Vercel, install the **Vercel Cron** integration (free)
2. Add a `cron.json` file — ask Claude to set this up for you when ready
