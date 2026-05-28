app.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ error: "Missing ?q= parameter" });

  const finalQuery = `${query} site:linkedin.com/in`;

  // Fetch 5 pages of results
  const pages = [0, 10, 20, 30, 40];

  try {
    let allResults = [];

    for (let start of pages) {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
        finalQuery
      )}&start=${start}&api_key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      const results = (data.organic_results || []).map((item) => {
        const title = item.title || "";
        const snippet = item.snippet || "";

        let name = title.split(/[-|]/)[0].trim();

        let role = "";
        if (title.includes(" - ")) {
          role = title.split(" - ")[1].trim();
        } else if (snippet.includes(" at ")) {
          role = snippet.split(" at ")[0].trim();
        }

        let company = "";
        if (snippet.includes(" at ")) {
          company = snippet.split(" at ")[1].split(".")[0].trim();
        }

        return {
          name,
          role,
          company,
          link: item.link,
          snippet
        };
      });

      allResults = allResults.concat(results);
    }

    // Remove duplicates by LinkedIn URL
    const unique = [];
    const seen = new Set();

    for (let r of allResults) {
      if (!seen.has(r.link)) {
        seen.add(r.link);
        unique.push(r);
      }
    }

    res.json({ results: unique });

  } catch (err) {
    res.json({ error: "Search failed", details: err.message });
  }
});
