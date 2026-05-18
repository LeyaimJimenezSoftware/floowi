import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantOnboardingFields1713830400000 implements MigrationInterface {
  name = 'AddTenantOnboardingFields1713830400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN studio_type VARCHAR(50),
      ADD COLUMN cover_image_url VARCHAR(500),
      ADD COLUMN business_hours JSONB,
      ADD COLUMN onboarding_completed_at TIMESTAMP
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
      DROP COLUMN IF EXISTS onboarding_completed_at,
      DROP COLUMN IF EXISTS business_hours,
      DROP COLUMN IF EXISTS cover_image_url,
      DROP COLUMN IF EXISTS studio_type
    `);
  }
}
