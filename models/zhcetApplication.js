const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const zhcetApplicationSchema = new Schema({
    listing: { type: Schema.Types.ObjectId, ref: 'ZhcetListing', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coverNote: { type: String },
    cvPath: { type: String, required: true }, // Stored filename/path
    cvOriginalName: { type: String },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'accepted', 'rejected'],
        default: 'pending'
    },
    appliedAt: { type: Date, default: Date.now }
});

const ZhcetApplication = mongoose.model('ZhcetApplication', zhcetApplicationSchema);
module.exports = ZhcetApplication;
