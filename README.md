# since 10·23

Our little corner of the internet. Bryan & Cecilia, together since **Wednesday, October 23, 2019 at 7:00 PM**.

## What it does

- **Live counter.** Years, months, days, hours, minutes and seconds since 7:00 PM on Oct 23, 2019, ticking every second. It always counts in Philippine time, so it reads the same on every phone.
- **Countdowns** to the next monthsary and the next anniversary, plus fun milestones like 2,600 days or 250 million seconds together.
- **Memories.** Upload photos any day. Each one goes into its monthsary album based on the date it was taken. You can heart favorites, fix dates and add captions.
- **Monthsary post maker.** Pick a monthsary and its photos (favorites are picked for you) and it lays them out with our names and dates. Sizes: Instagram post (1080×1350) and story (1080×1920). Share it straight to Instagram from your phone, or download it. There's a caption idea you can copy too.

### How albums work

The album for a monthsary holds everything from the **day after the last monthsary through the monthsary day itself**. For example, the 86th Monthsary album is Nov 24 – Dec 23, 2026, so photos from the celebration on the 23rd land in that night's post. Every 12th monthsary is called an anniversary (the 84th is the 7th Anniversary).

### Who can do what

The site is public, so anyone with the link can see the counter and the photos. Adding, editing or deleting photos asks for **our passcode** once, and then that phone remembers it.

## Put it online (about 15 minutes, free)

### 1. Supabase (stores the photos)

1. Sign up at [supabase.com](https://supabase.com) and create a new project (the free plan is plenty).
2. Open **SQL Editor → New query**, paste everything in [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. Go to **Project Settings → API Keys** and copy:
   - the **Project URL** (looks like `https://abcd1234.supabase.co`)
   - a **secret key** (`sb_secret_…`; the older `service_role` key works too). Keep it private.

### 2. Vercel (hosts the site)

1. Sign up at [vercel.com](https://vercel.com) with GitHub and click **Add New → Project**, then import `since-1023`.
2. Under **Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | your Project URL |
   | `SUPABASE_SECRET_KEY` | your secret key |
   | `UPLOAD_PASSCODE` | a passcode only you two know (a short phrase is best) |

3. Click **Deploy**. Your site will be at something like `since-1023.vercel.app`. You can add your own domain later in Vercel.

A daily job (`vercel.json`) checks in on Supabase, because free Supabase projects pause after a week without any activity.

## Run it on your computer

```bash
npm install
cp .env.example .env.local   # then set UPLOAD_PASSCODE
npm run dev                  # http://localhost:3000
```

Without Supabase settings, photos are saved in `./.data` on your computer.

```bash
npm test        # checks the date math (monthsaries, albums, the exact 7 PM start)
npm run lint
npm run build
```

## Make it yours

- Names, the start date and the timezone are in [`src/lib/us.ts`](src/lib/us.ts).
- Colors (wheat, light brown, burgundy) and fonts are in [`src/app/globals.css`](src/app/globals.css). The Instagram image uses the same colors, in [`src/lib/collage.ts`](src/lib/collage.ts).

## How it's built

[Next.js](https://nextjs.org) 16 + Tailwind CSS, with photos in [Supabase](https://supabase.com) Storage and Postgres, hosted on [Vercel](https://vercel.com).

- Photos are resized on the phone before uploading (max 2048px, plus a 640px thumbnail), so uploads are quick and the free 1 GB lasts for years.
- The Instagram image is drawn in the browser on a `<canvas>`, so there's no server cost.
- All date math lives in [`src/lib/time.ts`](src/lib/time.ts), and [`src/lib/time.test.ts`](src/lib/time.test.ts) tests it.
