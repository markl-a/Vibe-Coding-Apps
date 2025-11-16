// Background Service Worker for Video Controller Pro

const defaultSettings = {
  defaultSpeed: 1.0,
  skipShort: 5,
  skipMedium: 10,
  skipLong: 30,
  volumeStep: 5,
  rememberPosition: true
};

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Video Controller Pro installed');
    await chrome.storage.sync.set({ videoControllerSettings: defaultSettings });
  }
});
