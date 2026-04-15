const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const zhcetListingSchema = new Schema({
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requirements: { type: String },
    seats: { type: Number, default: null },
    duration: { type: String },
    stipend: { type: String },
    eligibility: { type: String },
    deadline: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    applications: [{ type: Schema.Types.ObjectId, ref: 'ZhcetApplication' }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const ZhcetListing = mongoose.model('ZhcetListing', zhcetListingSchema);
module.exports = ZhcetListing;
