import { MigrationInterface, QueryRunner } from 'typeorm';

export class HashRefreshTokens1713744000000 implements MigrationInterface {
  name = 'HashRefreshTokens1713744000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM refresh_tokens');
    await queryRunner.query('ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash');
    await queryRunner.query('ALTER TABLE refresh_tokens ALTER COLUMN token_hash TYPE VARCHAR(128)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM refresh_tokens');
    await queryRunner.query('ALTER TABLE refresh_tokens ALTER COLUMN token_hash TYPE VARCHAR(500)');
    await queryRunner.query('ALTER TABLE refresh_tokens RENAME COLUMN token_hash TO token');
  }
}
