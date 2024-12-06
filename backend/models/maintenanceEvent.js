const mongoose = require('mongoose');
const AC = require('./AC');

const MaintenanceSchema = new mongoose.Schema({
    title: { type: String },
    date: { type: Date, required: true },
    tasks: { type: [String], required: true },
    acID: { type: mongoose.Schema.Types.ObjectId, ref: 'AC', required: true },
    assignedEmployee: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    details: {
        timeStart: { type: String },
        timeEnd: { type: String },
        status: { type: Boolean, default: false },
        summary: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('MaintenanceEvent', MaintenanceSchema);

