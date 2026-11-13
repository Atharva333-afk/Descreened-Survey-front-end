# Descreened Survey Dashboard

A dependency-free static dashboard that can be deployed to GitHub Pages, Netlify, Vercel, or any basic web host.

## Run locally

```bash
npm start
```

Then open `http://localhost:4173`.

## Project layout

- `index.html` — page structure
- `src/styles.css` — dashboard styles
- `src/app.js` — filters, charts, profile rendering, and interactions
- `public/data/dashboard-data.js` — modeled profile dataset and aggregate calculations
- `public/data/demo-summary.js` — static dashboard summary data

## Data note

The dashboard labels the rows as modeled profiles. Before public deployment, review the text and data-sharing permissions carefully: profile-level rows are loaded in the browser and can be accessed by every site visitor.
