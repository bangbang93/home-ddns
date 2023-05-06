import {networkInterfaces} from 'os'

export function getIpV6(itf: string): string {
  const ifs = networkInterfaces()
  const addresses = ifs[itf]
  if (!addresses) {
    throw new Error(`interface ${itf} not found`)
  }
  for (const address of addresses) {
    if (address.family === 'IPv6') {
      return address.address
    }
  }
  throw new Error(`IPv6 address of ${itf} not found`)
}
