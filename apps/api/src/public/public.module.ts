import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageEntity } from '../packages/package.entity';
import { SessionEntity } from '../sessions/session.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { PublicStudiosController } from './public-studios.controller';
import { PublicStudiosService } from './public-studios.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity, PackageEntity, SessionEntity])],
  controllers: [PublicStudiosController],
  providers: [PublicStudiosService],
})
export class PublicModule {}
