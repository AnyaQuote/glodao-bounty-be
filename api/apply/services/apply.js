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
 * Update task data of an apply
 * @param {string} id Apply id
 * @param {object} taskData Apply's task data
 * @returns {Promise}
 */
const updateApplyTaskDataById = async (id, taskData) => {
  return await strapi.services.apply.update(
    {
      id,
    },
    {
      data: taskData,
    }
  );
};

/**
 * Update apply status to new status
 * @param {string} id Apply id
 * @param {string} status new status
 * @returns {Promise} Updated apply
 */
const changeApplyStatus = async (id, status) => {
  return await strapi.services.apply.update(
    {
      id,
    },
    {
      status,
    }
  );
};

/**
 * Change apply status to complete
 * @param {string} id Apply id
 * @returns {Promise} Updated apply
 */
const changeApplyStatusToCompleted = async (id) => {
  return await changeApplyStatus(id, "completed");
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
  moveApplyToPriorityPool,
  moveApplyToCommunityPool,
  updateApplyTaskDataById,
  changeApplyStatusToCompleted,
};
