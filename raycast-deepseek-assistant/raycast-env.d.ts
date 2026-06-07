/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** DeepSeek API Key - Create one in the DeepSeek API console. */
  "apiKey": string,
  /** Default Model - DeepSeek chat model used by default. */
  "model": "deepseek-chat" | "deepseek-reasoner"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `ask-deepseek` command */
  export type AskDeepseek = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `ask-deepseek` command */
  export type AskDeepseek = {}
}

