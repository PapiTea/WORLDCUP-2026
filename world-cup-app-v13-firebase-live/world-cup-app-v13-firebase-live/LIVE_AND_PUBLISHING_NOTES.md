# Live upkeep and publishing notes

## What has been updated
- Added all 48 World Cup 2026 teams across Groups A-L.
- Added the visible group-stage match list used by the app schedule.
- Added a custom Iran flag image at `public/flags/iran.png` and wired Iran to use it instead of the emoji flag.

## Free beginner-friendly publishing
Use **GitHub + Vercel**:
1. Create a free GitHub account and upload this project to a repository.
2. Create a free Vercel account.
3. Import the GitHub repository into Vercel.
4. Framework preset should be **Next.js**.
5. Click **Deploy**.

You will get a public link that works on phones, tablets and computers.

## Making it truly live
A fully live app needs a shared database, otherwise each person only sees their own local version.

Recommended free setup:
- **Vercel**: hosts the web app.
- **Supabase free tier** or **Firebase Spark/free tier**: stores users, predictions, pools, results and leaderboard.

For the first public version, the easiest live-upkeep method is:
- Add an **Admin Results** screen.
- Admin manually enters real scores after each match.
- The app recalculates points and leaderboard from the database.

A live sports API can automate results, but most reliable ones are paid or limited, so manual admin updates are the safest free option.
