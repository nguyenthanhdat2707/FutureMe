import * as path from 'path';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  SEED_VERSION,
  generatePhase4Dataset,
  runApply,
  runPlan,
  runRollback,
  runVerify,
} from '../src/demo/phase4-evaluation-dataset';

const manifestPath = path.join(process.cwd(), '.phase4-eval', 'manifest.json');

function requiredEnvironment(env: NodeJS.ProcessEnv, names: string[]): void {
  const missing = names.filter((name) => !env[name]);
  if (missing.length > 0) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export async function main(args = process.argv.slice(2), env = process.env): Promise<void> {
  const [command, confirmation] = args;
  if (command !== 'plan' && command !== 'apply' && command !== 'verify' && command !== 'rollback') {
    throw new Error(`Usage: phase4-evaluation-data <plan|apply|verify|rollback> [${SEED_VERSION}]`);
  }
  if (command !== 'plan' && confirmation !== SEED_VERSION) {
    throw new Error(`Confirmation argument must be exactly '${SEED_VERSION}'`);
  }
  if (command === 'plan') {
    runPlan(generatePhase4Dataset(new Date()));
    return;
  }

  requiredEnvironment(env, [
    'AWS_REGION', 'USERS_TABLE', 'CONTEXT_TABLE', 'OBS_TABLE', 'CALENDAR_TABLE', 'DECISIONS_TABLE',
  ]);
  const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: env.AWS_REGION }));
  if (command === 'apply') {
    await runApply(docClient, manifestPath, env);
  } else if (command === 'verify') {
    await runVerify(docClient, manifestPath, env);
  } else {
    await runRollback(docClient, manifestPath, env);
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
