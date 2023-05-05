import {Module} from '@nestjs/common'
import {CfgModule} from '../cfg/cfg.module.js'
import {DDnsFactory} from './ddns.factory.js'

@Module({
  imports: [
    CfgModule,
  ],
  providers: [
    DDnsFactory,
  ],
  exports: [
    DDnsFactory,
  ],
})
export class DdnsModule {}
