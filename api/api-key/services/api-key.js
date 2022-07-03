"use strict";

const { generateRandomString } = require("../../../helpers");
const {
  BASE_API_KEY_LENGTH,
  BASE_API_SECRET_KEY_LENGTH,
} = require("../../../constants");
const { isEmpty, toLower, isEqual, isEqualWith } = require("lodash");

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

const isApiKeyAuthorized = async (key, secret, request, taskCode = "") => {
  const apiKey = await strapi.services["api-key"].findOne({
    key,
    secret,
    isActive: true,
  });
  if (isEmpty(apiKey)) {
    return false;
  }
  const { path, method } = request;
  const route = apiKey.routes.find((route) => {
    return (
      isEqualWith(route.path, path, toLower) &&
      isEqualWith(route.method, method, toLower)
    );
  });
  if (isEmpty(route)) {
    return false;
  }
  if (!isEmpty(taskCode)) {
    const task = apiKey.tasks.find((task) => isEqual(task.code, taskCode));
    if (isEmpty(task)) {
      return false;
    }
  }
  return true;
};

const isApiKeyAuthorizedByObject = async (apiKey, request, taskCode = "") => {
  if (isEmpty(apiKey)) {
    return false;
  }
  const { path, method } = request;
  const route = apiKey.routes.find((route) => {
    return (
      isEqualWith(route.path, path, toLower) &&
      isEqualWith(route.method, method, toLower)
    );
  });
  if (isEmpty(route)) {
    return false;
  }
  if (!isEmpty(taskCode)) {
    const task = apiKey.tasks.find((task) => isEqual(task.code, taskCode));
    if (isEmpty(task)) {
      return false;
    }
  }
  return true;
};

module.exports = {
  generateApiKeyWithRoutes,
  updateApiKeyTaskListByProjectOwner,
  isApiKeyAuthorized,
  isApiKeyAuthorizedByObject,
};
