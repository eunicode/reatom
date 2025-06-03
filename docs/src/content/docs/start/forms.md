---
title: Forms
description: Getting started with forms in Reatom
---

Reatom has a very advanced form management system to handle complex cases in a type-safe and performant way. You can read more about it in the [form handbook section](/handbook/forms). But in this guide, we'll introduce only the basics.

## Creating a form with Routing Integration

A common and highly effective pattern is to create forms within a route's `loader`. This ties the form's lifecycle to the route, ensuring it's fresh when the route is active and automatically cleaned up when navigating away. This prevents issues like old data persisting after a user logs out and then logs back in.

Let's look at how you would define a login form inside a `loginRoute` loader. The `reatomForm` call is the same as before, but its instantiation is now managed by the routing system.

```ts
// src/routes.ts (Illustrative)
import { route, reatomForm } from '@reatom/core'
// import * as api from './api' // Your API utilities

export const loginRoute = route({
  path: '/login',
  async loader() {
    // This form is created ONLY when /login is active
    // and destroyed when navigating away.
    const loginForm = reatomForm(
      // init state
      {
        username: '',
        password: '',
        passwordDouble: '',
      },
      // options
      {
        validate({ password, passwordDouble }) {
          if (password !== passwordDouble) {
            return 'Passwords do not match'
          }
        },
        onSubmit: async (
          values /*: { username: string, password: string, passwordDouble: string }*/,
        ) => {
          // return await api.login(values)
          console.log('Submitting login form:', values)
          await new Promise(r => setTimeout(r, 1000))
          return { success: true }
        },
        validateOnBlur: true,
        name: 'loginForm', // for debugging
      },
    )
    return { loginForm }
  },
})
```

The first argument to `reatomForm` defines your form structure (`initState`). It doesn't have to be flat - you can nest fields in logical groups using objects. For each key, define the default value, and Reatom will derive the field type from the primitive value.

Each field value can be configured by passing a `reatomField` factory with various options (including individual validation) instead of a primitive value. But for primitive values, Reatom creates a field atom automatically. This is called "atomization" and it gives us many advantages.

## Form structure

The form instance (`loginForm`) created within the loader will have a `submit` action, and computed validation and focus states. It computes from the individual field atoms, which you can find in `loginForm.fields`.

```ts
// loginForm.fields (available via loginRoute.loader.data().loginForm.fields):
username: FieldAtom<string, string>,
password: FieldAtom<string, string>,
passwordDouble: FieldAtom<string, string>
```

Each field atom includes meta atoms like `validation`, `focus`, and others, which you can use for precise control over the form and each field.

## Framework bindings

To use this form in your component, you'll first check if the route is active and then access the form from the route's loader data.

```tsx
// src/components/LoginPage.tsx (Illustrative)
import { reatomComponent, bindField } from '@reatom/react'
import { Button, TextInput, PasswordInput, Stack, Alert } from '@mantine/core'
import { loginRoute } from '../routes' // Your route definition

export const LoginPage = reatomComponent(() => {
  // Ensure the route is active
  const routeIsActive = loginRoute()
  if (!routeIsActive) return null

  // Access data from the loader
  const isLoading = !loginRoute.loader.ready()
  const data = loginRoute.loader.data()
  const error = loginRoute.loader.error()

  if (isLoading) return <div>Loading login page...</div>
  if (error) return <div>Error: {error.message}</div>
  // Ensure data and loginForm are present
  if (!data || !data.loginForm) return <div>Form not available.</div>

  const { loginForm } = data
  const { submit, fields } = loginForm

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        loginForm.submit()
      }}
    >
      <Stack>
        <TextInput
          label="Username"
          placeholder="Enter your username"
          {...bindField(fields.username)}
        />

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          {...bindField(fields.password)}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm your password"
          {...bindField(fields.passwordDouble)}
        />
        
        {/* Display form-level validation error */}
        {loginForm.error() && (
          <Alert color="red" title="Validation Error">
            {loginForm.error().message}
          </Alert>
        )}

        <Button type="submit" loading={!submit.ready()}>
          Login
        </Button>
      </Stack>
    </form>
  )
}, 'LoginPage')
```

This is a simple example, but note that since we have each field as separate atoms, we can create a separate component for each of them and it would be highly optimized and flexible. You can check out a live example in [StackBlitz](https://stackblitz.com/github/artalar/reatom/tree/v1000/examples/react-search).

By integrating form creation with routing, you leverage Reatom's "Computed Factory" pattern. This provides excellent memory management, ensuring form state is automatically cleaned up and re-initialized as needed.

Learn how this routing system works in more detail on the [next page](/start/routing) ;)
