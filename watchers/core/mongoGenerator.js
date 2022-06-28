const CoreModel = require("./mongo-model");
const { db } = require("../database/mongodb");
let models = {};
const genrerateModel = (schema) => {
  return {
    inte() {},
    create: (item) => {
      init(schema);
      return CoreModel.create(models[schema.Name], item);
    },
    createMany: (item) => {
      init(schema);
      return CoreModel.createMany(models[schema.Name], item);
    },
    update: (query, data) => {
      init(schema);
      return CoreModel.update(models[schema.Name], query, data);
    },
    updateMany: (query, data) => {
      init(schema);
      return CoreModel.updateMany(models[schema.Name], query, data);
    },
    updateOrCreate: (criteria, item) => {
      init(schema);
      return CoreModel.updateOrCreate(models[schema.Name], criteria, item);
    },
    remove: (id) => {
      init(schema);
      return CoreModel.remove(models[schema.Name], id);
    },
    removeMany: (criteria = {}) => {
      init(schema);
      return CoreModel.removeMany(models[schema.Name], criteria);
    },
    count: (criteria = {}) => {
      init(schema);
      return CoreModel.count(models[schema.Name], criteria);
    },
    fetch: (criteria = {}, populate) => {
      init(schema);
      return CoreModel.fetch(models[schema.Name], criteria, populate);
    },
    fetchOne: (id, populate) => {
      init(schema);
      return CoreModel.fetchOne(models[schema.Name], id, populate);
    },
    fetchMany: (ids = [], populate) => {
      init(schema);
      return CoreModel.fetchMany(models[schema.Name], ids, populate);
    },
    findOne: (criteria, populate) => {
      init(schema);
      return CoreModel.findOne(models[schema.Name], criteria, populate);
    },
    aggregate: (criteria) => {
      init(schema);
      return CoreModel.aggregate(models[schema.Name], criteria);
    },
    sum: (criteria) => {
      init(schema);
      return CoreModel.sum(models[schema.Name], criteria);
    },
    findOneAndUpdate: (criteria, item, option) => {
      init(schema);
      return CoreModel.findOneAndUpdate(
        models[schema.Name],
        criteria,
        item,
        option
      );
    },
    last: (criteria = {}) => {
      init(schema);
      return models[schema.Name].findOne(criteria).sort({ updatedAt: -1 });
    },
    first: (criteria = {}) => {
      init(schema);
      return models[schema.Name].findOne(criteria).sort({ updatedAt: 1 });
    },
    init: () => {
      init(schema);
    },
  };
};
const init = async (schema) => {
  if (!models[schema.Name]) {
    models[schema.Name] = db().model(schema.Name, schema.Schema);
  }
};

module.exports = {
  genrerateModel,
  getModel: (name) => {
    return models[name];
  },
};
