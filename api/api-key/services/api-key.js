"use strict";

const { generateRandomString } = require("../../../helpers");
const {
  BASE_API_KEY_LENGTH,
  BASE_API_SECRET_KEY_LENGTH,
} = require("../../../constants");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * generate api key and secret key
 * @param {string} projectOwner project owner's id
 * @param {array} taskIds array of task ids
 * @param {array} routes array of routes
 * @returns new api key
 */
const generateApiKeyWithRoutes = async (
  projectOwner,
  taskIds,
  routes = [
    {
      path: "/tasks/updateInAppTrial",
      method: "POST",
      description: "UpdateInAppTrialTask",
      isPublic: true,
      isProtected: false,
    },
  ]
) => {
  const key =
    generateRandomString(BASE_API_KEY_LENGTH) +
    "-" +
    generateRandomString(BASE_API_KEY_LENGTH);
  const secret = generateRandomString(BASE_API_SECRET_KEY_LENGTH);
  const apiKey = await strapi.services["api-key"].create({
    routes: routes,
    projectOwner,
    key,
    secret,
    tasks: taskIds.map((id) => ({ id: id, code: generateRandomString() })),
  });
  return apiKey;
};

const updateApiKeyTaskListByProjectOwner = async (projectOwner, taskIds) => {
  const apiKey = await strapi.services["api-key"].findOne({
    projectOwner,
    isActive: true,
  });
  if (apiKey) {
    return await strapi.services["api-key"].update(
      { id: apiKey.id },
      {
        tasks: [
          ...apiKey.tasks,
          ...taskIds.map((id) => ({ id: id, code: generateRandomString() })),
        ],
      }
    );
  } else {
    return await generateApiKeyWithRoutes(projectOwner, taskIds);
  }
};

module.exports = {
  generateApiKeyWithRoutes,
  updateApiKeyTaskListByProjectOwner,
};
