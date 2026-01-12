/**
 * Migration: Add address_structured JSONB columns to user_profiles and clubs tables
 *
 * This migration adds new JSONB columns to store structured address data
 * while maintaining the existing TEXT columns for backward compatibility
 * during the dual-write transition period.
 *
 * New structured format:
 * {
 *   street: string,
 *   city: string,
 *   county: string,
 *   postcode: string,
 *   country: string
 * }
 */

export async function up(knex) {
  // Add address_structured JSONB column to user_profiles table
  await knex.schema.table('user_profiles', (table) => {
    table.jsonb('address_structured').nullable().comment('Structured address data (street, city, county, postcode, country)');
  });

  // Add address_structured JSONB column to clubs table
  await knex.schema.table('clubs', (table) => {
    table.jsonb('address_structured').nullable().comment('Structured address data (street, city, county, postcode, country)');
  });

  console.log('✅ Added address_structured columns to user_profiles and clubs tables');

  // Note: Keeping the existing 'address' TEXT columns for backward compatibility
  // During dual-write period, both columns will be populated
  // After migration verification, the TEXT columns can be removed in a future migration
}

export async function down(knex) {
  // Remove address_structured column from user_profiles
  await knex.schema.table('user_profiles', (table) => {
    table.dropColumn('address_structured');
  });

  // Remove address_structured column from clubs
  await knex.schema.table('clubs', (table) => {
    table.dropColumn('address_structured');
  });

  console.log('✅ Dropped address_structured columns from user_profiles and clubs tables');
}
