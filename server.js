app.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ error: "Missing ?q= parameter" });

  // Force LinkedIn profile results
  const finalQuery = `${query} site:linkedin.com/in`;

  // Ask Google for more results per page
  const pages = Array.from({ length: 50 }, (_, i) => i * 10);

  // --- Improved company extraction ---
  function extractCompany(item) {
    const title = item.title || "";
    const snippet = item.snippet || "";
    const link = item.link || "";

    // Title: "Name - Role at Company"
    if (title.includes(" at ")) {
      return title.split(" at ")[1].split(/[-|]/)[0].trim();
    }

    // Snippet: "... Role at Company ..."
    if (snippet.includes(" at ")) {
      return snippet.split(" at ")[1].split(/[.|,]/)[0].trim();
    }

    // LinkedIn company URL fallback
    if (link.includes("/company/")) {
      return link
        .split("/company/")[1]
        .split("/")[0]
        .replace(/-/g, " ")
        .trim();
    }

    return "";
  }

  try {
    let allResults = [];

    for (let start of pages) {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
        finalQuery
      )}&start=${start}&num=20&api_key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      const results = (data.organic_results || []).map((item) => {
        const title = item.title || "";
        const snippet = item.snippet || "";

        // Better name extraction
        let name = title.split(" - ")[0].split("|")[0].trim();

        // Better role extraction
        let role = "";
        if (title.includes(" - ")) {
          role = title.split(" - ")[1].trim();
        } else if (snippet.includes(" at ")) {
          role = snippet.split(" at ")[0].trim();
        }

        // Correct company extraction
        const company = extractCompany(item);

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
