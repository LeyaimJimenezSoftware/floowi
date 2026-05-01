import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';

type TenantScopedEntity = ObjectLiteral & {
  tenantId: string;
};

@Injectable()
export class TenantScopedRepository<T extends TenantScopedEntity> {
  constructor(private readonly repository: Repository<T>) {}

  find(tenantId: string, options: FindManyOptions<T> = {}) {
    this.assertTenant(tenantId);

    return this.repository.find({
      ...options,
      where: this.withTenantWhere(tenantId, options.where),
    });
  }

  findOne(tenantId: string, options: FindOneOptions<T> = {}) {
    this.assertTenant(tenantId);

    return this.repository.findOne({
      ...options,
      where: this.withTenantWhere(tenantId, options.where),
    });
  }

  count(tenantId: string, options: FindManyOptions<T> = {}) {
    this.assertTenant(tenantId);

    return this.repository.count({
      ...options,
      where: this.withTenantWhere(tenantId, options.where),
    });
  }

  private assertTenant(tenantId: string) {
    if (!tenantId) {
      throw new ForbiddenException('tenantId es obligatorio para consultar datos del estudio.');
    }
  }

  private withTenantWhere(
    tenantId: string,
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    if (Array.isArray(where)) {
      return where.map((condition) => ({ ...condition, tenantId }));
    }

    return {
      ...where,
      tenantId,
    } as FindOptionsWhere<T>;
  }
}
