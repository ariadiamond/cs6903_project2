function createFetcher(url, method, payload) {
  const body = JSON.stringify(payload);
  return fetch(url, { method, body });
}

export default {
  createFetcher
};
