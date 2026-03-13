import {ClassValidationPipe} from '@bangbang93/utils/nestjs/class-validation.pipe'
import {HttpExceptionFilter} from '@bangbang93/utils/nestjs/http-exception.filter'
import {ConfigService} from '@nestjs/config'
import {NestFactory} from '@nestjs/core'
import {AppModule} from './app.module.js'

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('/api')

  app.useGlobalPipes(app.get(ClassValidationPipe))
  app.useGlobalFilters(app.get(HttpExceptionFilter))

  const configService = app.get(ConfigService)

  const port = configService.get<string>('PORT', '3000')

  await app.listen(port)
}
