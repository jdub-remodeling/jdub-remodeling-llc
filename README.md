# J-Dub Remodeling LLC website

Marketing website for J-Dub Remodeling LLC (Justin Robson). Static site built with [Eleventy](https://www.11ty.dev/), hosted on Netlify, with the quote form handled by Netlify Forms.

- No database, accounts, or admin system. All content lives in this repository.
- Business details and integration settings: `src/_data/site.js`
- Before-and-after projects: `src/_data/projects.json` plus photos in `src/project-photos/`
- Original brand images (not published): `brand-source/`

## Working on the site

Requires Node.js 20 or newer.

```bash
npm install
npm start          # local preview at http://localhost:8080
npm run check      # build and check every page for broken links, missing metadata, leftover test text
npm run build      # production build into _site/
npm run brand      # regenerate logo, favicon, and social image from brand-source/logo.jpg
```

Every push to the `main` branch on GitHub is built and published by Netlify automatically once the repo is connected.

The local preview cannot receive form submissions. The form shows an error there by design; test real submissions on the Netlify site.

## Editing business details

Open `src/_data/site.js`. Everything public comes from this file:

| Setting | What it controls |
| --- | --- |
| `contact` | Name, phone (display and `+1` format), email shown everywhere |
| `serviceArea` | Cities shown in the footer, contact page, and search data. Empty hides it. |
| `about.portrait`, `about.bio` | Portrait file in `src/assets/img/` and bio paragraphs on the About page |
| `links.googleBusinessProfile`, `links.facebook` | Footer links and search data. Empty hides them. |
| `integrations.ga4MeasurementId` | Google Analytics. Empty means Analytics is never loaded. |
| `integrations.googleSiteVerification` | Search Console HTML-tag verification value |
| `payments` | Square "Pay Your Invoice" page (see below) |

To switch to a business-domain email later, change `contact.email` and push. Nothing else needs editing.

## Adding before-and-after projects

The Before & After page stays in the top menu. Until a complete project exists, that page explains that photos are posted as jobs finish. The homepage preview appears once at least one complete project exists.

1. Create a folder for the project, for example `src/project-photos/smith-kitchen/`.
2. Add the two photos, for example `before.jpg` and `after.jpg`. Use real photos of Justin's own work only. Large phone photos are fine; the build resizes and compresses them automatically. Landscape photos work best.
3. Add an entry to `src/_data/projects.json`:

```json
[
  {
    "title": "Kitchen refresh",
    "category": "kitchens",
    "description": "One or two sentences about what changed.",
    "location": "Optional, e.g. a city name",
    "featured": true,
    "before": { "src": "smith-kitchen/before.jpg", "alt": "Kitchen before remodel with dated cabinets" },
    "after": { "src": "smith-kitchen/after.jpg", "alt": "Same kitchen after remodel with new cabinets" }
  }
]
```

- `category` must be `kitchens`, `bathrooms`, or `other`. Filter buttons appear for categories in use.
- `alt` text is required for both photos. Describe what the photo shows.
- `featured: true` puts the project on the homepage (up to three).
- `published: false` hides a project without deleting it.
- `location` should be general (a city), never a customer's street address. Get the homeowner's permission before posting photos of their home.

4. Run `npm run check`. Any project with a missing photo or missing alt text is skipped and named in the output.
5. Commit and push. Netlify publishes it within a minute or two.

## Integrations

### Quote form (Netlify Forms)

The form at `/contact/` is a Netlify Form named `quote` with a honeypot spam trap. Netlify also runs its own spam filtering. Submissions are stored in Netlify under **Forms**.

After connecting the site in Netlify:

1. **Forms**: enable form detection if Netlify asks, then trigger a new deploy.
2. **Forms > quote > Settings & usage > Form notifications**: add an **Email notification** to `JdubRemodelingLLC@Yahoo.com` (or Justin's business email).
3. Send a test request from the live site and confirm it appears in Netlify and in the inbox. Delete the test entry afterward.

The form only shows a success message after Netlify accepts the submission. Netlify's free plan includes a monthly submission allowance; check the current limits on Netlify's pricing page.

### Google Analytics 4

1. Justin creates a GA4 property in his own Google account and copies the Measurement ID (`G-XXXXXXXXXX`).
2. Either put it in `integrations.ga4MeasurementId` in `src/_data/site.js`, or set a `GA4_MEASUREMENT_ID` environment variable in Netlify (**Site configuration > Environment variables**) and redeploy.
3. Analytics loads only after a visitor chooses **Allow analytics** in the cookie banner. The banner, the footer "Cookie settings" link, and the privacy text appear automatically once the ID is set.

Events sent (no names, emails, phone numbers, or project text are ever sent):

| Event | When |
| --- | --- |
| `generate_lead` | Quote form accepted by Netlify |
| `click_to_call`, `click_to_text`, `click_to_email` | Contact link tapped |
| `invoice_payment_link_click` | Square link tapped (this is a click, not a confirmed payment) |

In GA4, mark `generate_lead` as a key event.

### Google Search Console

Use one of:

- **DNS (recommended once the domain is connected):** add a Domain property and the TXT record Google provides at the DNS provider.
- **HTML tag:** copy only the `content` value into `integrations.googleSiteVerification` (or the `GOOGLE_SITE_VERIFICATION` environment variable) and redeploy.

Then submit `https://jdubremodelingllc.com/sitemap.xml`.

Search engines are blocked (`robots.txt` and `noindex`) on everything except Netlify's production deploy, so previews and local builds are never indexed.

### Google Business Profile

Once Justin's profile is verified, put its public URL in `links.googleBusinessProfile`. It is linked in the footer and the structured business data. Reviews stay on Google; this site does not copy or display reviews.

### Square invoices

Invoices, payments, and payment records stay in Square. This site never collects card or bank details.

- Justin creates his own Square account, connects his bank account, and sends invoices from Square. Each invoice email or text contains its own secure payment link. Square's processing fees, and any subscription fees, are separate from website hosting.
- The optional **Pay Your Invoice** page explains this to customers. It stays hidden until all three settings in `payments` are filled in: `enabled: true`, `verified: true`, and a `squareUrl` on a Square domain (https only) that Justin has opened and confirmed is correct.
- Do not use a generic Square checkout or payment link for invoices; customers should pay from the link in their own invoice so payments match the right invoice.

## Domain

Intended domain: `jdubremodelingllc.com` (ownership still to be confirmed).

1. Netlify: **Domain management > Add a domain**, enter `jdubremodelingllc.com`, and set it as primary.
2. Point DNS as Netlify instructs. The simplest is to keep DNS at the current registrar and add the records Netlify lists (an `A`/`ALIAS` record for the root and a `CNAME` for `www`). Moving DNS to Netlify is also possible.
3. **Keep any existing email records** (`MX`, `TXT`/SPF, DKIM, DMARC). Changing website records must not remove them.
4. Netlify issues the HTTPS certificate automatically.

Canonical links, the sitemap, and social sharing tags use Netlify's primary domain automatically, so nothing in the code changes when the domain is connected. To force a specific address, set the `SITE_URL` environment variable.

Netlify does not provide email inboxes. A business mailbox (for example `justin@jdubremodelingllc.com`) would come from a provider such as Google Workspace or Microsoft 365, set up separately using that provider's DNS records.

## Logo

The site uses a crop of the logo from a photo of the business card (`brand-source/logo.jpg`). It reads well on screen, but it is a photo, not original artwork. If Justin has the original logo file (vector `.ai`, `.eps`, `.svg`, `.pdf`, or a high-resolution `.png`), replace `brand-source/logo.jpg` with it and run `npm run brand`.

## Hosting and costs

The site is designed to fit within Netlify's free plan for a small business site: static pages, no server functions, no paid add-ons. Free-plan allowances (bandwidth, build minutes, form submissions) are set by Netlify and can change; check Netlify's pricing page. No paid Netlify features are enabled.

## Handoff checklist

- [ ] **Domain**: confirm Justin owns `jdubremodelingllc.com`, connect it in Netlify, keep existing email DNS records, confirm HTTPS.
- [ ] **Project photos and logo**: collect real before-and-after photos with homeowner permission; add them as described above. Ask for the original logo file.
- [ ] **Business details**: confirm service area, any bio details, and a portrait if Justin wants one; update `src/_data/site.js`.
- [ ] **Quote-form notifications**: enable form detection, add the email notification, send and confirm a test request.
- [ ] **Google Analytics and Search Console**: create both under Justin's Google account; add the Measurement ID; verify the domain; submit the sitemap; mark `generate_lead` as a key event.
- [ ] **Google Business Profile**: create or claim and verify; add the URL to `links.googleBusinessProfile`.
- [ ] **Square invoicing**: Justin opens his own Square account and connects his bank. Only turn on the Pay page after the Square URL is confirmed.
- [ ] **Business email (optional)**: set up a mailbox with a provider like Google Workspace or Microsoft 365; then change `contact.email`.
- [ ] **Ownership and billing**: transfer the GitHub repository (or the `jdub-remodeling` organization) and the Netlify site to Justin's accounts when he's ready, with billing on his own payment method. Netlify supports transferring a site to another team; GitHub supports transferring repository or organization ownership. Nothing is transferred automatically.
- [ ] **Future updates**: edits are made in this repository and pushed to `main`; Netlify publishes automatically.
