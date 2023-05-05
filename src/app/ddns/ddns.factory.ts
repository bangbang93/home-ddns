import {createError} from '@bangbang93/service-errors'
import type {Constructor} from '@bangbang93/utils'
import {Injectable, type OnModuleInit} from '@nestjs/common'
import {ModuleRef} from '@nestjs/core'
import {HomeDdnsConfig, HomeDnsConfigDdns} from '../cfg/cfg.dto.js'
import type {IDDnsProvider} from './ddns.interface.js'
import {aliyunDDnsFactory} from './factories/aliyun.js'

type DDnsProviderFactory
  = (config: HomeDnsConfigDdns) => Promise<Constructor<IDDnsProvider>> | Constructor<IDDnsProvider>
@Injectable()
export class DDnsFactory implements OnModuleInit {
  private readonly ddnsClients = new Map<string, IDDnsProvider>()
  private readonly ddnsFactories = new Map<string, DDnsProviderFactory>([
    ['aliyun', aliyunDDnsFactory],
  ])

  constructor(
    private readonly cfg: HomeDdnsConfig,
    private readonly moduleRef: ModuleRef,
  ) {}

  public async onModuleInit(): Promise<void> {
    for (const clients of this.cfg.ddns) {
      const factory = this.ddnsFactories.get(clients.provider)
      if (!factory) {
        throw createError.COMMON_NO_SUCH_OBJECT(`ddns供应商 ${clients.provider} 未找到`)
      }
      if (this.ddnsClients.has(clients.name)) {
        throw createError.COMMON_ALREADY_EXISTS(`ddns客户端 ${clients.name} 重复，请检查配置`)
      }
      const ddns = await factory(clients)
      this.ddnsClients.set(clients.name, await this.moduleRef.create(ddns))
    }
  }

  public getByName(name: string): IDDnsProvider {
    const provider = this.ddnsClients.get(name)
    if (!provider) {
      throw createError.COMMON_NO_SUCH_OBJECT(`ddns客户端 ${name} 未找到`)
    }
    return provider
  }
}
