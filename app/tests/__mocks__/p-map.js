// Mock implementation of p-map for Jest
async function pMap(iterable, mapper, options = {}) {
  const { concurrency = Infinity } = options;

  const array = Array.from(iterable);
  const results = [];

  if (concurrency === Infinity) {
    // Run all in parallel
    return Promise.all(array.map((item, index) => mapper(item, index)));
  }

  // Run with concurrency limit
  for (let i = 0; i < array.length; i += concurrency) {
    const batch = array.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((item, batchIndex) => mapper(item, i + batchIndex))
    );
    results.push(...batchResults);
  }

  return results;
}

module.exports = pMap;
module.exports.default = pMap;
