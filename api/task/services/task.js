"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Increase a task total participants by an increment
 * @param {string} id task id
 * @param {number} increment number to increase
 * @returns updated task
 */
const increaseTaskTotalParticipantsById = async (id, increment) => {
  return await strapi.services.task.update(
    { id },
    {
      totalParticipants: task.totalParticipants + increment,
    }
  );
};

/**
 * Increase a task total participants by an increment
 * @param {task} task task need to be updated
 * @param {number} increment number to increase
 * @returns updated task
 */
const increaseTaskTotalParticipants = async (task, increment) => {
  return await strapi.services.task.update(
    { id: task.id },
    {
      totalParticipants: task.totalParticipants + increment,
    }
  );
};

/**
 * Update a task total participants
 * @param {string} id task id
 * @returns updated task
 */
const updateTaskTotalParticipantsById = async (id) => {
  const totalParticipants = await strapi.services.apply.count({
    "task.id": id,
  });
  return await strapi.services.task.update(
    { id },
    {
      totalParticipants,
    }
  );
};

module.exports = {
  increaseTaskTotalParticipants,
  increaseTaskTotalParticipantsById,
  updateTaskTotalParticipantsById,
};
