import { group } from './config/sidebar'
import { makeSidebar } from './config/integrations/package-reference'

import { adapters } from './adapters.config'

export const sidebar = [
  group('Start', {
    items: [
      'start/setup',
      'start/atoms',
      'start/actions',
      'start/async',
      'start/forms',
      'start/persist',
      'start/routing',
      'start/tooling',
    ],
  }),

  group('Handbook', {
    items: [
      'handbook/history',
      'handbook/atomization',
      'handbook/extensions',
      'handbook/lifecycle',
      'handbook/async-context',
      'handbook/sampling',
    ],
  }),

  group('Guides', {
    autogenerate: {
      directory: 'guides',
    },
  }),

  group('Adapters', {
    items: await makeSidebar(adapters, { prefix: 'adapters' }),
  }),
]
