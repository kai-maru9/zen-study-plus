import browser from '../utils/browser';
import { defaultSyncOptions } from '../utils/default-options';
import { RuntimeMessage } from '../utils/runtime-messages';
import { getSyncStorage, setSyncStorage } from '../utils/storage';
import { HistoricalSyncOptions, migrateHistoricalSyncOptions } from '../utils/sync-options';

browser.runtime.onInstalled.addListener(async () => {
  const unknownOptions = (await getSyncStorage('options')).options;

  try {
    const options = migrateHistoricalSyncOptions(
      HistoricalSyncOptions.parse(unknownOptions),
    );

    setSyncStorage({ options });
  } catch {
    setSyncStorage({ options: defaultSyncOptions });
  }
});

browser.runtime.onMessage.addListener((unknownMessage, sender) => {
  const message = RuntimeMessage.parse(unknownMessage);

  switch (message.type) {
    case 'SEND_BACK_KEYBOARD_SHORTCUTS': {
      const tabId = sender.tab?.id;

      if (tabId) {
        browser.tabs.sendMessage<RuntimeMessage>(tabId, {
          type: 'KEYBOARD_SHORTCUTS',
          keyboardShortcutNames: message.sendBackKeyboardShortcutNames,
        });
      }

      break;
    }

    case 'SEND_BACK_RESIZE_REFERENCE': {
      const tabId = sender.tab?.id;
      const frameId = sender.frameId;

      if (!tabId || !frameId) {
        return;
      }

      browser.webNavigation.getFrame({ tabId, frameId }).then((frame) => {
        if (!frame || frame.parentFrameId === -1) {
          return;
        }

        browser.tabs.sendMessage<RuntimeMessage>(
          tabId,
          {
            type: 'RESIZE_REFERENCE',
            height: message.sendBackHeight,
          },
          { frameId: frame.parentFrameId },
        );
      });
    }
  }
});

browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
  browser.tabs.sendMessage<RuntimeMessage>(
    details.tabId,
    { type: 'CHANGE_HISTORY_STATE' },
    { frameId: details.frameId },
  );
}, {
  url: [{ hostEquals: 'www.nnn.ed.nico' }],
});
