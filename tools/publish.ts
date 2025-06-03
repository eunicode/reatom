import 'zx/globals'

import fs from 'fs/promises'
import path from 'path'
import { createInterface } from 'readline'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

let otpCache: string

const main = async () => {
  const packages = await fs.readdir(path.join(process.cwd(), 'packages'))

  $.log = () => {}

  for (const packageName of packages) {
    const packagePath = path.join(process.cwd(), 'packages', packageName)
    const packageJSONPath = path.join(packagePath, 'package.json')

    const packageJSON = JSON.parse(await fs.readFile(packageJSONPath, 'utf8'))
    const tag = packageJSON.publishConfig?.tag ?? 'latest'

    if (packageJSON.private) continue

    let npmVersion = '-1'
    try {
      npmVersion = (
        await $`pnpm view @reatom/${packageName}@${tag} version`
      ).stdout.trim()
    } catch (error) {
      console.warn(`"${packageName}" is not published yet`)

      let answer = await new Promise((r) =>
        rl.question('continue?(y/n = y)', r),
      )
      answer ||= 'y'
      if (answer !== 'y') continue
    }

    if (packageJSON.version === npmVersion) {
      console.log(`${packageName}@${npmVersion} is up to date`)
    } else {
      const otp = (otpCache = await new Promise((r) => {
        let message = `Enter OTP code for "${packageName}@${packageJSON.version}"`
        if (otpCache) message += ` (${otpCache})`
        rl.question(`${message}: `, (otp) => r(otp || otpCache))
      }))

      if (!otp) throw new Error('OTP code missed')

      await $`cd ${packagePath} && pnpm publish --otp=${otp} --access public`
    }
  }

  process.exit()
}

main()
