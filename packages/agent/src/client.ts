import {got, type Got} from 'got'

export class Client {
  private readonly client: Got
  constructor(
    server: string,
  ) {
    this.client = got.extend({
      prefixUrl: server,
      responseType: 'json',
    })
  }

  public async updateRecord(domain: string, ip: string): Promise<void> {
    await this.client.post('ddns/update', {
      json: {
        domain,
        ip,
      },
    })
  }
}
