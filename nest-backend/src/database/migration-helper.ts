import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';

/**
 * Migration helper to add ownerId to existing tables
 * This script should be run once to migrate existing data
 */
export async function migrateExistingDataToMultiTenant(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    console.log('Starting multi-tenant migration...');

    // Step 1: Create a default admin user if it doesn't exist
    const userRepository = dataSource.getRepository(User);
    let defaultUser = await userRepository.findOne({
      where: { email: 'admin@default.com' }
    });

    if (!defaultUser) {
      console.log('Creating default admin user...');
      const bcrypt = require('bcrypt');
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
      console.log(`Created default admin user with ID: ${defaultUser.id}`);
    } else {
      console.log(`Using existing admin user with ID: ${defaultUser.id}`);
    }

    const defaultUserId = defaultUser.id;

    // Step 2: Add ownerId column as nullable first
    const tables = [
      'labs',
      'classes',
      'students',
      'attendance',
      'notebooks',
      'topics',
      'timetable',
      'behavior_events',
      'grades',
      'workstations',
      'annual_distribution',
      'holiday_periods',
      'progress_tracking',
      'pedagogical_documents',
      'lab_inventory_items',
      'lab_equipment',
      'lab_software',
      'lab_furniture',
      'lab_cleaning_logs',
      'computer_checklists',
      'lab_device_logs',
      'topic_elements',
      'subjects',
    ];

    for (const table of tables) {
      try {
        // Check if column already exists
        const columnExists = await queryRunner.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${table}' 
          AND column_name = 'ownerId'
        `);

        if (columnExists.length > 0) {
          console.log(`Column ownerId already exists in ${table}`);
          continue;
        }

        // Add column as nullable first
        console.log(`Adding ownerId column to ${table}...`);
        await queryRunner.query(`
          ALTER TABLE "${table}" 
          ADD COLUMN "ownerId" integer
        `);

        // Fill existing rows with default user ID
        console.log(`Filling existing data in ${table} with default user...`);
        await queryRunner.query(`
          UPDATE "${table}" 
          SET "ownerId" = ${defaultUserId} 
          WHERE "ownerId" IS NULL
        `);

        // Now make it NOT NULL
        console.log(`Making ownerId NOT NULL in ${table}...`);
        await queryRunner.query(`
          ALTER TABLE "${table}" 
          ALTER COLUMN "ownerId" SET NOT NULL
        `);

        // Add foreign key constraint
        console.log(`Adding foreign key constraint to ${table}...`);
        await queryRunner.query(`
          ALTER TABLE "${table}" 
          ADD CONSTRAINT "FK_${table}_owner" 
          FOREIGN KEY ("ownerId") 
          REFERENCES "users"("id") 
          ON DELETE CASCADE
        `);

        console.log(`✓ Successfully migrated ${table}`);
      } catch (error: any) {
        console.error(`Error migrating ${table}:`, error.message);
        // Continue with other tables
      }
    }

    await queryRunner.commitTransaction();
    console.log('✓ Migration completed successfully!');
    console.log(`Default admin credentials: admin@default.com / admin123456`);
    console.log('⚠️ IMPORTANT: Change the default admin password after first login!');
    
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}




