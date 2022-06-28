"use strict";
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

/**
 * @return promisse
 */
const aggregate = (model, aggregation) => model.aggregate(aggregation);
const findOneAndUpdate = (model, criteria, item, option) =>
  model.findOneAndUpdate(criteria, item, {
    upsert: true,
    new: true,
    ...option,
  });

/**
 * @return promisse
 */
const sum = (model, criteria) => model.sum(criteria);

/**
 * @return promisse
 */
const create = async (model, body) => {
  let { id, ...item } = body;
  item = {
    ...item,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  if (id) item["_id"] = ObjectId(id);
  let data = null;
  if (item.dynamoId) {
    data = await model.findOneAndUpdate(
      { dynamoId: item.dynamoId, vendorId: item.vendorId },
      item,
      {
        upsert: true,
        new: true,
      }
    );
  } else {
    data = await model.create(item);
  }
  return data ? data.toObject() : data;
};
/**\
 * @return promisse
 */
const updateOrCreate = async (model, criteria, item) => {
  item = {
    ...item,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  let data = null;
  if (item.dynamoId) {
    data = await model.findOneAndUpdate(criteria, item, {
      upsert: true,
      new: true,
    });
  } else {
    data = await model.create(item);
  }
  return data ? data.toObject() : data;
};

/**\
 * @return promisse
 */
const createMany = async (model, items) => {
  let data = items.map((item) => {
    return {
      ...item,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  });
  const result = await model.insertMany(data);
  return result.map((d) => d.toObject());
};
/**
 * @params {vendorId, id, ...items}
 * @return promisse
 */
const replaceItem = (model, item) => {};
/**
 * @params {vendorId, id, ...items}
 * @return promisse
 */
const fetchMany = async (model, ids, populate) => {
  const mongoIds = ids.filter((i) => i.length === 24);
  const dynamoIds = ids.filter((i) => i.length != 24);
  let query = model.find({
    $or: [
      {
        _id: {
          $in: mongoIds.map((id) => ObjectId(id)),
        },
      },
      {
        dynamoId: {
          $in: dynamoIds,
        },
      },
    ],
  });
  if (populate) {
    if (typeof populate === "string" || populate instanceof String)
      query.populate(populate.split(":").join(" "));
    else {
      query.populate(populate);
    }
  }
  const data = await query;
  return data.map((d) => d.toObject());
};
/**
 * Get 1 item
 * @params {vendorId, id}
 * @return promisse
 */
const fetchOne = async (model, id, populate) => {
  let data, query;
  if (id && id.length === 24) {
    query = model.findById(ObjectId(id));
  } else {
    query = model.findOne({ dynamoId: id });
  }

  if (populate) {
    if (typeof populate === "string" || populate instanceof String)
      query.populate(populate.split(":").join(" "));
    else {
      query.populate(populate);
    }
  }
  data = await query;

  return data ? data.toObject() : data;
};
/**
 * Get 1 item
 * @params {vendorId, id}
 * @return promisse
 */
const findOne = async (model, criteria, populate) => {
  let data;
  let query = model.findOne(criteria);
  if (populate) {
    if (typeof populate === "string" || populate instanceof String)
      query.populate(populate.split(":").join(" "));
    else {
      query.populate(populate);
    }
  }
  if (populate) query.populate(populate);
  data = await query;
  return data ? data.toObject() : data;
};
/**
 * @params {vendorId, id}
 * @return promisse
 */
const standardQuery = (obj) => {
  let query = {};
  Object.keys(obj).map((item) => {
    if (item.includes("_null")) {
      query[item.split("_null")[0]] = { $exists: obj[item] };
    } else if (item.includes("_nin")) {
      query[item.split("_nin")[0]] = { $nin: obj[item] };
    } else if (item.includes("_in")) {
      query[item.split("_in")[0]] = { $in: obj[item] };
    } else if (item.includes("_contain")) {
      query[item.split("_contain")[0]] = { $regex: obj[item], $options: "i" };
    } else {
      query[item] = obj[item];
    }
  });
  return query;
};
const fetch = async (model, criteria = {}, populate) => {
  const { _skip, _populate, _sort, _limit, ...items } = criteria;
  const param = standardQuery(items);
  if (_populate) {
    populate = _populate.split(":").join(" ");
  }

  let query = model.find(param);
  if (_limit) query.limit(parseInt(criteria._limit));
  if (_skip) query.skip(parseInt(criteria._skip));
  if (!_sort) {
    query.sort({ updatedAt: -1 });
  } else {
    let fields = _sort.trim().split(",");
    if (fields.length > 1) {
      let sorts = {};
      for (let field of fields) {
        const sort = field.trim().split(":");
        sorts[sort[0]] = sort[1];
      }
      query.sort(sorts);
    } else {
      let sort = _sort.split(":");
      query.sort({ [sort[0]]: sort[1] });
    }
  }
  if (populate) {
    if (typeof populate === "string" || populate instanceof String)
      query.populate(populate.split(":").join(" "));
    else {
      query.populate(populate);
    }
  }
  const data = await query;
  return data.map((d) => d.toObject());
};
/**
 * @params {vendorId, id}
 * @return promisse
 */
const count = async (model, criteria = {}) => {
  let query = model.countDocuments(standardQuery(criteria));
  return await query;
};

/**
 * @params {vendorId, id}
 * @return promisse
 */
const search = (model, criteria) => {};
/**
 * @params {vendorId, id}
 * @return promisse
 */
const remove = (model, id) => {
  if (id && id.length === 24) {
    return model.deleteOne({ _id: ObjectId(id) });
  } else {
    return model.deleteOne({ dynamoId: id });
  }
};
/**
 * @params {vendorId, id}
 * @return promisse
 */
const removeMany = (model, criteria = {}) => {
  if (!criteria.vendorId) return;
  return model.deleteMany(criteria);
};
/**
 * @params {vendorId, id}
 * @return promisse
 */
const update = async (model, criteria, data) => {
  const { id, ...query } = criteria;
  if (id) query["_id"] = id;
  const res = await model.findOneAndUpdate(
    query,
    { ...data, updatedAt: new Date().toISOString() },
    { new: true, upsert: true }
  );
  return res ? res.toObject() : res;
};
/**
 * @params {vendorId, id}
 * @return promisse
 */
const updateMany = async (model, query, data) => {
  return await model.updateMany(
    query,
    { ...data, updatedAt: new Date().toISOString() },
    { new: true }
  );
};

module.exports = {
  update,
  create,
  replaceItem,
  fetchOne,
  findOne,
  count,
  fetch,
  remove,
  createMany,
  removeMany,
  fetchMany,
  updateMany,
  aggregate,
  updateOrCreate,
  findOneAndUpdate,
};
