import type { Frame, Page } from '@playwright/test';

/**
 * Runs `action` and returns the URLs of every main-frame navigation (reload, redirect, history
 * change) that happened while it ran. An empty array proves the action updated the page in place.
 */
export async function recordNavigations(page: Page, action: () => Promise<void>): Promise<string[]> {
  const navigations: string[] = [];
  const onNavigated = (frame: Frame): void => {
    if (frame === page.mainFrame()) {
      navigations.push(frame.url());
    }
  };
  page.on('framenavigated', onNavigated);
  try {
    await action();
  } finally {
    page.off('framenavigated', onNavigated);
  }
  return navigations;
}
