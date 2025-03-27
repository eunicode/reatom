import { root, RootFrame } from 'src/core'

export let peek: RootFrame['run'] = (cb, ...params) => root().run(cb, ...params)
