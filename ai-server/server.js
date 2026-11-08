import { createApp } from './src/app.js';

const port = Number(process.env.PORT);
const listenPort = Number.isInteger(port) && port > 0 ? port : 10000;

createApp().listen(listenPort, '0.0.0.0', () => {
  console.log(`ai-server listening on 0.0.0.0:${listenPort}`);
});
