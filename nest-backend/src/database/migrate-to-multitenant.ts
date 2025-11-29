import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '../config/typeorm.config';
import { User, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Migration script to add ownerId to existing tables
 * Run this script once: npm run migrate:multitenant
 */
async function migrateToMultiTenant() {
  // Load environment variables
  require('dotenv').config();
  
  const configService = new ConfigService();
  const typeOrmConfig = getTypeOrmConfig(configService);
  
  // Create DataSource without synchronize
  const dataSource = new DataSource({
    ...typeOrmConfig,
    type: 'postgres',
    synchronize: false, // Disable synchronize for migration
  } as any);

  try {
    await dataSource.initialize();
    console.log('✓ Connected to database');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Create default admin user if it doesn't exist
      const userRepository = dataSource.getRepository(User);
      let defaultUser = await userRepository.findOne({
        where: { email: 'admin@default.com' }
      });

      if (!defaultUser) {
        console.log('Creating default admin user...');
        const passwordHash = await bcrypt.hash('admin123456', 10);
        
        defaultUser = userRepository.create({
          email: 'admin@default.com',
          passwordHash,
          role: UserRole.ADMIN,
          firstName: 'Default',
          lastName: 'Admin',
          isActive: true,
        });
        defaultUser = await userRepository.save(defaultUser);
        console.log(`✓ Created default admin user with ID: ${defaultUser.id}`);
      } else {
        console.log(`✓ Using existing admin user with ID: ${defaultUser.id}`);
      }

      const defaultUserId = defaultUser.id;

      // Step 2: List of tables that need ownerId
      const tables = [
        'labs',
        'classes',
        'students',
        'attendance',
        'notebooks',
        'course_entries',
        'topics',
        'topic_elements',
        'timetable',
        'behavior_events',
        'grades',
        'workstations',
        'seat_assignments',
        'annual_distribution',
        'holiday_period',
        'progress_tracking',
        'pedagogical_documents',
        'lab_inventory_items',
        'lab_equipments',
        'lab_software',
        'lab_furniture',
        'lab_cleaning',
        'computer_checklists',
        'lab_device_logs',
        'subjects',
      ];

      for (const table of tables) {
        try {
          // Check if table exists
          const tableExists = await queryRunner.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = '${table}'
            )
          `);

          if (!tableExists[0].exists) {
            console.log(`⚠ Skipping ${table} (table does not exist)`);
            continue;
          }

          // Check if column already exists
          const columnExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '${table}' 
            AND column_name = 'ownerId'
          `);

          if (columnExists.length > 0) {
            console.log(`⚠ Column ownerId already exists in ${table}`);
            continue;
          }

          // Step 1: Add column as nullable
          console.log(`Adding ownerId column to ${table}...`);
          await queryRunner.query(`
            ALTER TABLE "${table}" 
            ADD COLUMN "ownerId" integer
          `);

          // Step 2: Fill existing rows with default user ID
          const countResult = await queryRunner.query(`
            SELECT COUNT(*) as count FROM "${table}" WHERE "ownerId" IS NULL
          `);
          const nullCount = parseInt(countResult[0]?.count || '0', 10);
          
          if (nullCount > 0) {
            await queryRunner.query(`
              UPDATE "${table}" 
              SET "ownerId" = $1 
              WHERE "ownerId" IS NULL
            `, [defaultUserId]);
            console.log(`  Filled ${nullCount} rows in ${table}`);
          } else {
            console.log(`  No rows to fill in ${table}`);
          }

          // Step 3: Make it NOT NULL
          await queryRunner.query(`
            ALTER TABLE "${table}" 
            ALTER COLUMN "ownerId" SET NOT NULL
          `);

          // Step 4: Add foreign key constraint
          await queryRunner.query(`
            ALTER TABLE "${table}" 
            ADD CONSTRAINT "FK_${table}_owner" 
            FOREIGN KEY ("ownerId") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE
          `);

          console.log(`✓ Successfully migrated ${table}`);
        } catch (error: any) {
          console.error(`✗ Error migrating ${table}:`, error.message);
          // Continue with other tables
        }
      }

      await queryRunner.commitTransaction();
      console.log('\n✓ Migration completed successfully!');
      console.log(`\nDefault admin credentials:`);
      console.log(`  Email: admin@default.com`);
      console.log(`  Password: admin123456`);
      console.log(`\n⚠️  IMPORTANT: Change the default admin password after first login!`);
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateToMultiTenant();

