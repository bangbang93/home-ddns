import {createError} from '@bangbang93/service-errors'
import type {Constructor} from '@bangbang93/utils'
import {Injectable, type OnModuleInit} from '@nestjs/common'
import {ModuleRef} from '@nestjs/core'
import {HomeDdnsConfig, HomeDnsConfigDdns} from '../cfg/cfg.dto.js'
import type {IDDnsProvider} from './ddns.interface.js'
import {getAliyunDDnsProvider} from './providers/aliyun.js'

type DDnsProviderFactory
  = (config: HomeDnsConfigDdns) => Promise<Constructor<IDDnsProvider>> | Constructor<IDDnsProvider>
@Injectable()
export class DDnsFactory implements OnModuleInit {
  private readonly ddns = new Map<string, IDDnsProvider>()
  private readonly ddnsProviders = new Map<string, DDnsProviderFactory>([
    ['aliyun', getAliyunDDnsProvider],
  ])

  constructor(
    private readonly cfg: HomeDdnsConfig,
    private readonly moduleRef: ModuleRef,
  ) {}

  public async onModuleInit(): Promise<void> {
    for (const provider of this.cfg.ddns) {
      const factory = this.ddnsProviders.get(provider.provider)
      if (!factory) {
        throw new Error(`DDnsProvider ${provider.provider} not found`)
      }
      const ddns = await factory(provider)
      this.ddns.set(provider.name, await this.moduleRef.create(ddns))
    }
  }

  public getByName(name: string): IDDnsProvider {
    const provider = this.ddns.get(name)
    if (!provider) {
      throw createError.COMMON_NO_SUCH_OBJECT(`DDnsProvider ${name} not found`)
    }
    return provider
  }
}
