# DeepSeek Assistant

Raycast extension for calling the DeepSeek Chat Completions API from the command search line.

## Usage

1. Run `npm install`.
2. Run `npm run dev`.
3. Open Raycast and run `Ask DeepSeek`.
4. Paste your DeepSeek API key into the extension preference when Raycast asks for it.
5. Type your prompt in the Raycast input line and press Enter.

The extension shows the response below the input line. Use the actions to copy the answer or the full result.

If `ray lint` reports that `author` is invalid, replace `author` in `package.json` with your Raycast Store username. Local development and `ray build` do not require the username to be publishable.

## Configuration

- API URL: `https://api.deepseek.com/chat/completions`
- Models: `deepseek-chat`, `deepseek-reasoner`
- API key storage: Raycast password preference

## Security

Do not commit real API keys into this project. Raycast stores the key through the password preference.
