import { reatomComponent } from '@reatom/npm-react'
import { search, issuesResource, page } from './model'
import { wrap } from '@reatom/core'

export const App = reatomComponent(() => {
  // const isLoading = Boolean(ctx.spy(issuesResource.pendingAtom) || ctx.spy(issuesResource.retriesAtom))

  return (
    <main>
      <input
        value={search()}
        onChange={wrap((e) => search(e.currentTarget.value))}
        placeholder="Search"
      />
      <button disabled={!page()} onClick={wrap(page.prev)}>
        {'<'}
      </button>
      {page()}
      <button onClick={wrap(page.next)}>{'>'}</button>
      {!issuesResource.ready() && 'Loading...'}
      <ul>
        {issuesResource.data().map(({ title }, i) => (
          <li key={i}>{title}</li>
        ))}

        {issuesResource.data().length === 0 && <i>found nothing</i>}
      </ul>
    </main>
  )
}, 'App')
