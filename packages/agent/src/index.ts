import {CronJob} from 'cron'
import {Client} from './client.js'
import {getIpV6} from './network.js'
import {options} from './options.js'

const client = new Client(options.server)

let lastIp: string | undefined

async function checkIp(): Promise<void>  {
  const ip = getIpV6(options.interface)
  if (ip === lastIp) return
  lastIp = ip
  await client.updateRecord(options.interface, ip)
}

await checkIp()

const job = new CronJob('*/5 * * * * *', checkIp)
job.start()
