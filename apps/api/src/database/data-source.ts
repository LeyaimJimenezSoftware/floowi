import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseEntities } from './entities';
import { InitialMultiTenantSchema1713657600000 } from './migrations/1713657600000-InitialMultiTenantSchema';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url:
    process.env.DATABASE_URL ??
    'postgresql://floowiapp:floowiapp_password@localhost:5432/floowiapp',
  entities: databaseEntities,
  migrations: [InitialMultiTenantSchema1713657600000],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
