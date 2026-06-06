# LinkTrack - LinkedIn Outreach Tracker

LinkTrack is a premium web dashboard designed to manage, optimize, and track your LinkedIn cold outreach. It allows you to organize target companies, store contacts, track connection status, manage draft outreach messages, and view real-time conversion stats.

The application uses **React**, **Vite**, **TypeScript**, and **TailwindCSS** for the frontend, with dual-persistence support using **Supabase** for database synchronization and **Local Storage** for instant offline caching.

---

## Features

- **Outreach Dashboard**: View metrics such as Total Connections, Pending, Accepted, and Acceptance Rate.
- **Ready to Message**: Real-time listing of accepted connections with outreach drafts ready to copy-paste.
- **Company Tracking**: Organize contacts by company, with visual progress indicators showing outreach conversion.
- **CRUD Operations**: Complete management for target companies and individual contacts.
- **Database Synchronization**: Built-in integration with Supabase for centralized persistence.
- **Offline Fallback**: Seamless fallback to local storage if the database is offline or not configured.
- **Export & Import**: Export backups as JSON or import data locally.

---

## Database Setup

LinkTrack uses **Supabase** (PostgreSQL) to persist data. Follow these steps to configure your database:

1. Create a new project in your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor** in the left navigation panel.
3. Copy the contents of the [schema.sql](./schema.sql) file located in the root of this project and paste it into the editor.
4. Click **Run** to execute the script. This will create:
   - `companies` table
   - `contacts` table (with cascade-delete references)
   - Read/write access policies allowing anonymous public client queries.

---

## Environment Configuration

Create a `.env` file in the root directory (based on `.env.example` / current `.env` properties) containing your Supabase URL and public Anon Key:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

---

## Installation & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```

3. **Production Build**:
   ```bash
   npm run build
   ```

---

## Deployment to Vercel

LinkTrack is optimized to be deployed as a single-page application on Vercel:

1. Install the Vercel CLI (`npm i -g vercel`) or log in to the [Vercel Dashboard](https://vercel.com).
2. Connect your GitHub repository.
3. Configure the environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy. The project includes [vercel.json](./vercel.json) to automatically configure SPA fallback routes.
