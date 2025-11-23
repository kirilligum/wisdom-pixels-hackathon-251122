import { Mastra } from "@mastra/core/mastra";
import { contentAgent } from "./agents/content-agent";

export const mastra = new Mastra({
  agents: { contentAgent },
  server: {
    port: 4111,
    host: "localhost",
  },
});
