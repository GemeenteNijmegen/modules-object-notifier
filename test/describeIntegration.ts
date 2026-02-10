import 'dotenv/config';
export const describeIntegration = process.env.DESCRIBE_INTEGRATION === 'true' ? describe : describe.skip;