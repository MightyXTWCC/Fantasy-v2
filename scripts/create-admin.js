import bcrypt from 'bcryptjs';
import { db } from '../server/database.js';

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const username = 'admin';
    const email = 'admin@fantasy-cricket.com';
    const password = 'admin123';
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Delete existing admin user if exists
    await db.deleteFrom('users')
      .where('username', '=', username)
      .execute();
    
    // Create new admin user
    const adminUser = await db.insertInto('users')
      .values({
        username,
        email,
        password_hash: passwordHash,
        is_admin: 1,
        budget: 1000000
      })
      .returningAll()
      .executeTakeFirst();
    
    console.log('Admin user created successfully:');
    console.log('Username:', adminUser.username);
    console.log('Email:', adminUser.email);
    console.log('Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Please change the admin password after first login!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
