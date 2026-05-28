import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const API_KEY = process.env.SERPAPI_KEY;

app.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ error: "Missing ?q= parameter" });

  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
    query
  )}&api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const results = (data.organic_results || []).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));

    res.json({ results });
  } catch (err) {
    res.json({ error: "Search failed", details: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
