import {Command} from 'commander'
import {readFile} from 'fs/promises'
import {fileURLToPath} from 'url'

const packageJson = await readFile(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')
const pkg = JSON.parse(packageJson)

interface IOptions {
  server: string
  interface: string
}

const program = new Command()
  .name(pkg.name)
  .version(pkg.version)
  .requiredOption('-s, --server <server>', 'server address', parseServer)
  .requiredOption('-i, --interface <interface>', 'interface name')

export const options = program.parse().opts<IOptions>()

function parseServer(server: string): string {
  if (server.startsWith('http://') || server.startsWith('https://')) {
    return server
  }
  return `http://${server}`
}
