import bcrypt from 'bcrypt';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Delete existing entries
  await knex('users').del();
  
  // Hash password directly in seed
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Insert seed entries
  await knex('users').insert([
    {
      email: 'admin@example.com',
      password: hashedPassword,
    },
  ]);
}
