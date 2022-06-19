function createFetcher(url, payload) {
  const [method, body] = payload ? ["POST", JSON.stringify(payload)] : ["GET", payload];
  return fetch(url, { method, body });
}

export default {
  createFetcher
};
