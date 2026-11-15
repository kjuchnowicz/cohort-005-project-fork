# Research: free-tier in-app notification providers

Answers [issue #4](https://github.com/kjuchnowicz/cohort-005-project-fork/issues/4), a child of the map [#3 Wayfinder: in-app notifications](https://github.com/kjuchnowicz/cohort-005-project-fork/issues/3). It does not pick a provider; that decision belongs to #7.

- **Checked on:** 2026-11-15. Every pricing page and doc below was read on this date. Free tiers change often, so check again before you commit to one.
- **Constraint:** Cadence must stay free. It is a React Router + TypeScript + SQLite/Drizzle app with Tailwind/shadcn, run on localhost.
- **Sources:** official pricing pages and docs, npm registry metadata (`npm view`) and GitHub repo metadata (`gh api`). Where an official page did not state a fact, this note says "not stated" rather than guess.

## TL;DR

- Four hosted providers have a usable free tier with no credit card: **Knock**, **Novu Cloud**, **SuprSend** (10k messages or runs a month each) and **MagicBell** (1k deliveries a month). All four show their own branding on the free tier, except MagicBell, whose page doesn't say.
- **Courier**'s free Developer plan gives 10k sends a month, but its pricing page does not list Inbox as a free feature. Confirm in the dashboard before you rely on it.
- **Engagespot looks unhealthy.** Its marketing site (`engagespot.co`, including `/pricing`) returns HTTP 404. Its npm SDKs were last published in May 2025 (React) and November 2024 (Node). The free "Launch" tier (10k triggers a month) is known only from aggregator sites. Treat it as not viable.
- **Novu is the only option that can be self-hosted for free.** The core is MIT-licensed, with enterprise folders under a separate licence. But running it needs MongoDB, Redis, object storage and several services, which is heavy next to a single SQLite file.
- **None of the providers needs a public URL** for an in-app feed. The server SDK makes outbound HTTPS calls, and the browser opens an outbound WebSocket to the provider. A public URL only matters if you want provider-to-app webhooks, which an in-app feed doesn't need.
- **Self-built baseline:** a `notifications` table plus a loader and polling (or SSE) is about 1 to 2 days of work for a bell and feed with unread counts. It has no limits, no branding, no third-party account, and fits the ADR to use one SQLite file through Drizzle (`docs/adr/0006`).

## Comparison

| | Knock | Novu Cloud | MagicBell | SuprSend | Courier | Engagespot | Self-built |
|---|---|---|---|---|---|---|---|
| Free plan | Developer, $0 | Free, $0 | Builder, $0 | Free, $0 | Developer, free | "Launch" (aggregators only) | n/a |
| Free volume | 10k messages/mo; 500 guide recipients | 10k workflow runs/mo; unlimited subscribers; 5 workflows | 1k deliveries/mo; 1 project | 10k notifications/mo | 10k sends/mo | 10k event triggers/mo (unverified) | unlimited |
| MAU cap | none listed | none (unlimited subscribers) | not stated | none listed | not stated | none (unverified) | n/a |
| Retention | logs 30 days; feed unlimited, configurable | activity feed 24h | not stated | logs 30 days | not stated | not stated | yours |
| Branding on free | yes (Knock) | yes (removal is Pro) | not stated | yes, in the in-app feed | not stated | not stated | none |
| Card needed | no | no | not stated | no | not stated for free; needed to go past 10k | not stated | n/a |
| Over the limit | no hard cap; Knock contacts you to add billing | not stated | not stated | must upgrade | add card, move to Business at $0.005/send | n/a | n/a |
| Cheapest paid | Starter $250/mo | Pro $30/mo | Startup $249/mo | Essentials $100/mo | Business, pay as you go | Growth $250/mo (aggregators) | $0 |
| React UI | `@knocklabs/react`: `NotificationIconButton`, `NotificationFeedPopover`, plus hooks | `@novu/react`: `<Inbox/>` plus hooks (`useNotifications`) | `@magicbell/react`: `FloatingInbox`, `Inbox`, toasts; no headless hooks documented | `@suprsend/react`: drop-in components plus headless hooks | `@trycourier/courier-react` v9: prebuilt inbox, custom views or low-level APIs | `@engagespot/react-component` (last published 2025-05) | your own shadcn components |
| Tailwind/shadcn fit | headless hooks let you build your own shadcn UI; prebuilt styling not documented on the overview page | best documented: `appearance.elements` takes Tailwind classes; hooks also available | CSS variables, override class names, `unstyled` prop | headless hooks; theming options not detailed | `CourierInboxTheme`, or custom UI | n/a | native |
| Node SDK | `@knocklabs/node` (1.41.1, 2026-11) | `@novu/api` (3.19.1, 2026-09) | `magicbell-js` (`ProjectClient`) | `@suprsend/node-sdk` (1.15.1, 2026-05) | `@trycourier/courier` (10.0.0, 2026-10) | `@engagespot/node` (1.7.0, 2024-11) | Drizzle insert |
| Client auth | public key + RS256 user JWT ("enhanced security"; off by default, should be on in prod) | app id + `subscriberId`; optional HMAC-SHA256 `subscriberHash` | HS256 user JWT signed with project secret | public key + ES256 user JWT (enhanced security; off in Sandbox) | backend-minted JWT, `signIn({ userId, jwt })` | user JWT in secure mode (older versions: HMAC) | existing session cookie |
| Real-time | yes, WebSocket | yes, WebSocket (can be turned off) | yes ("Realtime" section in the JS client) | yes ("real-time updates"; transport not named) | yes, real-time on web and mobile | yes (claimed) | polling or SSE, which you build |
| Works on localhost, no public URL | yes | yes | yes | yes | yes | likely, but the product looks inactive | yes |
| Lock-in / self-host | proprietary SaaS; no self-host | MIT core can be self-hosted (Mongo, Redis, S3, several services) | proprietary SaaS | proprietary SaaS; no self-host mentioned | proprietary SaaS | proprietary SaaS | none |

## Per provider

### Knock

- **Free plan.** Developer, $0, "no credit card required". It includes 10,000 messages a month, 500 guide recipients and 500 agent credits. There is no hard cap: if you go over without billing set up, Knock contacts you. Logs are kept 30 days; feed retention is "unlimited but configurable". The free plan shows Knock branding, and removing it needs Starter at $250 a month. In-app feeds, prebuilt components and the Feed API are included. ([pricing](https://knock.app/pricing))
- **React.** `@knocklabs/react` ships `NotificationIconButton` (a bell with an unread count), `NotificationFeedPopover`, and a full set of hooks for building your own UI. `@knocklabs/react-notification-feed` is the deprecated older package. ([React overview](https://docs.knock.app/in-app-ui/react/overview))
- **Auth.** The browser uses the public API key. With enhanced security mode on, it also needs a user token: an RS256 JWT your backend signs, with `sub` set to the user id, passed as the `userToken` prop on `KnockProvider`. Without it, the public key can act as any user. The docs say to enable it in production; it isn't enforced automatically. ([security](https://docs.knock.app/in-app-ui/security-and-authentication))
- **Real-time.** The browser opens a WebSocket to Knock's managed real-time service. ([feeds overview](https://docs.knock.app/in-app-ui/feeds/overview))
- **Node.** `@knocklabs/node` 1.41.1, published 2026-11-10 (npm).

### Novu (Cloud, and self-hosted)

- **Free plan.** $0, no credit card. It includes 10,000 workflow runs a month, unlimited subscribers, up to 5 workflows, 2 environments, 3 team members and 60 events a second. The activity feed keeps 24 hours. In-app is an included channel. Removing Novu branding is a Pro feature (Pro starts at $30 a month). ([pricing](https://novu.co/pricing))
- **React.** `@novu/react` exports `<Inbox />` and hooks such as `useNotifications`. The hook list updates in real time over a WebSocket unless you set `realtime={false}` on `NovuProvider`. ([useNotifications](https://docs.novu.co/platform/sdks/react/hooks/use-notifications))
- **Styling.** The `appearance` prop takes `baseTheme`, `variables`, `elements`, `icons` and `animations`. `elements` accepts Tailwind class strings, or callbacks that return classes. This is the best Tailwind story of any provider here. ([styling](https://docs.novu.co/platform/inbox/configuration/styling))
- **Auth.** The Inbox takes `applicationIdentifier` and `subscriberId`. For production you turn on HMAC: the server computes `HMAC-SHA256(secretKey, subscriberId)` and passes it as `subscriberHash`. Once HMAC is enabled, an Inbox without the hash won't load. ([prepare for production](https://docs.novu.co/platform/inbox/prepare-for-production))
- **Node.** `@novu/api` 3.19.1, published 2026-09 (npm).
- **Self-host.** The `novuhq/novu` repo contains `LICENSE-MIT` alongside `LICENSE-ENTERPRISE`, `EE-PACKAGES-LICENSE` and an `enterprise/` folder (GitHub, checked via `gh api`). So the core is MIT, and enterprise packages are under a commercial licence. The self-hosting docs say some cloud-only features are not available self-hosted. Even the single-VM setup needs 4 vCPU, 8 GB RAM, MongoDB, Redis with AOF, and object storage. That is a lot of infrastructure for a local SQLite app. ([self-hosting](https://docs.novu.co/community/self-hosting-novu/overview))

### MagicBell

- **Free plan.** Builder, $0. It includes 1,000 deliveries a month, 1 project, all integrations, and unlimited team members and users. The page doesn't state retention, branding or a card requirement. The next plan is Startup at $249 a month. ([pricing](https://www.magicbell.com/pricing))
- **React.** `@magicbell/react` provides `FloatingInbox`, `Inbox`, `InlineNotification`, `ToastContainer`, `UserPreferences` and others. You style them with a stylesheet per component, CSS variables (`--magicbell-*`), class-name overrides, and an `unstyled` prop on buttons. No headless hooks are documented. ([React docs](https://www.magicbell.com/docs/libraries/magicbell-react))
- **Auth.** A user JWT, HS256, signed on your backend with the project Secret Key. The claims are `user_email` and/or `user_external_id`, plus `api_key`. ([user auth](https://www.magicbell.com/docs/api/authentication/user))
- **Node and real-time.** `magicbell-js` has a `ProjectClient` with `broadcasts.createBroadcast(...)`, and the same package has a "Realtime" section. ([JS client](https://www.magicbell.com/docs/libraries/magicbell-js))
- **Caveat.** 1k deliveries a month is the smallest free allowance here.

### SuprSend

- **Free plan.** $0, no credit card. It includes 10,000 notifications a month and 30-day logs. The in-app feed shows SuprSend branding. Past 10k you must move to a paid plan; Essentials is $100 a month and removes the branding. ([pricing](https://www.suprsend.com/pricing))
- **React.** `@suprsend/react` offers drop-in components and headless hooks. The older `@suprsend/react-inbox` has reached end of support. ([React inbox](https://docs.suprsend.com/docs/inbox-react), [inbox overview](https://docs.suprsend.com/docs/inbox-overview))
- **Auth.** A public key, the user's `distinct_id`, and an ES256 user JWT your server signs (`entity_type: "subscriber"`, `entity_id` = the distinct id). Token checks only run with Enhanced Security Mode on, and it is off in Sandbox, so a broken token can look fine there. HMAC is now used only by the mobile SDKs. ([client authentication](https://docs.suprsend.com/docs/client-authentication), [React SDK](https://docs.suprsend.com/docs/react-sdk))
- **Node.** `@suprsend/node-sdk` 1.15.1 (npm).

### Courier

- **Free plan.** Developer, free. It includes 10,000 sends a month, journeys and broadcasts, SDKs, CLI and MCP server. Inbox is **not** listed among the free plan's features, and the page doesn't state branding or retention. One template delivered across several channels counts as one send. Past 10k you add a card and move to Business at $0.005 a send. ([pricing](https://www.courier.com/pricing))
- **React.** `@trycourier/courier-react` v9 (`-17` for React 17), and `@trycourier/courier-ui-inbox` as Web Components. You can theme the prebuilt inbox with `CourierInboxTheme`, supply your own views, or build on the low-level APIs. The older `@trycourier/react-inbox` packages are deprecated. ([Inbox overview](https://www.courier.com/docs/platform/inbox/inbox-overview))
- **Auth.** Your backend mints a JWT with the Courier API key, and the client calls `signIn({ userId, jwt })`.
- **Real-time.** Messages arrive in real time, and read or archived state syncs across devices.
- **Node.** `@trycourier/courier` 10.0.0 (npm).

### Engagespot (not viable)

- **Site.** On 2026-11-15, `https://engagespot.co`, `/pricing` and `www.engagespot.co/pricing` all returned HTTP 404 (curl and WebFetch). The docs site `docs.engagespot.co` returned 200, but only as an empty Docusaurus shell.
- **Pricing.** The only free-tier details come from aggregator sites, not first-party pages: a "Launch – Free Forever" plan with 10k event triggers a month and 2 team members, and Growth at $250 a month. They are unverified.
- **SDKs.** `@engagespot/react-component` 3.0.1 was last published 2025-05-09 and `@engagespot/node` 1.7.0 on 2024-11-06 (npm). The `engagespot` GitHub org's newest push is 2025-01.
- **Auth.** Docs mirrored at `es-docs-prod.netlify.app` describe a "Secure Auth Mode" user JWT that replaced the older HMAC `userSignature`.
- **Conclusion.** Given the dead marketing site and stale SDKs, leave it off the shortlist.

### Other free contenders considered

- **Novu self-hosted** is the only truly free, unlimited hosted-style option. It is covered above and is heavy to run.
- No other provider with a free in-app feed beat these on free volume.

## Localhost and public URLs

Every hosted option works the same way:

1. The Cadence server calls the provider's REST API with a secret key to trigger a notification. That is an outbound call.
2. The browser loads the provider's React component, which talks to the provider's API and WebSocket. That is also outbound.

Nothing has to reach *into* localhost, so no tunnel (ngrok etc.) is needed. A public URL would only be needed for webhooks from the provider back to the app, such as delivery status, and an in-app feed doesn't need those.

The real localhost cost is **secrets and identity**. You need:

- an account and API keys in `.env`;
- a stable external user id. Cadence's `users.id` works, including the DevUI user switcher;
- a server route or loader that mints the user token or HMAC for the current session user.

## Self-built baseline (own table + polling/SSE)

This is a rough estimate from Cadence's current shape: Drizzle schema in `app/db/schema.ts`, React Router loaders and actions, and session-based users.

| Piece | Work |
|---|---|
| `notifications` table (`id`, `userId`, `type`, `title`, `body`, `link`, `createdAt`, `readAt`) and migration | about 1 hour, using the `database-migrations` skill |
| `notify(userId, …)` helper called from existing actions (purchase, refund, comment etc.) | about 1 to 2 hours |
| `GET` resource route for unread count and recent items, and an action to mark read / mark all read | about 2 hours |
| Bell and dropdown in the app layout with shadcn `Popover`, `Badge` and `ScrollArea` | about 2 to 4 hours |
| Updates: polling with `useRevalidator` or `useFetcher` every N seconds, which is trivial; or an SSE resource route streaming from an in-process event emitter, about half a day more | 1 hour to half a day |
| Tests (Vitest) for the helper and routes | about 2 hours |

The total is about **1 to 2 days**, with no limits, no branding, no third-party account or secrets, and no extra auth (the session cookie is enough). It keeps the "one SQLite file through Drizzle" decision (ADR 0006).

What you give up:

- per-user preferences, digests and batching;
- cross-channel routing (email, push);
- a hosted dashboard.

SSE on a single Node process is fine locally, but needs a shared pub/sub layer if Cadence ever runs on more than one instance.

## Shortlist for the decision in #7

1. **Self-built** (table + polling, with SSE as an upgrade). It is free forever, fits the stack and is fully shadcn-native.
2. **Novu Cloud free.** It has the best Tailwind story (`appearance.elements` classes, plus hooks), HMAC auth that's simple to set up, 10k runs a month, unlimited subscribers and an MIT self-host escape hatch. Watch the branding and the 24h activity retention.
3. **Knock Developer.** It has mature prebuilt components and hooks, unlimited feed retention, 10k messages a month and no hard cap. Watch the branding, the RS256 token setup for enhanced security, and the steep jump to $250 a month.
4. **SuprSend free** is a reasonable alternative to Knock: 10k a month, headless hooks, and branding on the feed.

Excluded:

- **MagicBell**: only 1k a month free.
- **Courier**: Inbox isn't listed on the free plan.
- **Engagespot**: the site is down and the SDKs are stale.
