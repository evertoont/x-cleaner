# X Cleaner

A Chrome extension to review and bulk-remove your own posts, replies, reposts and likes on X (formerly Twitter).

It reads what X already loads while you browse your profile, lists everything in a calm reading view, and lets you pick exactly what to remove: delete posts and replies, undo reposts, and remove likes.

> **Unofficial.** Not affiliated with X Corp. It uses the same internal web API the x.com site uses, which can change without notice. Automating actions on X may go against its Terms of Service. Use it on your own account and at your own risk. **Removals are permanent.**

## Features

- **Fetch** your posts, replies, reposts and likes from x.com (the X tab scrolls by itself).
- **Read and select** item by item, or select everything in a tab. The sidebar shows how many items are selected in each type.
- **Confirm with details**: the confirmation spells out what will happen, for example "Delete 12 posts, undo 1 repost, and remove 30 likes?".
- **Follow the progress** with a time estimate. You can stop at any time; anything not removed stays in the list.
- **Retry failures**: failed items stay in the list with the reason, and you can select them all at once.
- Waits automatically when X rate-limits requests.
- English and Portuguese, following your browser language.

## Install

There is no Chrome Web Store release. Build it from source:

1. Install [Node.js](https://nodejs.org) 20 or newer.
2. Clone this repository and run:

   ```bash
   npm install
   npm run build
   ```

3. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the `.output/chrome-mv3` folder.
4. Click the X Cleaner icon in the toolbar to open the dashboard.

To update, pull the latest code, run `npm run build` again and click the reload button on the extension card in `chrome://extensions`.

## Use

1. Log in to x.com in the same Chrome profile.
2. In the dashboard, under **Fetch from X**, check what to fetch and click **Fetch**. The x.com tab comes to the front, scrolls through the needed pages of your profile and then returns to the dashboard. Fetching never removes anything.
3. Review the items in each tab and select what you want to remove.
4. Click the remove button and confirm. Keep the dashboard and the x.com tab open until it finishes (about 3 seconds per item).

A new fetch replaces only the types you checked. A stopped fetch adds what it found to the list without removing anything else.

## Privacy

- Everything runs in your browser. There is no server, analytics or tracking.
- Fetched items are stored only in the extension's local storage (`chrome.storage.local`).
- The only network requests go to x.com, using the session you are already logged in with.

## Known limitations

- X may not load your oldest likes; this is a limitation of X itself.
- X changes its internal API from time to time. If fetching comes back empty, open **Technical details** under the toolbar to see what x.com sent, and open an issue with it.

## How it works

- **Fetching:** `entrypoints/x-page.content.ts` runs in the page context and forwards the GraphQL responses x.com loads by itself (`x.com/i/api/graphql/...` and `api.x.com/graphql/...`). The bridge (`entrypoints/x-bridge.content.ts`) scrolls the page until the timeline ends and `lib/timeline-parser.ts` turns the responses into items. The pages visited for each type are in `lib/capture-items.ts`.
- **Removing:** `lib/removal-request.ts` calls the internal mutations `DeleteTweet` (posts, replies and reposts) and `UnfavoriteTweet` (likes) with your logged-in session, one item at a time with a 2 to 3 second interval.
- **Dashboard:** `entrypoints/dashboard` drives the x.com tab and the removal queue.
- **Translations:** `lib/messages/en.ts` and `lib/messages/pt.ts`.

If X changes something internal, the places to adjust are the `queryId`s in `lib/removal-operations.ts` and the operation names in `lib/page-capture.ts`.

## Development

| Command | What it does |
|---|---|
| `npm run dev` | Starts WXT in development mode |
| `npm run build` | Builds the extension into `.output/chrome-mv3` |
| `npm run typecheck` | Type-checks with TypeScript |
| `npm run lint` | Lints with ESLint |
| `npm test` | Runs the tests (parser, removal responses, copy) |
