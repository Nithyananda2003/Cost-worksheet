# ADS Pricing Desk

A responsive exact-price lookup and cost worksheet generator for the ADS
footprint matrix, updated from `Updated cost sheet 9-17-2026.xlsx`.

## Worksheet workflow

1. Enter the order number.
2. Choose the state, county, service tier, and order type.
3. Open the worksheet preview.
4. Adjust the price or add online, abstractor, copy, and other costs.
   You can also edit the Product Type without changing the selected base price.
5. Review the automatic total and download the one-page PDF.

The date of search is filled automatically from the user's current date. The
downloaded worksheet follows the supplied DTNP Cost Worksheet layout on US
Letter paper.

Online T1/T2 prices start in Online Cost. Ground prices start in Abstractor
Cost, with Online Cost left blank. The first two cost labels always remain
Online Cost and Additional Online Cost. The Online/Ground row still shows
the selected fulfillment type in bold. Copy and other costs remain editable
and update the total automatically; the reference's $86 copy cost is an
order-specific example, not a default for every Ground order.

Worksheet table content uses one consistent 12-point Carlito font, with regular
values and bold table headers and Total Cost. The main worksheet headings retain
their original styling. Carlito is bundled under the SIL Open Font License and
embedded in PDFs, so local and Vercel downloads do not depend on Windows fonts or
a paid font service. The font copyright and licence are included in
`public/fonts/carlito/OFL.txt`.

## Deploy to Vercel

1. Extract this ZIP.
2. In Vercel, choose **Add New → Project** and import the extracted project through your Git provider, or run `npx vercel` from the extracted folder.
3. Keep the automatically detected **Next.js** framework preset and default build settings.
4. Before deploying, add these **Environment Variables** in Vercel project settings:
   - `AUTH_USERNAME`: the shared username
   - `AUTH_PASSWORD`: the shared password
   - `AUTH_SECRET`: a private random value used to sign login sessions
5. To create `AUTH_SECRET`, run:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

6. Deploy. If you add or change the variables later, redeploy the project.

The password and session secret are intentionally not included in this ZIP.

## Run locally

```bash
npm install
npm run test:data
npm run dev
```

Open `http://localhost:3000`.

For local login, copy `.env.example` to `.env.local`, then enter the username,
password, and generated secret before starting the server.

## Update pricing

Replace `data/pricing-data.json` with a newly normalized catalog that uses the
same schema, run `npm run test:data`, then redeploy. The data file is never served
as a public static asset; authenticated requests receive it through `/api/pricing`.

## Access protection

- Login credentials are checked only on the server.
- Successful login creates a signed, HTTP-only cookie that expires after 8 hours.
- The dashboard, pricing-data endpoint, and PDF-generation endpoint all reject
  unauthenticated access.
- Use HTTPS in production; Vercel enables it automatically.
