import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const sql = postgres(process.env.DATABASE_URL);

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Read and execute migration SQL
    const migrationSQL = fs.readFileSync(path.join(process.cwd(), 'migrate.sql'), 'utf8');
    await sql.unsafe(migrationSQL);
    
    console.log('Database setup complete!');
    
    // Test the connection
    const users = await sql`SELECT * FROM users LIMIT 1`;
    console.log('Test query successful:', users.length > 0 ? 'Demo user exists' : 'No users found');
    
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    await sql.end();
  }
}

setupDatabase();