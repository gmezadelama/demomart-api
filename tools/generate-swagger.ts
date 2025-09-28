import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';

async function generateSwaggerSpec() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Demomart API')
    .setDescription('API documentation for Demomart')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('openapi-spec.json', JSON.stringify(document, null, 2));
  await app.close();
}

generateSwaggerSpec()
  .then(() => {
    console.log('Swagger spec generated successfully.');
  })
  .catch((err) => {
    console.error('Error generating Swagger spec:', err);
    process.exit(1);
  });
