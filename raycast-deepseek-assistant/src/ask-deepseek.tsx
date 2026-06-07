import {
  Action,
  ActionPanel,
  Clipboard,
  Icon,
  List,
  LocalStorage,
  Toast,
  getPreferenceValues,
  openExtensionPreferences,
  showToast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { DeepSeekModel, askDeepSeek } from "./deepseek";

const HISTORY_STORAGE_KEY = "deepseek-chat-history";
const HISTORY_LIMIT = 20;

type Preferences = {
  apiKey: string;
  model: DeepSeekModel;
};

type Answer = {
  prompt: string;
  model: DeepSeekModel;
  content: string;
  reasoning: string;
};

type HistoryItem = Answer & {
  id: string;
  createdAt: string;
};

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<DeepSeekModel>(
    preferences.model,
  );
  const [answer, setAnswer] = useState<Answer>();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      const savedHistory =
        await LocalStorage.getItem<string>(HISTORY_STORAGE_KEY);

      if (!savedHistory) {
        return;
      }

      try {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[];

        if (Array.isArray(parsedHistory)) {
          setHistory(parsedHistory.slice(0, HISTORY_LIMIT));
        }
      } catch {
        setHistory([]);
      }
    }

    loadHistory();
  }, []);

  async function handleAsk() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      await showToast({
        style: Toast.Style.Failure,
        title: "请输入问题",
      });
      return;
    }

    setIsLoading(true);
    setAnswer(undefined);
    setError(undefined);

    try {
      const result = await askDeepSeek({
        apiKey: preferences.apiKey,
        model: selectedModel,
        prompt: trimmedPrompt,
        temperature: 0.7,
      });

      const nextAnswer = {
        prompt: trimmedPrompt,
        model: selectedModel,
        content: result.content,
        reasoning: result.reasoning,
      };
      const nextHistory = [
        {
          ...nextAnswer,
          id: `${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...history,
      ].slice(0, HISTORY_LIMIT);

      setAnswer(nextAnswer);
      setHistory(nextHistory);
      await LocalStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(nextHistory),
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : String(requestError);

      setError(message);
      await showToast({
        style: Toast.Style.Failure,
        title: "DeepSeek 请求失败",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const markdown = answer
    ? [
        `# ${answer.prompt}`,
        "",
        `Model: \`${answer.model}\``,
        "",
        answer.reasoning ? `## Reasoning\n\n${answer.reasoning}` : "",
        answer.content ? `## Answer\n\n${answer.content}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";

  async function clearHistory() {
    setHistory([]);
    await LocalStorage.removeItem(HISTORY_STORAGE_KEY);
    await showToast({
      style: Toast.Style.Success,
      title: "会话历史已清空",
    });
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={Boolean(answer || error || history.length)}
      searchText={prompt}
      onSearchTextChange={setPrompt}
      navigationTitle="Ask DeepSeek"
      searchBarPlaceholder="直接输入问题，按 Enter 发送给 DeepSeek"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Model"
          value={selectedModel}
          onChange={(value) => setSelectedModel(value as DeepSeekModel)}
        >
          <List.Dropdown.Item
            title="DeepSeek Chat"
            value="deepseek-chat"
            icon={Icon.Message}
          />
          <List.Dropdown.Item
            title="DeepSeek Reasoner"
            value="deepseek-reasoner"
            icon={Icon.LightBulb}
          />
        </List.Dropdown>
      }
    >
      <List.Item
        id="ask"
        icon={Icon.Message}
        title={isLoading ? "DeepSeek 正在回答..." : "Ask DeepSeek"}
        subtitle={
          prompt.trim()
            ? `${selectedModel} · 按 Enter 发送`
            : `${selectedModel} · 输入问题后按 Enter`
        }
        detail={
          answer ? (
            <List.Item.Detail markdown={markdown} />
          ) : error ? (
            <List.Item.Detail markdown={`# 请求失败\n\n${error}`} />
          ) : undefined
        }
        actions={
          <ActionPanel>
            <Action
              icon={Icon.Message}
              title="Ask DeepSeek"
              shortcut={{ modifiers: ["cmd"], key: "return" }}
              onAction={handleAsk}
            />
            {answer?.content ? (
              <Action
                icon={Icon.Clipboard}
                title="Copy Answer"
                shortcut={{ modifiers: ["cmd"], key: "c" }}
                onAction={async () => {
                  await Clipboard.copy(answer.content);
                  await showToast({
                    style: Toast.Style.Success,
                    title: "回答已复制",
                  });
                }}
              />
            ) : null}
            {markdown ? (
              <Action.CopyToClipboard
                icon={Icon.Text}
                title="Copy Full Result"
                content={markdown}
              />
            ) : null}
            <Action
              icon={Icon.Gear}
              title="Edit DeepSeek API Key"
              shortcut={{ modifiers: ["cmd"], key: "," }}
              onAction={openExtensionPreferences}
            />
            {history.length ? (
              <Action
                icon={Icon.Trash}
                title="Clear History"
                shortcut={{ modifiers: ["ctrl"], key: "x" }}
                onAction={clearHistory}
              />
            ) : null}
          </ActionPanel>
        }
      />
      {history.length ? (
        <List.Section title="History" subtitle={`${history.length} records`}>
          {history.map((item) => {
            const itemMarkdown = [
              `# ${item.prompt}`,
              "",
              `Model: \`${item.model}\``,
              "",
              `Time: ${new Date(item.createdAt).toLocaleString()}`,
              "",
              item.reasoning ? `## Reasoning\n\n${item.reasoning}` : "",
              item.content ? `## Answer\n\n${item.content}` : "",
            ]
              .filter(Boolean)
              .join("\n\n");

            return (
              <List.Item
                key={item.id}
                id={item.id}
                icon={Icon.Clock}
                title={item.prompt}
                subtitle={`${item.model} · ${new Date(item.createdAt).toLocaleString()}`}
                detail={<List.Item.Detail markdown={itemMarkdown} />}
                actions={
                  <ActionPanel>
                    <Action
                      icon={Icon.RotateClockwise}
                      title="Ask Again"
                      onAction={() => {
                        setPrompt(item.prompt);
                        setSelectedModel(item.model);
                      }}
                    />
                    <Action.CopyToClipboard
                      icon={Icon.Clipboard}
                      title="Copy Answer"
                      content={item.content}
                    />
                    <Action.CopyToClipboard
                      icon={Icon.Text}
                      title="Copy Full Result"
                      content={itemMarkdown}
                    />
                    <Action
                      icon={Icon.Trash}
                      title="Clear History"
                      shortcut={{ modifiers: ["ctrl"], key: "x" }}
                      onAction={clearHistory}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      ) : null}
    </List>
  );
}
