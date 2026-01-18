/**
 * Reusable utilities for child management operations
 */

import { UserCreationUtils } from './UserCreationUtils.js';
import { ProfileUtils } from './ProfileUtils.js';

export class ChildUtils {
  /**
   * Create a child user with profile and relationship
   */
  static async createChildUserAndRelationship(parentUserId, childData, trx) {
    // Create child user
    const childUser = await UserCreationUtils.createChildUser(parentUserId, trx);

    // Create child profile
    await ProfileUtils.createProfile(childUser.id, {
      firstName: childData.firstName,
      lastName: childData.lastName,
      dateOfBirth: childData.dateOfBirth,
      position: childData.position
    }, trx);

    // Create child relationship
    await trx('user_children').insert({
      parent_user_id: parentUserId,
      child_user_id: childUser.id,
      club_id: childData.clubId || null,
      created_at: new Date(),
      updated_at: new Date()
    });

    return childUser.id;
  }

  /**
   * Create multiple children for a parent
   */
  static async createMultipleChildren(parentUserId, children, trx) {
    const createdChildren = [];
    
    for (const child of children) {
      if (!child.childUserId) {
        throw new Error('Child must have a user account (childUserId) to create relationship');
      }
      
      await trx('user_children').insert({
        parent_user_id: parentUserId,
        child_user_id: child.childUserId,
        club_id: child.clubId || null,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      createdChildren.push({ id: child.childUserId });
    }
    
    return createdChildren;
  }

  /**
   * Update child profile
   */
  static async updateChildProfile(childUserId, childData, trx) {
    return await ProfileUtils.updateProfile(childUserId, {
      firstName: childData.firstName,
      lastName: childData.lastName,
      dateOfBirth: childData.dateOfBirth,
      position: childData.position
    }, trx);
  }

  /**
   * Update child relationship
   */
  static async updateChildRelationship(childId, relationshipData, trx) {
    await trx('user_children')
      .where({ id: childId })
      .update({
        club_id: relationshipData.clubId || null,
        updated_at: new Date()
      });
  }

  /**
   * Get children for a parent
   */
  static async getChildrenForParent(parentUserId, trx) {
    const children = await trx('user_children')
      .leftJoin('user_profiles', 'user_children.child_user_id', 'user_profiles.user_id')
      .leftJoin('clubs', 'user_children.club_id', 'clubs.id')
      .where('user_children.parent_user_id', parentUserId)
      .select(
        'user_children.*',
        'user_profiles.first_name as profile_first_name',
        'user_profiles.last_name as profile_last_name',
        'user_profiles.date_of_birth as profile_dob',
        'user_profiles.avatar',
        'user_profiles.position as child_position',
        'clubs.name as club_name'
      );

    return children.map(child => ({
      id: child.id.toString(),
      childUserId: child.child_user_id?.toString(),
      firstName: child.profile_first_name,
      lastName: child.profile_last_name,
      dateOfBirth: child.profile_dob,
      avatar: child.avatar,
      position: child.child_position || null,
      isRegistered: !!child.child_user_id,
      clubId: child.club_id?.toString(),
      clubName: child.club_name,
      createdAt: child.created_at.toISOString()
    }));
  }

  /**
   * Remove child relationship
   */
  static async removeChildRelationship(childId, trx) {
    await trx('user_children')
      .where({ id: childId })
      .del();
  }

  /**
   * Validate child data
   */
  static validateChildData(childData) {
    if (!childData.firstName || !childData.lastName) {
      throw new Error('Child must have first name and last name');
    }
    
    if (!childData.dateOfBirth) {
      throw new Error('Child must have date of birth');
    }
  }
}
