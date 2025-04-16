import { wrap } from '@reatom/core'
import { reatomComponent } from '@reatom/react'
import { search, issues, page } from './model'

export const App = reatomComponent(() => {
  const data = issues.data()
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
      {!issues.ready() && 'Loading...'}
      <ul>
        {data.map(({ title }, i) => (
          <li key={i}>{title}</li>
        ))}

        {data.length === 0 && <i>found nothing</i>}
      </ul>
    </main>
  )
}, 'App')
