# since 10·23

Our little corner of the internet. Bryan & Cecilia, together since **Wednesday, October 23, 2019 at 7:00 PM**.

## What it does

- **Live counter.** Years, months, days, hours, minutes and seconds since exactly 7:00 PM on Oct 23, 2019, ticking every second. It always counts in Philippine time, so it reads the same on every phone.
- **Countdowns** to the next monthsary and the next anniversary, plus fun milestones like 2,600 days or 250 million seconds together.
- **On this day.** Photos from the same date in earlier years show up on the home page.
- **Love notes** (`/notes`). Leave each other little notes, written in a handwriting font on paper you pick the color of.
  - Each note is from Bryan or Cecilia. Each phone remembers who usually writes from it.
  - **Just us** notes are only visible when signed in. **Everyone** notes show on the public site. Every new note starts as Just us.
  - Heart the other one's notes, filter by who wrote them, and delete with Undo.
  - The newest note shows on the home page.
- **Memories,** presented like the Photos app. Each monthsary gets an album with a full-size cover photo and the photos grouped by day. Favorites are shown bigger. The viewer is swipeable, you can double-tap to zoom, and anyone can save or share a photo from it.
- **Our Wrapped.** Every album has a tap-through story of its month. Tap the right side to go on, the left to go back, and hold to pause. It covers:
  - how long the month was, in minutes
  - how many moments we saved
  - our most-photographed day
  - the time of day and the day of the week we take the most photos
  - our favorites and a caption in our own words
  - a photo montage and what's next
  - a summary card to save for an Instagram story
- **Year Wrapped.** Every anniversary album also has a story for the whole year, including our biggest month. On monthsary days, the home banner opens that month's Wrapped.
- **Monthsary post maker.** Pick a monthsary and its photos (favorites are picked for you) and it lays them out with our names and dates. Sizes: Instagram post (1080×1350) and story (1080×1920). Share it straight to Instagram from your phone, or download it.

### How albums work

Each album runs from the **23rd through the 22nd**. At exactly **12:00 AM on the 23rd** the album is complete: the home page says "Happy 86th Monthsary!" all day and links to it, and it's ready for its Instagram post. Every 12th monthsary is called an anniversary (the 84th is the 7th Anniversary). Photos from before Oct 23, 2019 go in "Before Us".

### Who can do what

- **Visitors** can see the counter and every album. They never see a sign-in page or any edit buttons.
- **Us (the owners)** sign in through a hidden door: **tap the heart in the footer five times**, or go to `/login`. Once signed in, you can:
  - add photos (two upload at a time, with progress bars and a "Try again" button if one fails). Photos that are already in our albums are spotted and skipped, unless you tap "Add anyway".
  - heart favorites, and edit dates and captions
  - delete photos: open one and tap **Delete**, or tap **Select** on an album to delete or favorite several at once. Deleting waits 5 seconds with an **Undo** button, just in case.
  - make the monthsary post

  "Signed in as … · Sign out" appears at the bottom of every page.

Sign-in uses Supabase Auth. Only accounts whose email is in `OWNER_EMAILS` can change anything, and every change is checked on the server.

## Put it online (about 15 minutes, free)

### 1. Supabase (accounts and photos)

1. Create a project at [supabase.com](https://supabase.com) (the free plan is plenty).
2. **SQL Editor → New query:** paste everything in [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It's safe to run again. If you set Supabase up before love notes existed, just run [`supabase/love-notes.sql`](supabase/love-notes.sql) the same way.
3. **Authentication → Sign In / Providers:** turn off **Allow new users to sign up**, so nobody else can make an account.
4. **Authentication → Users → Add user → Create new user:** enter your email and a password and tick **Auto Confirm User**. Do the same for Cecilia if she should be able to edit too.
5. Copy these values for the next step:
   - **Connect → Framework → Next.js (App Router):** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Skip the "install packages" and "add files" steps on that screen; they're already done in this code.
   - **Project Settings → API Keys → Secret keys:** a secret key (`sb_secret_…`). Keep it private.

### 2. Vercel (hosts the site)

1. Sign up at [vercel.com](https://vercel.com) with GitHub and click **Add New → Project**, then import `since-1023`.
2. Under **Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase → Connect |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from Supabase → Connect |
   | `SUPABASE_SECRET_KEY` | your secret key |
   | `OWNER_EMAILS` | the emails you created in step 4, separated by commas |

3. Click **Deploy**. Your site will be at something like `since-1023.vercel.app`. If you change these settings later, redeploy so they take effect.

A daily job (`vercel.json`) checks in on Supabase, because free Supabase projects pause after a week without any activity.

## On your phone

Open the site in Safari, tap **Share → Add to Home Screen**, and it opens like an app with our heart icon. Sharing the link shows a preview card with our names.

## Run it on your computer

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev                  # http://localhost:3000
```

If you leave `SUPABASE_SECRET_KEY` empty on your computer, photos you add there go to `./.data` instead of your real albums. That's handy for trying things out.

```bash
npm test        # checks the date math (monthsaries, albums, the exact 7 PM start)
npm run lint
npm run build
```

## Make it yours

- Names, the start date and the timezone are in [`src/lib/us.ts`](src/lib/us.ts).
- Colors (wheat, light brown, burgundy) and fonts are in [`src/app/globals.css`](src/app/globals.css).
- Every control is our own, in [`src/components/ui`](src/components/ui): buttons, text fields, the toggle switch, the picker sheet, and the calendar for dates and times. Icons come from [Lucide](https://lucide.dev). The Instagram image uses the same colors, in [`src/lib/collage.ts`](src/lib/collage.ts).

## How it's built

[Next.js](https://nextjs.org) 16 + Tailwind CSS, with sign-in, photos and data in [Supabase](https://supabase.com), hosted on [Vercel](https://vercel.com).

- `src/proxy.ts` keeps an owner's session fresh and turns visitors away from the owner-only pages. `src/lib/auth.ts` decides who counts as an owner.
- Photos are resized on the phone before uploading (max 2048px, plus a 640px thumbnail), so uploads are quick and the free 1 GB lasts for years.
- The Instagram image and the Wrapped summary card are drawn in the browser on a `<canvas>`, so there's no server cost.
- The Wrapped numbers are worked out in [`src/lib/wrapped.ts`](src/lib/wrapped.ts) (tested in `wrapped.test.ts`), and the story itself is in [`src/components/Wrapped.tsx`](src/components/Wrapped.tsx).
- All date math lives in [`src/lib/time.ts`](src/lib/time.ts), and [`src/lib/time.test.ts`](src/lib/time.test.ts) tests it.
