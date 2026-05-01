import { describe, expect, it } from 'vitest';
import { appName, docsRoute, siteUrl } from '../../lib/shared';

describe('shared config', () => {
  it('exposes the LPM app name', () => {
    expect(appName).toBe('LPM');
  });

  it('points docs under /docs', () => {
    expect(docsRoute).toBe('/docs');
  });

  it('uses cli.lpm.dev as the canonical origin', () => {
    expect(siteUrl).toBe('https://cli.lpm.dev');
  });
});
