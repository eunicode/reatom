import type { StarlightIcon } from '@astrojs/starlight/types'

import { group } from './config/sidebar'
import { makeSidebar } from './config/integrations/package-reference'

import { adapters } from './adapters.config'

export const sidebar = [
  group('Start', {
    badge: icon('rocket'),
    items: [
      'start/base',
      'start/actions',
      'start/extensions',
      'start/forms',
      'start/routing',
      'start/tooling',
    ],
  }),

  group('Handbook', {
    badge: icon('open-book'),
    items: [
      'handbook/history',
      'handbook/atomization',
      'handbook/extensions',
      'handbook/async-context',
      'handbook/async',
      'handbook/lifecycle',
      'handbook/forms',
      'handbook/routing',
      'handbook/sampling',
    ],
  }),

  group('Guides', {
    badge: icon('puzzle'),
    autogenerate: {
      directory: 'guides',
    },
  }),

  group('Adapters', {
    badge: icon('information'),
    items: await makeSidebar(adapters, { prefix: 'adapters' }),
  }),
]
function icon(iconName: StarlightIcon) {
  return iconName
}
