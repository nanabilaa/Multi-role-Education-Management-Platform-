

````bash
cat <<'EOF' > README.md
# Multi-role Education Management Platform

This is a [Next.js](https://nextjs.org) project for a multi-role education management platform. This application is built to support tutoring management, including student data, tutoring sessions, learning journals, SPP/payment records, financial transactions, tutor honor, and role-based dashboards.

## Getting Started

First, install the dependencies:

```bash
npm install
````

Create `.env.local` file in the root project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

This project uses:

* Next.js 14 App Router
* TypeScript
* Tailwind CSS
* Supabase Auth
* Supabase Database
* Supabase Storage

## Main Features

* Multi-role login system
* Admin dashboard
* Tutor dashboard
* Parent dashboard
* Superadmin dashboard
* Student management
* Tutoring session management
* Learning journal management
* SPP/payment management
* Financial transaction records
* Tutor honor management
* Journal validation photo upload
* Backup and reset planning for operational data

## User Roles

### Superadmin

Superadmin manages admins, users, audit logs, and operational backup/reset features.

### Admin

Admin manages students, tutoring sessions, learning journals, SPP payments, financial transactions, and tutor honor data.

### Tutor

Tutor can create tutoring sessions, view schedules, submit learning journals, upload validation photos, and check honor data.

### Parent

Parent can view student schedules, learning journals, SPP bills, and profile information.

## Project Structure

```bash
app/
components/
lib/
public/
```

## Environment Variables

This project uses Supabase, so the following environment variables are required:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not upload `.env.local` or `.env` to GitHub.

## Git Ignore

Make sure these files and folders are included in `.gitignore`:

```bash
.env.local
.env
node_modules
.next
```

## Development Notes

You can start editing the project by modifying files inside the `app/` directory. The page auto-updates as you edit the file.

This project uses the Next.js App Router structure and separates dashboard pages by user role.

## Deploy on Vercel

The easiest way to deploy this Next.js app is using the [Vercel Platform](https://vercel.com).

Before deploying, add the required Supabase environment variables in your Vercel project settings.

## Status

This project is currently in MVP development.
EOF

````

```bash
git add README.md
git commit -m "Update README documentation"
git push
````
