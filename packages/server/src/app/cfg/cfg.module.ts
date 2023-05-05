import {Global, Module} from '@nestjs/common'
import {transformAndValidate} from 'class-transformer-validator'
import * as fsExtra from 'fs-extra'
import {readFile} from 'fs/promises'
import {join} from 'path'
import {parse} from 'yaml'
import {HomeDdnsConfig} from './cfg.dto.js'

@Global()
@Module({
  providers: [
    {
      provide: HomeDdnsConfig,
      async useFactory(): Promise<HomeDdnsConfig> {
        const configFile = join(process.cwd(), 'config.yml')
        if (!await fsExtra.pathExists(configFile)) {
          throw new Error('config.yml not found')
        }
        const content = await readFile(configFile, 'utf8')
        const config = await parse(content)
        return transformAndValidate(HomeDdnsConfig, config as object)
      },
    },
  ],
  exports: [
    HomeDdnsConfig,
  ],
})
export class CfgModule {}
