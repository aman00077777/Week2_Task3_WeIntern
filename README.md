# CreataAI Content Labs - AI Content Generator

CreataAI Content Labs is a premium, AI-powered content generation application designed to produce high-quality written content. It supports drafting structured **Blog Posts**, engaging **Social Media Captions**, and concise **Text Summaries** based on user prompts.

The app features a modern glassmorphic interface, dynamic dark/light mode, real-time word/character counts, a local history log for saving/restoring work, and an advanced **Refinement Panel** allowing users to conversationalize edits and iterate on the AI's drafts.

---

## 🚀 Recommended Tech Stack

- **Frontend Core**: [React.js](https://react.dev/) + [Vite](https://vite.dev/) (Single Page Application)
- **Styling**: Modern Custom CSS (with HSL variables, glassmorphism, responsive grid layout, and custom animations)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Backend Integrations**: 
  - **Google Gemini API** (via `@google/generative-ai` package, utilizing `gemini-1.5-flash` model)
  - **OpenAI API** (via standard HTTP stream fetch, utilizing `gpt-4o` model)
- **Demo fallback**: Built-in **Mock Mode** for offline evaluation and UI testing.

---

## 🛠️ Setup & Local Execution Instructions

### Prerequisites
Make sure you have **Node.js** (v18 or higher) and **npm** installed on your system.

### Steps to Run:
1. **Navigate to the Project Directory**:
   ```bash
   cd "c:/Users/Asus/OneDrive/WeIntern Tasks/Week2_Task3_WeIntern"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Launch the Local Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   Open your browser and navigate to the local hosting address:
   **[http://localhost:5173/](http://localhost:5173/)**

---

## 🔑 AI Engine & API Key Configurations

CreataAI values security. API keys are kept entirely client-side and are **never transmitted to any third-party backend servers** besides directly communicating with the official Google and OpenAI endpoints. Keys are saved securely in your browser's local storage (`localStorage`).

### Running in Mock Mode (Out of the Box)
By default, the application launches in **Mock Mode (Offline)**. This allows you to evaluate the layout, toggles, history sidebar, dark mode, word count, and refinement flow immediately without configuring any API keys.

### Switching to Live Mode (API Keys)
1. In the top-right header, click the **Settings Icon (Gear)**.
2. Uncheck **Enable Mock Mode (Offline)**.
3. Select your AI provider (**Google Gemini** or **OpenAI**).
4. Enter your API Key:
   - **Google Gemini**: Obtain a key from the [Google AI Studio](https://aistudio.google.com/).
   - **OpenAI**: Obtain a key from your [OpenAI Dashboard](https://platform.openai.com/).
5. Click **Save & Close**. The badge in the top header will update to **Live Mode**.

---

## 🧠 Model Selection Rationale

1. **Google Gemini 1.5 Flash (Default)**:
   - **Speed**: Optimized for near-instant responses.
   - **Cost-Efficiency**: Generous free tier inside Google AI Studio, making it highly accessible.
   - **Chat History API**: Native support for starting a session with previous history records (`startChat`), facilitating the conversational refinement feature.

2. **OpenAI GPT-4o (Alternative)**:
   - **Reasoning**: Outstanding textual quality, rich vocabulary, and structure control.
   - **Universal Standard**: Serves as a reliable alternative for enterprise settings.

---

## 📝 Prompt Engineering Templates

The application formats prompts programmatically in `src/services/aiService.js` to ensure the model outputs high-quality, structured text.

### 1. Blog Post Template
```
Write a comprehensive, engaging, and high-quality blog post about the topic: "{topic}".
The tone of the blog post should be "{tone}".
Please structure the post with a catchy title, an introductory hook, descriptive headings and subheadings (using Markdown), a balanced discussion, and a compelling conclusion with a call to action.
Aim for approximately {wordRange} words.
{extraInstructions}
Make sure the content flows naturally and holds reader interest.
```

### 2. Social Media Caption Template
```
Create a highly engaging, click-worthy social media caption about the topic: "{topic}".
The platform is: "{platform}".
The tone of the caption should be "{tone}".
{includeEmojis ? 'Use appropriate emojis to increase visual appeal and spacing.' : 'Do not use emojis.'}
{includeHashtags ? 'Include 3 to 5 relevant and trending hashtags at the end.' : 'Do not include any hashtags.'}
Tailor the writing style exactly to {platform} (e.g., professional, analytical, and structured for LinkedIn; short, punchy, and witty for Twitter/X; aesthetic, narrative, and engaging for Instagram; conversational and engaging for Facebook).
{extraInstructions}
Do not include a title, just write the social media caption directly.
```

### 3. Text Summary Template
```
Summarize the following source text.
The summary should be {lengthPrompt}.
The format must be {formatPrompt}.
The tone should be "{tone}".

Source Text:
---
{topic}
---
{extraInstructions}
Make sure to extract key facts and main ideas accurately without introducing outside information.
```

---

## 📄 Sample Outputs (Demo Results)

Below are the actual generated sample texts for three different topics, utilizing different tones and configurations.

### Sample 1: Blog Post (Professional Tone)
- **Topic**: Artificial Intelligence in Healthcare: Diagnosis & Patient Outcomes
- **Length**: Medium (~700 words)
- **Output**:
  ```markdown
  # AI in Healthcare: Revolutionizing Diagnosis and Enhancing Patient Outcomes

  The integration of Artificial Intelligence (AI) into the healthcare sector is no longer a futuristic concept; it is an active revolution. From diagnosing rare genetic diseases to streamlining administrative clinical tasks, AI is reshaping how medicine is practiced and how patient care is delivered.

  ## 1. Accelerating Diagnosis with Precision
  One of the most promising applications of AI in healthcare lies in medical imaging. Deep learning models can analyze X-rays, MRIs, and CT scans with a level of speed and accuracy that matches—and sometimes surpasses—experienced radiologists. By identifying anomalies early, such as micro-tumors, AI helps doctors initiate treatments during the most critical windows.

  ## 2. Personalized Patient Treatment Plans
  Historically, medical treatments followed a one-size-fits-all approach. Today, AI-driven diagnostics utilize predictive analytics to parse genomic profiles, patient histories, and lifestyle data. This enables the formulation of highly customized therapies, optimizing patient recovery rates and minimizing adverse drug reactions.

  ## 3. Remote Patient Monitoring & Predictive Intervention
  Wearable medical devices powered by AI algorithms track vitals (heart rate, blood oxygen levels, sleep quality) in real time. If the system detects anomaly patterns, it alerts healthcare providers *before* a medical emergency occurs. This preventive care loop significantly reduces re-hospitalization rates.

  ## Conclusion & Next Steps
  AI is not a replacement for human doctors; it is a powerful companion. By taking over data-heavy analyses, AI frees medical personnel to focus on the human side of healing: empathy, clinical judgment, and patient communication. As we move forward, standardizing ethics and data privacy policies will be paramount to building trust in these AI systems.
  ```

### Sample 2: Social Media Caption (Inspirational Tone)
- **Platform**: LinkedIn
- **Topic**: Remote Work Best Practices and Productivity Secrets
- **Output**:
  ```markdown
  Embracing the freedom of remote work isn't just about changing where you sit—it’s about changing how you think. 🧠✨

  Success in a work-from-anywhere world relies on self-discipline and intentional habits:
  
  1. Define Clear Boundaries: Protect your personal time as fiercely as your work block.
  2. Prioritize Energy Over Hours: Focus on delivering value, not just sitting in front of a screen.
  3. Optimize Your Environment: Dedicate a space that signals focus to your mind.

  Let’s build a career that fits our lives, not a life that fits around our careers! 🚀

  #RemoteWork #ProductivitySecrets #WorkFromAnywhere #CareerGrowth #Mindset
  ```

### Sample 3: Text Summary (Informative Tone, Bullet Points)
- **Source**: *A detailed block explaining the importance of transitioning to solar and wind energy to reduce greenhouse gas emissions and slow global temperature rise.*
- **Format**: Key Highlights
- **Output**:
  ```markdown
  - **Core Topic**: Crucial transition to renewable energy sources, specifically solar and wind, to mitigate greenhouse gas emissions.
  - **Key Action**: Phasing out fossil fuels in favor of sustainable, low-emission alternatives.
  - **Expected Outcome**: Slowing down global temperature rise and combating the long-term impacts of climate change.
  - **Practical Value**: Clean energy represents a scalable, reliable pathway to achieving net-zero emissions targets.
  ```
#   W e e k 2 _ T a s k 3 _ W e I n t e r n  
 