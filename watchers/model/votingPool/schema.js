const mongoose = require("mongoose");
const COLLECTION = `voting_pools`;
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

let VotingPoolSchema = new Schema(
  {
    startDate: Date,
    endDate: Date,
    ownerAddress: String,
    name: String,
    type: String,
    projectId: String,
    rewardToken: String,
    data: Schema.Types.Mixed,
  },
  {
    collection: COLLECTION,
    bufferCommands: false,
  }
);
VotingPoolSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
VotingPoolSchema.set("toObject", { virtuals: true });
module.exports = {
  Schema: VotingPoolSchema,
  Name: COLLECTION,
};
