import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('Connected — sending init');
  ws.send(JSON.stringify({ type: 'init', deviceId: 'IKEA-MALM-AA2301456' }));
});

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  console.log(`Event: ${msg.event}`, msg.data ? JSON.stringify(msg.data).slice(0, 200) : '');

  // If we get onGuideReady, the core flow works
  if (msg.event === 'onGuideReady') {
    console.log('\n=== GUIDE RECEIVED ===');
    console.log(`Steps: ${msg.data.steps?.length}`);
    console.log(`Parts: ${msg.data.parts?.length}`);
    console.log(`Tools: ${msg.data.tools?.length}`);
    console.log('=== SMOKE TEST PASSED ===\n');
  }
});

ws.on('close', () => console.log('Disconnected'));
ws.on('error', (err) => console.error('Error:', err.message));
