# Enovation Café Terrasse

A Next.js app-router ordering experience for Café Terrasse at Enovation Factory. It uses Supabase for menu/order data and Fapshi for payment flow.

## Design update

The customer-facing interface now follows the contemporary, editorial feel of Enovation Factory's official Café Terrasse page: warm neutral surfaces, charcoal typography, terracotta accents, generous spacing, an expressive hero section, scrollable category navigation, refined product cards, and a mobile-friendly cart and checkout sheet. Existing menu, order submission, and payment requests are preserved.

The public menu now selects `image_url` on the home page as well, and items without photos receive a branded visual placeholder. Admin pages reuse the same brand palette while retaining their existing management workflows.

## Run locally

1. Install dependencies with `npm install`.
2. Create a local `.env.local` file with your project credentials:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SECRET_KEY=
   FAPSHI_API_USER=
   FAPSHI_API_KEY=
   SITE_URL=http://localhost:3000
   ```

   Fill in the values from your own Supabase and Fapshi accounts. Keep `SUPABASE_SECRET_KEY` and Fapshi credentials server-side; do not commit `.env.local` or expose these values in client code.
3. Start the app with `npm run dev` and open `http://localhost:3000`.

## Relevant routes

- `/` — customer menu and table ordering
- `/admin/login` — admin authentication
- `/admin` — live kitchen orders
- `/admin/menu` — menu and category management

## Reference

The visual direction is inspired by the official [Enovation Factory Café Terrasse page](https://www.enovation-factory.com/cafe-bibliotheque/le-cafe-terrasse). The hero coffee image is loaded from the site's public CDN.
# enovation-cafe-redesigned
