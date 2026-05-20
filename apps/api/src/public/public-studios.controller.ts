import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicStudioDto, PublicSessionDto } from './dto/public-studio.dto';
import { PublicStudiosService } from './public-studios.service';

@Controller('public/studios')
export class PublicStudiosController {
  constructor(private readonly publicStudiosService: PublicStudiosService) {}

  @Get(':slug')
  getStudio(@Param('slug') slug: string): Promise<PublicStudioDto> {
    return this.publicStudiosService.getStudioBySlug(slug);
  }

  @Get(':slug/sessions')
  getSessions(@Param('slug') slug: string, @Query('date') date?: string): Promise<PublicSessionDto[]> {
    return this.publicStudiosService.getStudioSessionsByDate(slug, date);
  }
}
