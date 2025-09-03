const { OpenAI } = require("openai");

const client = new OpenAI({
  apiKey:"sk-JrnOOiW9VUL5uP5k4s0mtQXQC3T2J48R2YU4YMK98pQWPPns" // Make sure your new key is in .env
});

async function testKey() {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello! Test if key works." }],
      max_tokens: 5,
    });

    console.log("✅ Key works! Response:", response.choices[0].message.content);
  } catch (err) {
    console.error("❌ Key test failed:", err);
  }
}

testKey();
