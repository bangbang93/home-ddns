import {Type} from 'class-transformer'
import {IsArray, IsObject, IsOptional, IsString, ValidateNested} from 'class-validator'

export class HomeDnsConfigDdns {
  @IsString() name!: string
  @IsString() provider!: string
  @IsOptional() @IsObject() options?: unknown
}
export class HomeDdnsConfig {
  @IsArray() @Type(() => HomeDnsConfigDdns) @ValidateNested({each: true})
    ddns!: HomeDnsConfigDdns[]
}
