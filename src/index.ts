import cors from 'cors';
import express from 'express';
import cron from 'node-cron';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { version } from '../package.json';
import { SEVER_PORT } from './config';
import { liquidate } from './services/liquidate';



cron.schedule('* * * * *', async () => {
  console.log('Scheduled liquidations');
  const txs = await liquidate();
  console.log(txs.map(tx => tx.hash));
});

const app = express();

app.use(cors());

// define a route handler
app.route('/').get(async (req, res) => {
  res.json({ app: 'Diodon', service: 'Liquidator', status: 'OK', status_code: 200, version });
});

// Start the Express server
app.listen(SEVER_PORT, () => {
  console.log(`Server started at http://localhost:${SEVER_PORT}`);
});
