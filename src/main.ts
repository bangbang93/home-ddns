import {bootstrap} from './index.js'

bootstrap()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  })
