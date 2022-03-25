"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Update pool type of an apply
 * @param {string} id Apply id
 * @param {string} poolType New pool type
 * @returns Pool type updated apply
 */
const updateApplyPoolType = async (id, poolType) => {
  return await strapi.services.apply.update(
    {
      id,
    },
    {
      poolType,
    }
  );
};

/**
 * Update pool type of an apply to 'priority'
 * @param {string} id Apply id
 * @returns Updated apply
 */
const moveApplyToPriorityPool = async (id) => {
  return await updateApplyPoolType(id, "priority");
};

/**
 * Update pool type of an apply to 'community'
 * @param {string} id Apply id
 * @returns Updated apply
 */
const moveApplyToCommunityPool = async (id) => {
  return await updateApplyPoolType(id, "community");
};

module.exports = {
  updateApplyPoolType,
  moveApplyToPriorityPool,
  moveApplyToCommunityPool,
};
