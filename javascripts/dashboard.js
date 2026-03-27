/* Toronto Dogs & Cats Dashboard — Main JS */
(async function () {
    "use strict";

    // ── Load data ──────────────────────────────────────────────
    const [data, geo] = await Promise.all([
        fetch("data/dashboard.json").then((r) => r.json()),
        fetch("data/toronto_fsa.geojson").then((r) => r.json()),
    ]);

    // ── Summary cards ──────────────────────────────────────────
    const fmt = (n) => n.toLocaleString();
    document.getElementById("total-dogs").textContent = fmt(data.summary.total_dogs);
    document.getElementById("total-cats").textContent = fmt(data.summary.total_cats);
    document.getElementById("total-pets").textContent = fmt(data.summary.total_pets);
    document.getElementById("fsa-count").textContent = fmt(data.summary.fsa_count);

    // ── Color scales ───────────────────────────────────────────
    function getColor(d, max) {
        const ratio = d / (max || 1);
        const stops = [
            [0.0, "#f7fbff"],
            [0.1, "#deebf7"],
            [0.2, "#c6dbef"],
            [0.3, "#9ecae1"],
            [0.45, "#6baed6"],
            [0.6, "#4292c6"],
            [0.75, "#2171b5"],
            [1.0, "#084594"],
        ];
        for (let i = stops.length - 1; i >= 0; i--) {
            if (ratio >= stops[i][0]) return stops[i][1];
        }
        return stops[0][1];
    }

    // ── Map ────────────────────────────────────────────────────
    const map = L.map("map").setView([43.72, -79.38], 11);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://osm.org/copyright">OSM</a>',
        maxZoom: 18,
    }).addTo(map);

    // Compute max values for scaling
    const maxDogs = Math.max(...geo.features.map((f) => f.properties.dogs));
    const maxCats = Math.max(...geo.features.map((f) => f.properties.cats));
    const maxTotal = Math.max(...geo.features.map((f) => f.properties.total));

    let activeLayer = "dogs";
    let geoLayer;

    function getMax() {
        return activeLayer === "dogs" ? maxDogs : activeLayer === "cats" ? maxCats : maxTotal;
    }
    function getValue(props) {
        return props[activeLayer] ?? props.total;
    }

    function style(feature) {
        const val = getValue(feature.properties);
        return {
            fillColor: getColor(val, getMax()),
            weight: 1,
            opacity: 1,
            color: "#fff",
            dashArray: "2",
            fillOpacity: 0.65,
        };
    }

    function onEachFeature(feature, layer) {
        const p = feature.properties;
        layer.bindPopup(
            `<div class="info-popup">
                <b>FSA: ${p.fsa}</b><br>
                🐕 Dogs: ${fmt(p.dogs)}<br>
                🐈 Cats: ${fmt(p.cats)}<br>
                Total: ${fmt(p.total)}
            </div>`
        );
        layer.on({
            mouseover: (e) => {
                e.target.setStyle({ fillOpacity: 0.9, weight: 2 });
            },
            mouseout: (e) => {
                geoLayer.resetStyle(e.target);
            },
        });
    }

    function renderMap() {
        if (geoLayer) map.removeLayer(geoLayer);
        geoLayer = L.geoJSON(geo, { style, onEachFeature }).addTo(map);
    }
    renderMap();

    // Map legend
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
        const div = L.DomUtil.create("div", "map-legend");
        const grades = [0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.75];
        const labelMap = { dogs: "Dogs", cats: "Cats", total: "Total" };
        div.innerHTML = `<div class="legend-title">${labelMap[activeLayer]}</div>`;
        for (let i = 0; i < grades.length; i++) {
            const lo = Math.round(grades[i] * getMax());
            const hi = i + 1 < grades.length ? Math.round(grades[i + 1] * getMax()) : getMax();
            div.innerHTML +=
                `<i style="background:${getColor(lo, getMax())}"></i> ${lo}&ndash;${hi}<br>`;
        }
        return div;
    };
    legend.addTo(map);

    // Map toggle buttons
    document.querySelectorAll(".map-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelector(".map-btn.active").classList.remove("active");
            btn.classList.add("active");
            activeLayer = btn.dataset.layer;
            renderMap();
            map.removeControl(legend);
            legend.addTo(map);
        });
    });

    // ── Chart defaults ─────────────────────────────────────────
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.display = false;

    // ── Helper: horizontal bar chart ───────────────────────────
    function barChart(canvasId, labels, values, color) {
        return new Chart(document.getElementById(canvasId), {
            type: "bar",
            data: {
                labels,
                datasets: [{ data: values, backgroundColor: color, borderRadius: 4 }],
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { tooltip: { callbacks: { label: (ctx) => fmt(ctx.raw) } } },
                scales: {
                    x: { grid: { display: false }, ticks: { callback: (v) => fmt(v) } },
                    y: { grid: { display: false } },
                },
            },
        });
    }

    // ── Dog Names Chart ────────────────────────────────────────
    const dogNameLabels = data.top_dog_names.slice(0, 15).map((d) => d.name);
    const dogNameValues = data.top_dog_names.slice(0, 15).map((d) => d.count);
    const dogNameCanvas = document.getElementById("chart-dog-names");
    dogNameCanvas.parentElement.style.height = "440px";
    dogNameCanvas.style.height = "400px";
    barChart("chart-dog-names", dogNameLabels, dogNameValues, "#3b82f6");

    // ── Cat Names Chart ────────────────────────────────────────
    const catNameLabels = data.top_cat_names.slice(0, 15).map((d) => d.name);
    const catNameValues = data.top_cat_names.slice(0, 15).map((d) => d.count);
    const catNameCanvas = document.getElementById("chart-cat-names");
    catNameCanvas.parentElement.style.height = "440px";
    catNameCanvas.style.height = "400px";
    barChart("chart-cat-names", catNameLabels, catNameValues, "#f59e0b");

    // ── Dog Breeds Chart ───────────────────────────────────────
    const dogBreedLabels = data.top_dog_breeds.map((d) => d.breed);
    const dogBreedValues = data.top_dog_breeds.map((d) => d.count);
    const dogBreedCanvas = document.getElementById("chart-dog-breeds");
    dogBreedCanvas.parentElement.style.height = "440px";
    dogBreedCanvas.style.height = "400px";
    barChart("chart-dog-breeds", dogBreedLabels, dogBreedValues, "#6366f1");

    // ── Cat Breeds Chart ───────────────────────────────────────
    const catBreedLabels = data.top_cat_breeds.map((d) => d.breed);
    const catBreedValues = data.top_cat_breeds.map((d) => d.count);
    const catBreedCanvas = document.getElementById("chart-cat-breeds");
    catBreedCanvas.parentElement.style.height = "440px";
    catBreedCanvas.style.height = "400px";
    barChart("chart-cat-breeds", catBreedLabels, catBreedValues, "#ec4899");

    // ── Yearly Trend Chart ─────────────────────────────────────
    new Chart(document.getElementById("chart-yearly"), {
        type: "bar",
        data: {
            labels: data.yearly.years,
            datasets: [
                {
                    label: "Dogs",
                    data: data.yearly.dogs,
                    backgroundColor: "#3b82f6",
                    borderRadius: 4,
                },
                {
                    label: "Cats",
                    data: data.yearly.cats,
                    backgroundColor: "#f59e0b",
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: "top" },
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.raw)}` } },
            },
            scales: {
                x: { grid: { display: false } },
                y: { ticks: { callback: (v) => fmt(v) }, grid: { color: "#f3f4f6" } },
            },
        },
    });
})();
