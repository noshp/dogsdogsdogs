"""
Toronto Licensed Dogs & Cats — Data Fetcher
Pulls data from Toronto Open Data and generates JSON for the dashboard.
Run: python fetch_data.py
"""

import csv
import json
import io
import urllib.request
from collections import Counter, defaultdict

# Toronto Open Data URLs
DOGS_CATS_URL = (
    "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/"
    "ce295a71-4c58-40e9-8cad-087f4b3d1321/resource/"
    "1a273925-a7b3-4311-a8ed-6f67168a1393/download/"
    "Licensed%20Dogs%20and%20Cats.csv"
)
NAMES_URL = (
    "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/"
    "37b2915c-f291-4b0e-bdd4-d6ccb070119a/resource/"
    "cad71142-964a-4b2d-a86c-d34b5d2a5369/download/"
    "Licensed%20Dog%20and%20Cat%20Names%20Since%202020.csv"
)
GEOJSON_PATH = "petsbyfsa_toronto.geojson"


def fetch_csv(url):
    """Download a CSV from a URL and return a list of dicts."""
    print(f"Fetching {url[:80]}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        text = resp.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return list(reader)


def process_licences(rows):
    """Process the Licensed Dogs and Cats dataset."""
    fsa_counts = defaultdict(lambda: {"dogs": 0, "cats": 0})
    breed_counts = {"DOG": Counter(), "CAT": Counter()}
    yearly = defaultdict(lambda: {"dogs": 0, "cats": 0})
    total_dogs = 0
    total_cats = 0

    for row in rows:
        animal = row.get("ANIMAL_TYPE", "").strip().upper()
        fsa = row.get("FSA", "").strip().upper()
        breed = row.get("PRIMARY_BREED", "").strip().title()
        year = row.get("Year", "").strip()

        if animal == "DOG":
            total_dogs += 1
            fsa_counts[fsa]["dogs"] += 1
            breed_counts["DOG"][breed] += 1
            yearly[year]["dogs"] += 1
        elif animal == "CAT":
            total_cats += 1
            fsa_counts[fsa]["cats"] += 1
            breed_counts["CAT"][breed] += 1
            yearly[year]["cats"] += 1

    # Top 15 breeds
    top_dog_breeds = [
        {"breed": b, "count": c}
        for b, c in breed_counts["DOG"].most_common(15)
    ]
    top_cat_breeds = [
        {"breed": b, "count": c}
        for b, c in breed_counts["CAT"].most_common(15)
    ]

    # Yearly trends sorted
    yearly_sorted = sorted(yearly.items())
    yearly_data = {
        "years": [y for y, _ in yearly_sorted],
        "dogs": [v["dogs"] for _, v in yearly_sorted],
        "cats": [v["cats"] for _, v in yearly_sorted],
    }

    return {
        "fsa_counts": dict(fsa_counts),
        "top_dog_breeds": top_dog_breeds,
        "top_cat_breeds": top_cat_breeds,
        "yearly": yearly_data,
        "total_dogs": total_dogs,
        "total_cats": total_cats,
    }


def process_names(rows):
    """Process the Licensed Dog and Cat Names dataset."""
    dog_names = defaultdict(lambda: defaultdict(int))
    cat_names = defaultdict(lambda: defaultdict(int))

    for row in rows:
        animal = row.get("ANIMAL_TYPE", "").strip().upper()
        name = row.get("ANIMAL_NAME", "").strip().title()
        year = row.get("Year", "").strip()
        try:
            count = int(row.get("AnimalCnt", "0").replace(",", ""))
        except ValueError:
            count = 0

        if animal == "DOG":
            dog_names[year][name] += count
        elif animal == "CAT":
            cat_names[year][name] += count

    # Aggregate across all years
    all_dog = Counter()
    all_cat = Counter()
    for year_names in dog_names.values():
        all_dog.update(year_names)
    for year_names in cat_names.values():
        all_cat.update(year_names)

    # Top 20 names overall
    top_dog_names = [{"name": n, "count": c} for n, c in all_dog.most_common(20)]
    top_cat_names = [{"name": n, "count": c} for n, c in all_cat.most_common(20)]

    # Yearly top 10 names
    yearly_dog = {}
    for year, names in sorted(dog_names.items()):
        yearly_dog[year] = [
            {"name": n, "count": c}
            for n, c in sorted(names.items(), key=lambda x: -x[1])[:10]
        ]

    yearly_cat = {}
    for year, names in sorted(cat_names.items()):
        yearly_cat[year] = [
            {"name": n, "count": c}
            for n, c in sorted(names.items(), key=lambda x: -x[1])[:10]
        ]

    return {
        "top_dog_names": top_dog_names,
        "top_cat_names": top_cat_names,
        "yearly_dog_names": yearly_dog,
        "yearly_cat_names": yearly_cat,
    }


def build_geojson(fsa_counts):
    """Merge pet counts into existing FSA boundary GeoJSON."""
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        geo = json.load(f)

    for feature in geo["features"]:
        fsa = feature["properties"]["CFSAUID"]
        counts = fsa_counts.get(fsa, {"dogs": 0, "cats": 0})
        # Keep only what we need
        feature["properties"] = {
            "fsa": fsa,
            "dogs": counts["dogs"],
            "cats": counts["cats"],
            "total": counts["dogs"] + counts["cats"],
        }

    return geo


def main():
    # Fetch data
    licence_rows = fetch_csv(DOGS_CATS_URL)
    name_rows = fetch_csv(NAMES_URL)

    print(f"Licence records: {len(licence_rows)}")
    print(f"Name records: {len(name_rows)}")

    # Process
    licence_data = process_licences(licence_rows)
    name_data = process_names(name_rows)

    # Build enriched GeoJSON
    geojson = build_geojson(licence_data["fsa_counts"])

    # Combine into a single dashboard data file
    dashboard = {
        "summary": {
            "total_dogs": licence_data["total_dogs"],
            "total_cats": licence_data["total_cats"],
            "total_pets": licence_data["total_dogs"] + licence_data["total_cats"],
            "fsa_count": len(licence_data["fsa_counts"]),
        },
        "top_dog_breeds": licence_data["top_dog_breeds"],
        "top_cat_breeds": licence_data["top_cat_breeds"],
        "yearly": licence_data["yearly"],
        "top_dog_names": name_data["top_dog_names"],
        "top_cat_names": name_data["top_cat_names"],
        "yearly_dog_names": name_data["yearly_dog_names"],
        "yearly_cat_names": name_data["yearly_cat_names"],
    }

    # Write outputs
    with open("data/dashboard.json", "w", encoding="utf-8") as f:
        json.dump(dashboard, f, separators=(",", ":"))
    print("Wrote data/dashboard.json")

    with open("data/toronto_fsa.geojson", "w", encoding="utf-8") as f:
        json.dump(geojson, f, separators=(",", ":"))
    print("Wrote data/toronto_fsa.geojson")

    print("Done!")


if __name__ == "__main__":
    main()
