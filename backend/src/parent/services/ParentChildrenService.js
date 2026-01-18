/**
 * Parent Children Service
 *
 * Handles business logic for parent child management operations
 */

class ParentChildrenService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Update child profile information
   * @param {number} parentUserId - The parent's user ID from JWT
   * @param {number} childId - The user_children.id (NOT child_user_id)
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated child data
   */
  async updateChild(parentUserId, childId, updateData) {
    return await this.db.transaction(async (trx) => {
      // Step 1: Verify ownership (parent owns this child)
      const childRecord = await trx('user_children')
        .where({
          id: childId,
          parent_user_id: parentUserId
        })
        .first();

      if (!childRecord) {
        const error = new Error('Child not found or you do not have permission to edit this child');
        error.statusCode = 404;
        throw error;
      }

      // Step 2: Validate input data
      this.validateChildUpdate(updateData);

      // Step 3: Prepare update object (only update provided fields)
      const profileUpdate = {};
      if (updateData.firstName !== undefined) profileUpdate.first_name = updateData.firstName;
      if (updateData.lastName !== undefined) profileUpdate.last_name = updateData.lastName;
      if (updateData.dateOfBirth !== undefined) profileUpdate.date_of_birth = updateData.dateOfBirth;
      if (updateData.position !== undefined) profileUpdate.position = updateData.position;
      if (updateData.medicalInfo !== undefined) profileUpdate.medical_info = updateData.medicalInfo;
      if (updateData.emergencyContact !== undefined) profileUpdate.emergency_contact = updateData.emergencyContact;
      if (updateData.phone !== undefined) profileUpdate.phone = updateData.phone;
      if (updateData.address !== undefined) profileUpdate.address = updateData.address;
      profileUpdate.updated_at = new Date();

      // Step 4: Update user_profiles table
      await trx('user_profiles')
        .where({ user_id: childRecord.child_user_id })
        .update(profileUpdate);

      // Step 5: Fetch and return updated child data
      const updatedChild = await trx('user_children')
        .leftJoin('user_profiles', 'user_children.child_user_id', 'user_profiles.user_id')
        .leftJoin('clubs', 'user_children.club_id', 'clubs.id')
        .where('user_children.id', childId)
        .select(
          'user_children.id',
          'user_children.child_user_id',
          'user_children.club_id',
          'user_profiles.first_name',
          'user_profiles.last_name',
          'user_profiles.date_of_birth',
          'user_profiles.position',
          'user_profiles.medical_info',
          'user_profiles.emergency_contact',
          'user_profiles.phone',
          'user_profiles.address',
          'user_profiles.avatar',
          'clubs.name as club_name'
        )
        .first();

      return {
        id: updatedChild.id,
        firstName: updatedChild.first_name,
        lastName: updatedChild.last_name,
        dateOfBirth: updatedChild.date_of_birth,
        position: updatedChild.position,
        medicalInfo: updatedChild.medical_info,
        emergencyContact: updatedChild.emergency_contact,
        phone: updatedChild.phone,
        address: updatedChild.address,
        profileImage: updatedChild.avatar,
        childUserId: updatedChild.child_user_id,
        clubId: updatedChild.club_id,
        clubName: updatedChild.club_name
      };
    });
  }

  /**
   * Create a new child for a parent
   * @param {number} parentUserId - The parent's user ID from JWT
   * @param {Object} childData - Child data (firstName, lastName, dateOfBirth, etc.)
   * @returns {Promise<Object>} Created child data
   */
  async createChild(parentUserId, childData) {
    return await this.db.transaction(async (trx) => {
      // Step 1: Validate input data
      this.validateChildData(childData);

      // Step 2: Get parent's club ID
      const parentClub = await trx('user_children')
        .where({ parent_user_id: parentUserId })
        .first();

      if (!parentClub) {
        const error = new Error('Parent must be associated with a club to add children');
        error.statusCode = 400;
        throw error;
      }

      const clubId = parentClub.club_id;

      // Step 3: Create user account for the child (matching existing pattern)
      const [childUser] = await trx('users')
        .insert({
          email: `${parentUserId}.${Date.now()}@child.local`,
          password: 'temp_password',
          email_verified: false,
          is_onboarded: false,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning(['id']);

      // Step 4: Create user_profiles entry
      await trx('user_profiles')
        .insert({
          user_id: childUser.id,
          first_name: childData.firstName,
          last_name: childData.lastName,
          date_of_birth: childData.dateOfBirth,
          position: childData.position || null,
          medical_info: childData.medicalInfo || null,
          emergency_contact: childData.emergencyContact || null,
          phone: childData.phone || null,
          address: childData.address || null,
          created_at: new Date(),
          updated_at: new Date()
        });

      // Step 5: Create user_children relationship
      const [childRecord] = await trx('user_children')
        .insert({
          parent_user_id: parentUserId,
          child_user_id: childUser.id,
          club_id: clubId,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // Step 6: Return created child data
      return {
        id: childRecord.id,
        firstName: childData.firstName,
        lastName: childData.lastName,
        dateOfBirth: childData.dateOfBirth,
        position: childData.position || null,
        medicalInfo: childData.medicalInfo || null,
        emergencyContact: childData.emergencyContact || null,
        phone: childData.phone || null,
        address: childData.address || null,
        childUserId: childUser.id,
        clubId: clubId
      };
    });
  }

  /**
   * Validate child data for creation
   * @param {Object} data - Child data to validate
   * @throws {Error} Validation error with statusCode 400
   */
  validateChildData(data) {
    const errors = [];

    // Required fields
    if (!data.firstName || !data.firstName.trim()) {
      errors.push('First name is required');
    }
    if (!data.lastName || !data.lastName.trim()) {
      errors.push('Last name is required');
    }
    if (!data.dateOfBirth) {
      errors.push('Date of birth is required');
    }

    // Date of birth validation
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push('Invalid date of birth');
      } else {
        // Age validation (5-18 years)
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 5 || age > 18) {
          errors.push('Member must be between 5 and 18 years old');
        }
      }
    }

    // Position validation
    if (data.position) {
      const validPositions = [
        'Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger',
        'Striker', 'Center Back', 'Full Back', 'Defensive Midfielder',
        'Attacking Midfielder', 'Other'
      ];
      if (!validPositions.includes(data.position)) {
        errors.push('Invalid position');
      }
    }

    if (errors.length > 0) {
      const error = new Error(errors.join(', '));
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Validate child update data
   * @param {Object} data - Update data to validate
   * @throws {Error} Validation error with statusCode 400
   */
  validateChildUpdate(data) {
    const errors = [];

    // Required fields validation
    if (data.firstName !== undefined && !data.firstName.trim()) {
      errors.push('First name is required');
    }
    if (data.lastName !== undefined && !data.lastName.trim()) {
      errors.push('Last name is required');
    }

    // Date of birth validation
    if (data.dateOfBirth !== undefined) {
      const dob = new Date(data.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push('Invalid date of birth');
      } else {
        // Age validation (5-18 years - from system config)
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 5 || age > 18) {
          errors.push('Member must be between 5 and 18 years old');
        }
      }
    }

    // Position validation
    if (data.position !== undefined && data.position) {
      const validPositions = [
        'Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger',
        'Striker', 'Center Back', 'Full Back', 'Defensive Midfielder',
        'Attacking Midfielder', 'Other'
      ];
      if (!validPositions.includes(data.position)) {
        errors.push('Invalid position');
      }
    }

    if (errors.length > 0) {
      const error = new Error(errors.join(', '));
      error.statusCode = 400;
      throw error;
    }
  }
}

export { ParentChildrenService };
