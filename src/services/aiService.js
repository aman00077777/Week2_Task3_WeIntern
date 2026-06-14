import { GoogleGenerativeAI } from "@google/generative-ai";

// Prompt templates for different content types
export const generatePrompt = ({ type, topic, tone, options = {} }) => {
  const {
    length = "medium",
    platform = "Instagram",
    includeEmojis = true,
    includeHashtags = true,
    format = "paragraph",
    extraInstructions = "",
  } = options;

  switch (type) {
    case "blog": {
      const wordRange =
        length === "short"
          ? "300 to 500"
          : length === "medium"
          ? "600 to 900"
          : "1000 to 1500";
      return `Write a comprehensive, engaging, and high-quality blog post about the topic: "${topic}".
The tone of the blog post should be "${tone}".
Please structure the post with a catchy title, an introductory hook, descriptive headings and subheadings (using Markdown), a balanced discussion, and a compelling conclusion with a call to action.
Aim for approximately ${wordRange} words.
${extraInstructions ? `Additional instructions: ${extraInstructions}` : ""}
Make sure the content flows naturally and holds reader interest.`;
    }

    case "caption": {
      const emojiPrompt = includeEmojis
        ? "Use appropriate emojis to increase visual appeal and spacing."
        : "Do not use emojis.";
      const hashtagPrompt = includeHashtags
        ? "Include 3 to 5 relevant and trending hashtags at the end."
        : "Do not include any hashtags.";
      return `Create a highly engaging, click-worthy social media caption about the topic: "${topic}".
The platform is: "${platform}".
The tone of the caption should be "${tone}".
${emojiPrompt}
${hashtagPrompt}
Tailor the writing style exactly to ${platform} (e.g., professional, analytical, and structured for LinkedIn; short, punchy, and witty for Twitter/X; aesthetic, narrative, and engaging for Instagram; conversational and engaging for Facebook).
${extraInstructions ? `Additional instructions: ${extraInstructions}` : ""}
Do not include a title, just write the social media caption directly.`;
    }

    case "summary": {
      const lengthPrompt =
        length === "short"
          ? "concise, limited to 1-2 sentences"
          : length === "medium"
          ? "medium-length, around 1 standard paragraph"
          : "detailed, covering all major points and structures";
      const formatPrompt =
        format === "bullets"
          ? "a bulleted list of key highlights"
          : "a coherent paragraph format";
      return `Summarize the following source text.
The summary should be ${lengthPrompt}.
The format must be ${formatPrompt}.
The tone should be "${tone}".

Source Text:
---
${topic}
---

${extraInstructions ? `Additional instructions: ${extraInstructions}` : ""}
Make sure to extract key facts and main ideas accurately without introducing outside information.`;
    }

    default:
      return `Generate content about: ${topic}`;
  }
};

// Mock generation for offline demo testing
export const generateMockContent = ({ type, topic, tone, options = {} }) => {
  const {
    length = "medium",
    platform = "Instagram",
    format = "paragraph",
  } = options;

  const titleTopic = topic.length > 40 ? topic.substring(0, 40) + "..." : topic;
  const timeStr = new Date().toLocaleTimeString();

  if (type === "blog") {
    return `# The Art of ${titleTopic}

*Published on ${new Date().toLocaleDateString()} | Tone: ${tone} (Demo Mock Mode)*

Introduction: Have you ever wondered how to master **${topic}**? In today's fast-paced world, finding reliable insights on this subject can be a game-changer. This article provides a comprehensive overview of how to approach this topic effectively.

## Why ${titleTopic} Matters

When we dive deeper into this subject, it becomes clear that there are multiple layers to explore. Whether you are a beginner or an expert, understanding the nuances of this area is essential. It requires a blend of patience, continuous learning, and practical application.

- **Key Insight 1:** Dedicating time to understand the fundamentals pays off in the long run.
- **Key Insight 2:** Staying curious helps adapt to new trends and changes.

## Best Practices and Strategies

Implementing strategies around **${topic}** doesn't have to be overwhelming. Start small and iterate. Consistency is far more valuable than intensity.
1. Define your primary goals.
2. Outline a daily checklist.
3. Review your progress weekly.

## Summary & Next Steps

In conclusion, mastering this area is a journey, not a destination. By applying these guidelines in a **${tone.toLowerCase()}** manner, you will achieve much better results.

What are your thoughts on this? Let us know in the comments below! (Generated at ${timeStr} in Mock Mode)`;
  }

  if (type === "caption") {
    const emojis = {
      Professional: "💼📈🎯",
      Casual: "👋✨😊",
      Inspirational: "✨🚀🔥",
      Humorous: "😂🤷‍♂️🤪",
      Witty: "💡🧠✨",
      Informative: "📚💡🔍",
      Persuasive: "📢💥🚀"
    };
    const selectedEmojis = emojis[tone] || "✨";

    let platText = "";
    if (platform === "LinkedIn") {
      platText = `Thrilled to share some insights on **${topic}** today! 

In professional growth, staying ahead in areas like this is key to long-term success. It teaches us resilience, strategy, and adaptation. 

How are you approaching this in your current projects? Let's connect in the comments.`;
    } else if (platform === "Twitter/X") {
      platText = `Let's talk about ${topic}. It's one of the most underrated areas right now. Agree or disagree? 👇`;
    } else {
      platText = `Embracing the journey of ${topic} today! ${selectedEmojis} Finding beauty in the details and staying focused on the goals. Hope this inspires your day!`;
    }

    return `${platText}

#${topic.replace(/[^a-zA-Z0-9]/g, "")} #Inspiration #DemoMode #Mock`;
  }

  if (type === "summary") {
    if (format === "bullets") {
      return `Here is a **${tone.toLowerCase()}** bulleted summary of your text (Mock Mode):
- **Core Topic:** Detailed examination of "${titleTopic}".
- **Key Takeaway:** Understanding this subject is crucial for optimization and growth.
- **Methodology:** Requires consistent execution, tracking core metrics, and refining the approach.
- **Conclusion:** Focus on practical execution and continuous adjustment.
*(Summary size: ${length}, generated at ${timeStr})*`;
    } else {
      return `Summary of your text in a **${tone.toLowerCase()}** tone (Mock Mode):
This text details the essential elements of "${topic}". The core focus lies on establishing structured strategies to tackle key challenges, highlighting the importance of consistency and constant refinement. By adopting a ${tone.toLowerCase()} stance, the author argues that one can effectively navigate the complexities associated with this subject and achieve the desired outcomes. *(Summary size: ${length})*`;
    }
  }

  return `Mock generated content for "${topic}" (${tone} tone). Please configure your API key in the settings to generate live AI content!`;
};

// Calls Gemini API
export const callGeminiAPI = async ({ prompt, apiKey, modelName = "gemini-1.5-flash", isRefinement = false, history = [] }) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    if (isRefinement && history.length > 0) {
      // Structure chat history format for Gemini
      const chatHistory = history.map(h => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }]
      }));
      
      const chat = model.startChat({
        history: chatHistory
      });
      
      const result = await chat.sendMessage(prompt);
      return result.response.text();
    } else {
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
  } catch (error) {
    console.error("Gemini API Error: ", error);
    throw new Error(error.message || "Failed to communicate with Google Gemini API.");
  }
};

// Calls OpenAI API
export const callOpenAIAPI = async ({ prompt, apiKey, modelName = "gpt-4o", isRefinement = false, history = [] }) => {
  try {
    const messages = [];
    
    if (isRefinement && history.length > 0) {
      // Load previous conversation history
      messages.push({ role: "system", content: "You are a professional copywriter and content editor. The user will ask you to edit or refine the previously generated content." });
      history.forEach(h => {
        messages.push({ role: h.role, content: h.content });
      });
      messages.push({ role: "user", content: prompt });
    } else {
      messages.push({ role: "system", content: "You are a professional copywriter and content generator." });
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error: ", error);
    throw new Error(error.message || "Failed to communicate with OpenAI API.");
  }
};

// Unified entry point for content generation
export const generateContent = async ({
  type,
  topic,
  tone,
  options = {},
  apiConfig = {}
}) => {
  const { mockMode = true, provider = "gemini", geminiKey = "", openAIKey = "", geminiModel = "gemini-1.5-flash", openAIModel = "gpt-4o" } = apiConfig;

  if (mockMode) {
    // Artificial slight delay to simulate API loading
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateMockContent({ type, topic, tone, options });
  }

  const prompt = generatePrompt({ type, topic, tone, options });

  if (provider === "gemini") {
    if (!geminiKey) throw new Error("Google Gemini API Key is missing. Please add it in settings.");
    return await callGeminiAPI({ prompt, apiKey: geminiKey, modelName: geminiModel });
  } else {
    if (!openAIKey) throw new Error("OpenAI API Key is missing. Please add it in settings.");
    return await callOpenAIAPI({ prompt, apiKey: openAIKey, modelName: openAIModel });
  }
};

// Unified entry point for content refinement
export const refineContent = async ({
  refinementPrompt,
  history,
  apiConfig = {}
}) => {
  const { mockMode = true, provider = "gemini", geminiKey = "", openAIKey = "", geminiModel = "gemini-1.5-flash", openAIModel = "gpt-4o" } = apiConfig;

  if (mockMode) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return `*(Refined in Mock Mode based on: "${refinementPrompt}")*\n\n` + history[history.length - 1].content + `\n\n*Note: Add your actual API key to perform real AI edits!*`;
  }

  if (provider === "gemini") {
    if (!geminiKey) throw new Error("Google Gemini API Key is missing.");
    return await callGeminiAPI({ prompt: refinementPrompt, apiKey: geminiKey, modelName: geminiModel, isRefinement: true, history });
  } else {
    if (!openAIKey) throw new Error("OpenAI API Key is missing.");
    return await callOpenAIAPI({ prompt: refinementPrompt, apiKey: openAIKey, modelName: openAIModel, isRefinement: true, history });
  }
};
