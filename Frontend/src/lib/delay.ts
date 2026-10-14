export const delay = (ms = 1200): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const randomDelay = (min = 800, max = 1800): Promise<void> =>
  delay(min + Math.floor(Math.random() * (max - min)));
