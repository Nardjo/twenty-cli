import { Command } from "commander";
import { getToken, setToken, removeToken, hasToken, maskToken } from "../lib/auth.js";
import { client } from "../lib/client.js";
import { log } from "../lib/logger.js";
import { handleError } from "../lib/errors.js";
import { BASE_URL, APP_CLI } from "../lib/config.js";

export const authCommand = new Command("auth").description("Manage API authentication");

authCommand
  .command("set")
  .description("Save your Twenty API key (Settings → API & Webhooks)")
  .argument("<token>", "Your API key")
  .addHelpText("after", `\nExample:\n  ${APP_CLI} auth set eyJhbGciOi...`)
  .action((token: string) => {
    setToken(token);
    log.success("Token saved securely");
  });

authCommand
  .command("show")
  .description("Display current token (masked by default)")
  .option("--raw", "Show the full unmasked token")
  .action((opts: { raw?: boolean }) => {
    if (!hasToken()) {
      log.warn(`No token configured. Run: ${APP_CLI} auth set <token>`);
      return;
    }
    const token = getToken();
    console.log(opts.raw ? token : `Token: ${maskToken(token)}`);
  });

authCommand
  .command("remove")
  .description("Delete the saved token")
  .action(() => {
    removeToken();
    log.success("Token removed");
  });

authCommand
  .command("test")
  .description("Verify token + base URL (GET /people?limit=1)")
  .action(async () => {
    try {
      await client.get("/people", { limit: "1", depth: "0" });
      log.success(`Token is valid against ${BASE_URL}`);
    } catch (err) {
      handleError(err);
    }
  });
