import { registerAs } from '@nestjs/config';

export default registerAs('transactions', () => {
  return {
    webhookUrl: process.env.WEBHOOK_URL,
  };
});
