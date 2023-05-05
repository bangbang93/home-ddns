declare module 'waliyun' {

  export interface IAliDnsConstructorOptions {
    AccessKeyId: string
    AccessKeySecret: string
  }
  interface IAliDnsDescribeSubDomainRecordsRequest {
    SubDomain: string
    DomainName?: string
  }
  interface IAliDnsDescribeSubDomainRecordsResponse {
    DomainRecords: {
      Record: {
        RecordId: string
        RR: string
        Type: string
        Value: string
      }[]
    }
  }
  interface IALIDNS {
    DescribeSubDomainRecords(
      options: IAliDnsDescribeSubDomainRecordsRequest
    ): Promise<IAliDnsDescribeSubDomainRecordsResponse>

    UpdateDomainRecord(options: { RecordId: string;RR: string;Type: string;Value: string;TTL: number }): Promise<void>
    AddDomainRecord(options: { DomainName: string;RR: string;Type: string;Value: string;TTL: number }): Promise<void>
    DeleteDomainRecord(options: { RecordId: string }): Promise<void>
  }

  export function ALIDNS(options: IAliDnsConstructorOptions): IALIDNS
}
