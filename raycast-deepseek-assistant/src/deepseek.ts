const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

export type DeepSeekModel = "deepseek-chat" | "deepseek-reasoner";

export type AskDeepSeekInput = {
  apiKey: string;
  model: DeepSeekModel;
  prompt: string;
  systemPrompt?: string;
  temperature: number;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
      reasoning_content?: string;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

export async function askDeepSeek(input: AskDeepSeekInput) {
  const messages = [
    {
      role: "system",
      content:
        input.systemPrompt?.trim() ||
        "You are a helpful assistant. Answer clearly and concisely.",
    },
    {
      role: "user",
      content: input.prompt,
    },
  ];

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      messages,
      temperature: input.temperature,
    }),
  });

  const data = (await response.json()) as DeepSeekResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        `DeepSeek API request failed with HTTP ${response.status}`,
    );
  }

  const message = data.choices?.[0]?.message;
  const content = message?.content?.trim();
  const reasoning = message?.reasoning_content?.trim();

  if (!content && !reasoning) {
    throw new Error("DeepSeek returned an empty response.");
  }

  return {
    content: content || "",
    reasoning: reasoning || "",
  };
}
