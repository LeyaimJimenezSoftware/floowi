import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    description: 'Railway-compatible health check.',
    schema: {
      example: {
        status: 'ok',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
    };
  }
}
