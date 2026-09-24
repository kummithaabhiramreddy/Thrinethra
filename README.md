# THRINETHRA — Autonomous City Transport Intelligence & Command Center

AI-powered mobile urban transport intelligence system featuring real-time GIS bus fleet tracking, edge vision hazard detection, automated incident logging, and Neon PostgreSQL database integration.

---

## 🚀 Deploying to Vercel

You can deploy Thrinethra directly to [Vercel](https://vercel.com) in seconds using either the Vercel CLI or the Vercel Web Dashboard.

### Option 1: Deploy via Vercel CLI (Recommended)

1. Install the Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Run the deploy command from the project root:
   ```bash
   vercel
   ```

3. Deploy to production:
   ```bash
   vercel --prod
   ```

---

### Option 2: Deploy via GitHub & Vercel Dashboard

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment and serverless API proxy"
   git push origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your **Thrinethra** repository.
4. Keep the default settings (Framework Preset: **Other**) and click **Deploy**.

---

### ⚙️ Optional Environment Variables

You can configure these in your **Vercel Project Settings > Environment Variables**:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEON_CONNECTION_STRING` | PostgreSQL connection URI for Neon DB | `postgresql://user:pass@ep-your-project.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `NEON_ENDPOINT` | Serverless HTTP SQL endpoint | `https://ep-your-project.us-east-2.aws.neon.tech/sql` |

---

## 💻 Local Development

To run locally using the zero-dependency Node server:

```bash
npm start
```
or run `start-server.bat` on Windows.
Open `http://localhost:3000` in your browser.