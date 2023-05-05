import {ClassValidationPipe} from '@bangbang93/utils/nestjs/class-validation.pipe.js'
import {HttpExceptionFilter} from '@bangbang93/utils/nestjs/http-exception.filter.js'
import {Module} from '@nestjs/common'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {BunyanLoggerModule} from 'nestjs-bunyan'
import {fileURLToPath} from 'url'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: fileURLToPath(new URL('../../.env', import.meta.url)),
      load: [() => ({
        PROJECT_ROOT: fileURLToPath(new URL('../../', import.meta.url)),
        APP_NAME: 'home-ddns',
      })],
    }),
    BunyanLoggerModule.forRootAsync({
      isGlobal: true,
      bunyan: {
        inject: [ConfigService],
        useFactory(configService: ConfigService) {
          return {
            name: 'home-ddns',
            level: configService.get('LOGLEVEL', 'trace'),
          }
        },
      },
    }),
  ],
  providers: [
    ClassValidationPipe,
    HttpExceptionFilter,
  ],
})
export class AppModule {}
