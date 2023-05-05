import type {Constructor} from '@bangbang93/utils'
import {Injectable, type OnModuleInit} from '@nestjs/common'
import is from '@sindresorhus/is'
import type Logger from 'bunyan'
import {transformAndValidate} from 'class-transformer-validator'
import {IsString} from 'class-validator'
import {InjectLogger} from 'nestjs-bunyan'
import {isIPv4} from 'net'
import waliyun from 'waliyun'
import type {HomeDnsConfigDdns} from '../../cfg/cfg.dto.js'
import type {IDDnsProvider, RecordType} from '../ddns.interface.js'

export async function aliyunDDnsFactory(config: HomeDnsConfigDdns): Promise<Constructor<IDDnsProvider>> {
  class AliyunConfig {
    @IsString() accessKeyId!: string
    @IsString() accessKeySecret!: string
    @IsString() domain!: string
  }

  if (!is.object(config.options)) {
    throw new Error(`options of ${config.name} is not an object`)
  }
  const options = await transformAndValidate(AliyunConfig, config.options)
  @Injectable()
  class AliyunDDns implements IDDnsProvider, OnModuleInit {
    @InjectLogger() private logger!: Logger
    public readonly name = config.name
    public readonly provider = 'aliyun'

    private readonly client: waliyun.IALIDNS
    private readonly domain: string
    constructor() {
      this.client = waliyun.ALIDNS({
        AccessKeyId: options.accessKeyId,
        AccessKeySecret: options.accessKeySecret,
      })
      this.domain = options.domain
    }

    public onModuleInit(): void {
      this.logger.fields.dnsName = this.name
    }

    public async checkRecord(domain: string, ip: string, type?: RecordType): Promise<boolean> {
      this.logger.trace(`check record ${domain} ${ip} ${type}`)
      const subDomain = this.getSubDomain(domain)
      const res = await this.client.DescribeSubDomainRecords({
        SubDomain: subDomain,
        DomainName: this.domain,
      })
      if (res.DomainRecords.Record.length === 0) {
        this.logger.trace('no record found')
        return false
      }
      if (!type) {
        type = isIPv4(ip) ? 'A' : 'AAAA'
      }
      for (const record of res.DomainRecords.Record) {
        if (record.Type === type && record.Value === ip) {
          this.logger.trace({record}, 'record found')
          return true
        }
      }
      return false
    }

    public async updateRecord(domain: string, ip: string, type?: RecordType): Promise<void> {
      this.logger.trace(`update record ${domain} ${ip} ${type}`)
      const subDomain = this.getSubDomain(domain)
      const res = await this.client.DescribeSubDomainRecords({
        SubDomain: subDomain,
        DomainName: this.domain,
      })
      if (res.DomainRecords.Record.length === 0) {
        this.logger.trace('no record found for update')
        return this.add(domain, ip, type)
      }
      if (!type) {
        type = isIPv4(ip) ? 'A' : 'AAAA'
      }
      let updated = false
      for (const exists of res.DomainRecords.Record) {
        if (exists.Type === type && exists.Value !== ip) {
          updated = true
          await this.client.UpdateDomainRecord({
            RecordId: exists.RecordId,
            RR: subDomain,
            Type: type,
            Value: ip,
            TTL: 60,
          })
        }
      }
      if (!updated) {
        await this.add(domain, ip, type)
      }
    }

    private async add(domain: string, ip: string, type?: RecordType): Promise<void> {
      this.logger.trace(`add record ${domain} ${ip} ${type}`)
      if (!type) {
        type = isIPv4(ip) ? 'A' : 'AAAA'
      }
      const subDomain = this.getSubDomain(domain)
      await this.client.AddDomainRecord({
        DomainName: this.domain,
        RR: subDomain,
        Type: type,
        Value: ip,
        TTL: 60,
      })
    }

    private getSubDomain(domain: string): string {
      return domain.replace(`.${this.domain}`, '')
    }
  }

  return AliyunDDns
}
