import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseEntities } from './entities';
import { InitialMultiTenantSchema1713657600000 } from './migrations/1713657600000-InitialMultiTenantSchema';
import { HashRefreshTokens1713744000000 } from './migrations/1713744000000-HashRefreshTokens';
import { AddTenantOnboardingFields1713830400000 } from './migrations/1713830400000-AddTenantOnboardingFields';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url:
    process.env.DATABASE_URL ??
    'postgresql://floowiapp:floowiapp_password@localhost:5432/floowiapp',
  entities: databaseEntities,
  migrations: [
    InitialMultiTenantSchema1713657600000,
    HashRefreshTokens1713744000000,
    AddTenantOnboardingFields1713830400000,
  ],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
