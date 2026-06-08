import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  Icon,
  List,
  LocalStorage,
  Toast,
  getPreferenceValues,
  openExtensionPreferences,
  showToast,
  useNavigation,
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
  const { push } = useNavigation();
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
      push(<AnswerView answer={nextAnswer} />);
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
      isShowingDetail={false}
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
        actions={
          <ActionPanel>
            <Action
              icon={Icon.Message}
              title="Ask DeepSeek"
              shortcut={{ modifiers: ["cmd"], key: "return" }}
              onAction={handleAsk}
            />
            {answer?.content ? (
              <Action.Push
                icon={Icon.Text}
                title="Open Latest Answer"
                target={<AnswerView answer={answer} />}
              />
            ) : null}
            {answer?.content ? (
              <CopyAction
                icon={Icon.Clipboard}
                title="Copy Latest Answer"
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                content={answer.content}
                successTitle="回答已复制"
              />
            ) : null}
            {error ? (
              <Action.Push
                icon={Icon.ExclamationMark}
                title="Open Error"
                target={<Detail markdown={`# 请求失败\n\n${error}`} />}
              />
            ) : null}
            <Action
              icon={Icon.Gear}
              title="Edit DeepSeek API Key"
              shortcut={{ modifiers: ["cmd"], key: "," }}
              onAction={openExtensionPreferences}
            />
            {history.length ? (
              <Action.Push
                icon={Icon.Clock}
                title="Show History"
                shortcut={{ modifiers: ["cmd"], key: "y" }}
                target={
                  <HistoryView
                    history={history}
                    onClearHistory={clearHistory}
                    onUsePrompt={(item) => {
                      setPrompt(item.prompt);
                      setSelectedModel(item.model);
                    }}
                  />
                }
              />
            ) : null}
          </ActionPanel>
        }
      />
    </List>
  );
}

function buildAnswerMarkdown(answer: Answer) {
  return [
    `# ${answer.prompt}`,
    "",
    `Model: \`${answer.model}\``,
    "",
    answer.reasoning ? `## Reasoning\n\n${answer.reasoning}` : "",
    answer.content ? `## Answer\n\n${answer.content}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function CopyAction(props: {
  icon: Icon;
  title: string;
  content: string;
  successTitle: string;
  shortcut?: Action.Props["shortcut"];
}) {
  return (
    <Action
      icon={props.icon}
      title={props.title}
      shortcut={props.shortcut}
      onAction={async () => {
        await Clipboard.copy(props.content);
        await showToast({
          style: Toast.Style.Success,
          title: props.successTitle,
        });
      }}
    />
  );
}

function AnswerView(props: { answer: Answer }) {
  const markdown = buildAnswerMarkdown(props.answer);

  return (
    <Detail
      navigationTitle="DeepSeek Answer"
      markdown={markdown}
      actions={
        <ActionPanel>
          <CopyAction
            icon={Icon.Clipboard}
            title="Copy Answer"
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            content={props.answer.content}
            successTitle="回答已复制"
          />
          <CopyAction
            icon={Icon.Text}
            title="Copy Full Result"
            shortcut={{ modifiers: ["cmd", "shift", "opt"], key: "c" }}
            content={markdown}
            successTitle="完整结果已复制"
          />
        </ActionPanel>
      }
    />
  );
}

function HistoryView(props: {
  history: HistoryItem[];
  onClearHistory: () => Promise<void>;
  onUsePrompt: (item: HistoryItem) => void;
}) {
  const { pop } = useNavigation();

  return (
    <List
      isShowingDetail={false}
      navigationTitle="DeepSeek History"
      searchBarPlaceholder="搜索历史问题"
    >
      <List.Section
        title="History"
        subtitle={`${props.history.length} records`}
      >
        {props.history.map((item) => {
          const itemMarkdown = [
            buildAnswerMarkdown(item),
            "",
            `Time: ${new Date(item.createdAt).toLocaleString()}`,
          ].join("\n\n");

          return (
            <List.Item
              key={item.id}
              id={item.id}
              icon={Icon.Clock}
              title={item.prompt}
              subtitle={`${item.model} · ${new Date(item.createdAt).toLocaleString()}`}
              actions={
                <ActionPanel>
                  <Action.Push
                    icon={Icon.Text}
                    title="Open Answer"
                    target={<AnswerView answer={item} />}
                  />
                  <Action
                    icon={Icon.RotateClockwise}
                    title="Ask Again"
                    onAction={() => {
                      props.onUsePrompt(item);
                      pop();
                    }}
                  />
                  <CopyAction
                    icon={Icon.Clipboard}
                    title="Copy Answer"
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                    content={item.content}
                    successTitle="回答已复制"
                  />
                  <CopyAction
                    icon={Icon.Text}
                    title="Copy Full Result"
                    shortcut={{ modifiers: ["cmd", "shift", "opt"], key: "c" }}
                    content={itemMarkdown}
                    successTitle="完整结果已复制"
                  />
                  <Action
                    icon={Icon.Trash}
                    title="Clear History"
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                    onAction={async () => {
                      await props.onClearHistory();
                      pop();
                    }}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
