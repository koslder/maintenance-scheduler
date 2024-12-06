const mongoose = require('mongoose');

const maintenanceHistorySchema = new mongoose.Schema(
    {
        date: { type: Date, required: true },
        description: { type: String, required: true },
        employee: { type: String, required: true }, // The employee who logged or supervised the event
        assignedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // All employees involved
        status: { type: Boolean, required: true, default: false }, // Status of the maintenance event (completed or not)
        summary: { type: String }, // Summary or notes about the event
        tasks: { type: [String], default: [] || 'N/A' },
    },
    { _id: false } // Prevent automatic _id for subdocuments
);

const acSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        location: { type: String, required: true },
        watts: { type: Number, required: true },
        id: { type: String, required: true, unique: true },
        maintenanceHistory: { type: [maintenanceHistorySchema], default: [] },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const AC = mongoose.model('AC', acSchema);

module.exports = AC;
