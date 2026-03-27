# Toronto Dogs & Cats Dashboard 🐶🐱

A lean, static dashboard visualizing licensed dog and cat data from the City of Toronto Open Data portal. Designed to run on GitHub Pages.

## Live Demo

Enable GitHub Pages (Settings → Pages → Deploy from branch `main`) and visit `https://<username>.github.io/dogsdogsdogs/`.

## Features

- **Summary cards** — total dogs, cats, pets, and postal areas
- **Choropleth map** — toggle between dog/cat/total density by FSA (Forward Sortation Area)
- **Top names charts** — most popular dog and cat names (2020–present)
- **Breed breakdown** — top 15 dog and cat breeds (2023–present)
- **Yearly trends** — licence counts by year

## Data Sources

| Dataset | URL |
|---------|-----|
| Licensed Dogs and Cats | https://open.toronto.ca/dataset/licensed-dogs-and-cats/ |
| Licensed Dog and Cat Names | https://open.toronto.ca/dataset/licensed-dog-and-cat-names/ |

## Refreshing Data

```bash
python fetch_data.py
```

This downloads the latest CSVs from Toronto Open Data and writes:
- `data/dashboard.json` — aggregated stats, names, breeds, yearly trends
- `data/toronto_fsa.geojson` — FSA boundaries with pet counts

A GitHub Actions workflow (`.github/workflows/refresh-data.yml`) runs automatically every Monday and commits updated data.

## Stack

- **Python 3** (stdlib only) — data fetch + processing
- **Leaflet** — interactive map
- **Chart.js** — charts
- **GitHub Pages** — hosting

No build step, no Node.js, no frameworks — just static HTML/CSS/JS.
