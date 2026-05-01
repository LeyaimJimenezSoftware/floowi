import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMultiTenantSchema1713657600000 implements MigrationInterface {
  name = 'InitialMultiTenantSchema1713657600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`
      CREATE TABLE tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        logo_url VARCHAR(500),
        address VARCHAR(500),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        phone VARCHAR(50),
        instagram VARCHAR(100),
        theme_color VARCHAR(7) NOT NULL DEFAULT '#4A7C6F',
        typography VARCHAR(100) NOT NULL DEFAULT 'DM Sans',
        timezone VARCHAR(50) NOT NULL DEFAULT 'America/Mexico_City',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(20) NOT NULL DEFAULT 'student',
        is_active BOOLEAN NOT NULL DEFAULT true,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email),
        CONSTRAINT chk_users_role CHECK (role IN ('owner', 'instructor', 'student'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        total_classes INTEGER NOT NULL,
        validity_days INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_packages_total_classes CHECK (total_classes > 0),
        CONSTRAINT chk_packages_validity_days CHECK (validity_days > 0),
        CONSTRAINT chk_packages_price CHECK (price >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        max_capacity INTEGER NOT NULL DEFAULT 10,
        current_bookings INTEGER NOT NULL DEFAULT 0,
        location VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_sessions_status CHECK (status IN ('scheduled', 'cancelled', 'completed')),
        CONSTRAINT chk_sessions_capacity CHECK (max_capacity > 0),
        CONSTRAINT chk_sessions_current_bookings CHECK (current_bookings >= 0),
        CONSTRAINT chk_sessions_time CHECK (end_time > start_time)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
        provider VARCHAR(20) NOT NULL,
        provider_id VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_payments_provider CHECK (provider IN ('mercadopago', 'paypal')),
        CONSTRAINT chk_payments_status CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
        CONSTRAINT chk_payments_amount CHECK (amount >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE student_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
        classes_remaining INTEGER NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        expiring_email_sent BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_student_packages_status CHECK (status IN ('active', 'expired', 'exhausted')),
        CONSTRAINT chk_student_packages_classes_remaining CHECK (classes_remaining >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        student_package_id UUID NOT NULL REFERENCES student_packages(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_bookings_user_session UNIQUE (user_id, session_id),
        CONSTRAINT chk_bookings_status CHECK (status IN ('confirmed', 'cancelled', 'attended'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query('CREATE INDEX idx_users_tenant_email ON users (tenant_id, email)');
    await queryRunner.query(
      'CREATE INDEX idx_packages_tenant_active ON packages (tenant_id, is_active)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_sessions_tenant_start ON sessions (tenant_id, start_time)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_bookings_tenant_user ON bookings (tenant_id, user_id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_student_packages_user ON student_packages (user_id, status)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_student_packages_tenant_status ON student_packages (tenant_id, status)',
    );
    await queryRunner.query('CREATE INDEX idx_payments_tenant ON payments (tenant_id, created_at)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_payments_tenant');
    await queryRunner.query('DROP INDEX IF EXISTS idx_student_packages_tenant_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_student_packages_user');
    await queryRunner.query('DROP INDEX IF EXISTS idx_bookings_tenant_user');
    await queryRunner.query('DROP INDEX IF EXISTS idx_sessions_tenant_start');
    await queryRunner.query('DROP INDEX IF EXISTS idx_packages_tenant_active');
    await queryRunner.query('DROP INDEX IF EXISTS idx_users_tenant_email');
    await queryRunner.query('DROP TABLE IF EXISTS refresh_tokens');
    await queryRunner.query('DROP TABLE IF EXISTS bookings');
    await queryRunner.query('DROP TABLE IF EXISTS student_packages');
    await queryRunner.query('DROP TABLE IF EXISTS payments');
    await queryRunner.query('DROP TABLE IF EXISTS sessions');
    await queryRunner.query('DROP TABLE IF EXISTS packages');
    await queryRunner.query('DROP TABLE IF EXISTS users');
    await queryRunner.query('DROP TABLE IF EXISTS tenants');
  }
}
