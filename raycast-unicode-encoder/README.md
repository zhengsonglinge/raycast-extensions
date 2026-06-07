# Raycast Unicode Encoder

一个最小可运行的 Raycast Extension，用来把输入字符串转换为：

- Unicode Code Point，例如 `U+4F60`
- JavaScript Unicode Escape，例如 `\u4F60`、`\u{1F600}`

## 本地运行

1. 在 Raycast 中启用 Developer Tools。
2. 进入项目目录执行：

```bash
npm install
npm run dev
```

3. 在 Raycast 中打开 `Unicode Encoder` 命令并直接输入字符串。

## 交互方式

- 只保留实时输入
- 右侧详情面板实时展示完整结果
- 通过动作面板复制所需输出

## 构建校验

```bash
npm run lint
npm run build
```

## 发布前注意

当前 `package.json` 里的 `author` 使用了一个可通过 Raycast lint 校验的占位用户名，只用于本地开发和校验闭环。

如果你要发布到 Raycast Store，需要把它替换成你自己的 Raycast 用户名。
