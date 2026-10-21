import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { RemoteNpcBrain } from './npc/RemoteNpcBrain';
import { setBrainFactory, stubBrainFactory } from './npc/roster';
import './ui/styles.css';

// Residents think on the brain server, where their memories persist and the
// language model is called. Each keeps an offline mind as a fallback, so the
// game still talks if the server is unreachable.
setBrainFactory((npcId) => new RemoteNpcBrain(npcId, stubBrainFactory(npcId)));

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element in index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
