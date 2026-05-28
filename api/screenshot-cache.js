const cache = new Map();

export const getCachedImage = (key) => {
  return cache.get(key);
};

export const setCachedImage = (key, imageUrl) => {
  cache.set(key, imageUrl);
};