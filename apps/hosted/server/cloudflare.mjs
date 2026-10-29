import { WorkflowEntrypoint } from 'cloudflare:workers';
import { handleRequest, runJob, cleanup } from './index.mjs';

export class HostedJobWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    // Durable DB claims are a second guard against platform replay. Unknown calls
    // retain their reservation and require reconciliation, never automatic retry.
    return step.do('execute-provider-once', { retries: { limit: 0, delay: '1 second', backoff: 'constant' }, timeout: '15 minutes' }, () => runJob(event.payload.jobId, this.env));
  }
}
export default {
  fetch: handleRequest,
  scheduled(_event, env, ctx) { ctx.waitUntil(cleanup(env)); },
};
