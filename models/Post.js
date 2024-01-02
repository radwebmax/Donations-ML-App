const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    name: { type: String, required: true },  
    description: { type: String, required: true }, 
    month: { type: Number, required: true, min: 1, max: 12 },
    moneyNeeded: { type: Number, required: true },
    moneyCollected: { type: Number, default: 0 },
    promoted: { type: Boolean, default: false },
    deadline: { type: Date, required: true },
    predictedDeadline: { type: Date },
    creationDate: { type: Date, default: Date.now },
    daysSpent: { type: Number, default: null },
    category: { 
        type: String, 
        required: true, 
        enum: ['Military', 'Humanitarian', 'Medicine', 'Other']
    },
    coverage: { type: Number, default: 0 },
    monobankUrl: { type: String }, 
    privatUrl: { type: String },  
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'Pending' }
});

module.exports = mongoose.model('Post', postSchema);
