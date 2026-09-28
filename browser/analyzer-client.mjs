// Browser lifecycle only: the frozen analyzer and its results are unchanged.
export function createAnalyzerClient({createWorker, onState, startupTimeout = 60000}) {
  let worker, timer, sequence = 0, status = 'stopped';
  const pending = new Map();
  function stop(message) {
    clearTimeout(timer);
    worker?.terminate(); worker = undefined;
    status = 'failed';
    for (const request of pending.values()) request.reject(new Error(message));
    pending.clear();
    onState(status, message);
  }
  function start() {
    if (worker) stop('Analysis stopped. Please try again.');
    status = 'loading'; onState(status);
    try {
      const instance = createWorker(); worker = instance;
      timer = setTimeout(() => stop('The dictionary could not finish loading. Reconnect and retry.'), startupTimeout);
      instance.addEventListener('message', ({data}) => {
        if (worker !== instance) return;
        if (!data || !['ready', 'error', 'result'].includes(data.type)) return;
        if (data.type === 'ready') { clearTimeout(timer); status = 'ready'; onState(status); return; }
        if (data.type === 'error' && data.id === undefined) { stop(data.message || 'The dictionary could not load.'); return; }
        const request = pending.get(data.id);
        if (!request) return;
        pending.delete(data.id);
        if (data.type === 'error') request.reject(new Error(data.message || 'The lookup failed.'));
        else if (data.type === 'result') request.resolve(data);
      });
      instance.addEventListener('error', event => { if (worker === instance) stop(event.message || 'The analyzer stopped unexpectedly.'); });
      instance.addEventListener('messageerror', () => { if (worker === instance) stop('The analyzer could not return its result.'); });
    } catch (error) { stop(error.message || 'This browser could not start the analyzer.'); }
  }
  function query(input, mode = 'legacy') {
    if (status !== 'ready') return Promise.reject(new Error('Reload the dictionary before trying again.'));
    return new Promise((resolve, reject) => {
      const id = ++sequence; pending.set(id, {resolve, reject});
      try { worker.postMessage({id, input, mode}); }
      catch (error) { stop(error.message || 'The analyzer is unavailable.'); }
    });
  }
  return {start, query, stop};
}
