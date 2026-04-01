require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post("/api/messages", async (req, res) => {
  try {
    const { content, user } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required." });
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          content: content.trim(),
          created_by: user && user.trim() ? user.trim() : "anonymous"
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to save message." });
    }

    res.status(201).json({
      success: true,
      message: "Saved successfully.",
      data
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch messages." });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.delete("/api/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.body || {};

    const { data, error } = await supabase
      .from("messages")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user && user.trim() ? user.trim() : "anonymous"
      })
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      console.error("Supabase soft delete error:", error);
      return res.status(500).json({ error: "Failed to delete message." });
    }

    if (!data) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.json({
      success: true,
      message: "Message deleted successfully."
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
