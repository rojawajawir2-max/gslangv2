const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Slang API is running.");
});

// API KEY
const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.warn("Missing GROQ_API_KEY environment variable.");
}

// Groq client
const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// translate route
app.get("/translate", async (req, res) => {
  try {
    const text = req.query.text;

    if (!text) {
      return res.status(400).send("error: no text provided");
    }

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 1.2,
      top_p: 0.95,
      max_tokens: 60,
      messages: [
        {
          role: "system",
          content: `
YOU ARE A STREET SLANG TRANSLATOR.

RULES (VERY STRICT):

- Convert Indonesian into aggressive natural English slang
- NEVER use formal English
- NEVER use quotation marks (no " or ')
- NEVER use short forms like u, r, 4, 2
- ALWAYS write full words (you, are, for, to)
- MAX 1 SHORT sentence only
- NO explanations
- NO formatting symbols
- NO emoji
- NO extra punctuation style
- MUST sound like real spoken street talk

STYLE:
- natural human speech
- gangster / hood tone
- raw conversation style

EXAMPLES:

lu ngapain disini
→ yo what the hell you doing here

gua mau pergi
→ I am out of here right now

jangan ganggu aku
→ dont mess with me

kalian pergi saja
→ yall better leave right now

NOW TRANSLATE:
`
        },
        {
          role: "user",
          content: text
        }
      ]
    });

    const output =
      response?.choices?.[0]?.message?.content?.trim();

    if (!output) {
      return res.status(500).send("error: empty response");
    }

    // extra safety remove quotes kalau AI masih degil
    const cleanOutput = output.replace(/["']/g, "");

    res.send(cleanOutput);

  } catch (err) {
    console.error(err);
    res.status(500).send("error: api failed");
  }
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
