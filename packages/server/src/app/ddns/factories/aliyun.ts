import {Config} from '@alicloud/openapi-client'
import type {Constructor} from '@bangbang93/utils'
import {Injectable, type OnModuleInit} from '@nestjs/common'
import is from '@sindresorhus/is'
import type Logger from 'bunyan'
import {transformAndValidate} from 'class-transformer-validator'
import {IsString} from 'class-validator'
import {get} from 'lodash-es'
import {InjectLogger} from 'nestjs-bunyan'
import {isIPv4} from 'net'
import type {HomeDnsConfigDdns} from '../../cfg/cfg.dto'
import type {IDDnsProvider, RecordType} from '../ddns.interface'
import AliDns, {
  AddDomainRecordRequest, DescribeSubDomainRecordsRequest, UpdateDomainRecordRequest,
} from '@alicloud/alidns20150109'

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

    private readonly client: AliDns
    private readonly domain: string
    constructor() {
      const config = new Config({
        accessKeyId: options.accessKeyId,
        accessKeySecret: options.accessKeySecret,
      })
      config.endpoint = 'alidns.cn-hangzhou.aliyuncs.com'
      // 阿里云sdk对esm的支持有问题，这里需要强制转换
      const client = get(AliDns, 'default') as unknown as typeof AliDns
      this.client = new client(config)
      this.domain = options.domain
    }

    public onModuleInit(): void {
      this.logger.fields.dnsName = this.name
    }

    public async checkRecord(domain: string, ip: string, type?: RecordType): Promise<boolean> {
      this.logger.trace(`check record ${domain} ${ip} ${type}`)
      const subDomain = this.getSubDomain(domain)
      const res = await this.client.describeSubDomainRecords(new DescribeSubDomainRecordsRequest({
        subDomain,
        domainName: this.domain,
      }))
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
      const res = await this.client.describeSubDomainRecords(new DescribeSubDomainRecordsRequest({
        subDomain,
        domainName: this.domain,
      }))
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
          await this.client.updateDomainRecord(new UpdateDomainRecordRequest({
            recordId: exists.RecordId,
            RR: subDomain,
            type,
            value: ip,
            TTL: 60,
          }))
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
      await this.client.addDomainRecord(new AddDomainRecordRequest({
        domainName: this.domain,
        RR: subDomain,
        type,
        value: ip,
        TTL: 60,
      }))
    }

    private getSubDomain(domain: string): string {
      return domain.replace(`.${this.domain}`, '')
    }
  }

  return AliyunDDns
}
