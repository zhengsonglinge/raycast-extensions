import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useState } from "react";
import { buildMarkdown, encodeText } from "./unicode";

export default function Command() {
  const [text, setText] = useState("");
  const { codePoints, jsEscapes, charMap, count } = encodeText(text);

  return (
    <List
      isShowingDetail
      searchText={text}
      onSearchTextChange={setText}
      navigationTitle="Unicode Encoder"
      searchBarPlaceholder="直接输入字符串，实时查看 Unicode 编码"
    >
      {text ? (
        <List.Item
          id="current-input"
          icon={Icon.Text}
          title="Current Input"
          subtitle={`${count} chars`}
          detail={<List.Item.Detail markdown={buildMarkdown(text)} />}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title="Copy Unicode Code Points"
                content={codePoints}
              />
              <Action.CopyToClipboard
                title="Copy JavaScript Unicode Escapes"
                content={jsEscapes}
              />
              <Action.CopyToClipboard
                title="Copy Character Mapping"
                content={charMap}
              />
            </ActionPanel>
          }
        />
      ) : (
        <List.EmptyView
          icon={Icon.TextCursor}
          title="直接输入即可实时预览"
          description="右侧会实时显示完整结果：输入内容、Code Points、JS Escapes 和 Character Mapping。"
        />
      )}
    </List>
  );
}
