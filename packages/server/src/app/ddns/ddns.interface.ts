export type RecordType = 'A' | 'AAAA'
export interface IDDnsProvider {
  name: string
  provider: string
  checkRecord(domain: string, ip: string, type: RecordType): Promise<boolean>
  updateRecord(domain: string, ip: string, type: RecordType): Promise<void>
}
