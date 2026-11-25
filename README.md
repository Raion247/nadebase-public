# Nadebase — Frontend

The web frontend for [nadebase.com](https://nadebase.com), a CS2 lineup database. Players can browse, save and upload smoke, flash, HE and molotov lineups. They can also build personal collections, track their utility in their own matches, complete challenges and browse lineups used by pro players.

This repository is a **code showcase** of the production frontend, published so the code can be read. It is not meant to be cloned and run. The API, database, payments and demo parsing are in a separate private backend, and environment configuration is left out on purpose, so the app doesn't work on its own from this repo. To see it running, visit [nadebase.com](https://nadebase.com).

## Tech stack

- [React 19](https://react.dev) + [React Router 7](https://reactrouter.com)
- [Vite](https://vite.dev) for the dev server and builds
- [Tailwind CSS 4](https://tailwindcss.com)
- [Motion](https://motion.dev) and AOS for animation
- `react-easy-crop` / `react-image-crop` for cropping lineup screenshots
- Steam OpenID sign-in, with Stripe and PayPal for subscriptions (all handled by the backend)

## Project layout

```
nadefront/
├── public/            static assets, config.json (maintenance-mode flag)
├── src/
│   ├── main.jsx       entry point: providers (Helmet, Auth, Theme)
│   ├── App.jsx        route table
│   ├── pages/         one file per route
│   ├── C/             components (short names; see the glossary below)
│   └── hooks/         small hooks (short names; see the glossary below)
└── changelog.txt
```

## Pages (`src/pages`)

| Route | File | What it is |
| --- | --- | --- |
| `/` | `home.jsx` | Landing page |
| `/nades` | `nades.jsx` | Lineup browser with filters |
| `/collections` | `collections.jsx` | Map-based collection editor and lineup upload |
| `/mycollections` | `mycollections.jsx` | The user's saved collections |
| `/challenges` | `challenges.jsx` | Daily/weekly utility challenges and streaks |
| `/matches`, `/matches/:matchId` | `matches.jsx`, `C/UMD.jsx` | The user's analysed matches and match detail |
| `/profile/*` | `profile.jsx` | Profile: uploads, likes, stats, settings, transactions |
| `/upgrade` | `upgrade.jsx` | Subscription plans |
| `/pro`, `/pro/...` | `pro*.jsx` | Pro lineups by tournament, team and player |
| `/privacy-policy`, `/terms-of-service` | `privacy.jsx`, `terms.jsx` | Legal pages |
| — | `maintenance.jsx` | Shown when maintenance mode is on |
| `*` | `notfound.jsx` | 404 |

## Glossary of short names

Components and hooks use short abbreviated file names. Where the code states the full name (such as `AuthProvider` or `CookieBanner`), it's listed as is. The other full names are descriptive readings of what each file does.

### Components (`src/C`)

#### App shell and global state

| Short | Full name | What it does |
| --- | --- | --- |
| `AC` | Auth Context | React context that holds the user, subscription/payment info and auth helpers |
| `AP` | Auth Provider | Fills `AC`: checks the session, subscription status and saved collections, and handles logout |
| `TC` | Theme Context | `ThemeProvider` / `useTheme`: light or dark theme, saved in `localStorage` |
| `L` | Layout | Page shell: navbar, scroll reset, page tracking and the routed page |
| `N` | Navbar | Top navigation, Steam login popup, profile menu and mobile menu |
| `F` | Footer | Copyright, legal links and contact |
| `MR` | Maintenance Redirect | Wraps the app; reads `config.json` and handles maintenance-mode access |
| `MD` | Mobile Detect | Helper that returns `true` on phones and touch-only devices |
| `CB` | Cookie Banner | Analytics consent banner |
| `noti` | Notifications | `useNotification` hook plus toast rendering |

#### Lineup browsing (`/nades`)

| Short | Full name | What it does |
| --- | --- | --- |
| `FM` | Filter Manager | Holds the filter state and loads filter options; renders `FL` + `IL` |
| `FL` | Filter List | The filter controls: map, side, utility type and so on |
| `IL` | Item (Lineup) List | Paged lineup grid with likes, image switching and level badges |
| `LP` | Lineup Popup | Full-size lineup modal with both images and descriptions |
| `TT` | Throw Types | Icon set for throw inputs (LMB, RMB, MMB, JUMP) |

#### Collections and uploads (`/collections`)

| Short | Full name | What it does |
| --- | --- | --- |
| `IC` | Image Cropper | Upload flow: select and crop screenshots, enforce upload limits |
| `UF` | Upload Form | Lineup details form: map, side, throw input, movement, description |
| `UL` | Upload Limits | Card showing remaining daily, monthly and private uploads |
| `UP` | Upgrade Popup | Plan picker modal opened from collections (PayPal / Stripe) |
| `NC` | New Collection | "Name your collection" modal |
| `SC` | Save Collection | Save-collection button and logic |
| `D` | Demo/Video Dialog | Modal that autoplays a tutorial video |

#### Home / landing page

| Short | Full name | What it does |
| --- | --- | --- |
| `CBX` | Chat Box (hero) | Hero section with the animated chat-style intro |
| `CD` | Collections Demo | Interactive movable and resizable block showing off collections |
| `SD` | Showcase Display | Top 3 most-liked lineups |
| `LR` | Level Rewards | "Level up and unlock more" section |
| `SU` | Subscribe | Styled subscribe button that links to the upgrade page |
| `CS` | Challenges Section | Active challenges, with a link to each lineup |

#### Profile (`/profile`)

| Short | Full name | What it does |
| --- | --- | --- |
| `PH` | Profile Header | Avatar, name (with name colour), level and tabs |
| `UU` | User Uploads | The user's uploads, both approved and pending; delete |
| `ULI` | User Liked Items | Liked lineups; unlike and favourite |
| `US` | User Stats | Account and utility statistics |
| `CH` | Challenge History | Past challenges |
| `CZ` | Colour customiZer | Choose a name colour |
| `S` | Settings | Profile settings, subscription management, account deletion |
| `TR` | Transactions | Payment history, with purchase and cancellation status |

#### Levels, streaks and cosmetics

| Short | Full name | What it does |
| --- | --- | --- |
| `LM` | Level Meter | Level and XP progress bar |
| `LC` | Level Colour | `getLevelRGB(level)`: colour for a level badge |
| `ST` | Streak Tracker | Streak rewards display (challenges and matches pages) |
| `UC` | Username Colours | `NAME_COLORS` list and `getNameStyle(colorId)` |

#### Matches

| Short | Full name | What it does |
| --- | --- | --- |
| `UMD` | User Match Detail | Single analysed match (`/matches/:matchId`) |
| `MT` | Match Tile/summary | Match header: utility thrown, matched lineups, accuracy |

#### Pro scene

| Short | Full name | What it does |
| --- | --- | --- |
| `PC` | Pro (lineup) Card | One pro lineup card, linking to the player and team |
| `PF` | Pro Filters | Compact filter row for the pro pages |
| `proHelpers` | — | `slugify`, map and utility lists, type labels for the pro pages |

#### Upgrade and legal

| Short | Full name | What it does |
| --- | --- | --- |
| `U` | Upgrade | Upgrade page content and Stripe checkout |
| `P` | Privacy | Privacy policy text |
| `TOS` | Terms of Service | Terms text |

### Hooks (`src/hooks`)

| Short | Full name | What it does |
| --- | --- | --- |
| `A` | Analytics | Loads Google Analytics after cookie consent |
| `PT` | Page Tracking | Sends a page view on every route change |
| `ST` | Scroll to Top | Scrolls to the top when the route changes |
| `UA` | Use Auth | `useAuth()`: reads `AC` |

> Note: `ST` exists both as a component (Streak Tracker) and as a hook (Scroll to Top).

## License

**All rights reserved.** This code is published for viewing only. It may not be copied, modified, redistributed or used in any other project without written permission. See [LICENSE](nadefront/LICENSE).
