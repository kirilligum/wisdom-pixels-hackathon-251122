/**
 * Helper to execute Mastra tools in tests
 * With Mastra's createTool API, execute receives the validated input directly
 */

export async function executeToolInTest(tool: any, input: Record<string, any>) {
  return await tool.execute(input);
}
