import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig, registryUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        text: 'Guide',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'Commands',
        url: '/docs/commands',
        active: 'nested-url',
      },
      {
        text: 'Features',
        url: '/docs/features',
        active: 'nested-url',
      },
      {
        text: 'Changelog',
        url: '/changelog',
        active: 'nested-url',
      },
      {
        type: 'menu',
        text: 'Resources',
        items: [
          {
            text: 'Registry',
            description: 'Browse packages on lpm.dev',
            url: registryUrl,
          },
          {
            text: 'GitHub',
            description: 'Rust client source',
            url: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
          },
        ],
      },
    ],
  };
}
