/**
 * Helper to execute Mastra tools in tests
 * Provides proper runtimeContext structure required by Mastra
 */

export async function executeToolInTest(tool: any, context: Record<string, any>, runId: string = 'test-run') {
  return await tool.execute({
    context,
    runtimeContext: {
      runId,
      agentId: 'test-agent',
      workflowId: 'test-workflow',
      stepId: 'test-step',
      userId: 'test-user',
      connectionId: 'test-connection',
    },
    runId,
  });
}
