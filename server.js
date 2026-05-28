import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const API_KEY = process.env.SERPAPI_KEY;

// PEOPLE SEARCH ROUTE (LinkedIn)
app.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ error: "Missing ?q= parameter" });

  // Force LinkedIn people search
  const finalQuery = `${query} site:linkedin.com/in`;

  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
    finalQuery
  )}&api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const results = (data.organic_results || []).map((item) => {
      const title = item.title || "";
      const snippet = item.snippet || "";

      // Extract name (before dash or pipe)
      let name = title.split(/[-|]/)[0].trim();

      // Extract role
      let role = "";
      if (title.includes(" - ")) {
        role = title.split(" - ")[1].trim();
      } else if (snippet.includes(" at ")) {
        role = snippet.split(" at ")[0].trim();
      }

      // Extract company
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

    res.json({ results });
  } catch (err) {
    res.json({ error: "Search failed", details: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
