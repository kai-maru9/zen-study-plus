const browser = 'browser' in globalThis
  ? (globalThis as typeof globalThis & { browser: typeof chrome }).browser
  : chrome;

export default browser;
