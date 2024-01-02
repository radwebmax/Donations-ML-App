const brain = require('brain.js');
const csv = require('csvtojson');
const path = require('path');

const csvFilePath = path.join(__dirname, '../data/db_with_categories_extended.csv'); 
const MAX_MONEY_COLLECTED = 10000000;
const MAX_MONEY_NEEDED = 10000000;
const MAX_COVERAGE = 100000000;
const MAX_DAYS = 30; 


function normalize(value, min, max) {
    return (value - min) / (max - min);
}

function encodeCategory(category) {
    const categories = ['Military', 'Humanitarian', 'Medicine', 'Other'];
    return categories.map(cat => cat === category ? 1 : 0);
}
// Function to normalize input data
const normalizeData = (data) => {
    return data.map(item => ({
        input: [
            normalize(item.coverage, 0, MAX_COVERAGE),
            normalize(item.month, 1, 12),
            normalize(item.moneyCollected, 0, MAX_MONEY_COLLECTED),
            item.promoted === "True" ? 1 : 0,
            ...encodeCategory(item.category),
            normalize(item.daysSpent, 0, MAX_DAYS),
           
        ],
        output: [normalize(item.daysRequired, 0, 30)]
    }));
};

// Function to load and preprocess data
const loadData = async () => {
    try {
        const jsonArray = await csv().fromFile(csvFilePath);
        return normalizeData(jsonArray);
    } catch (err) {
        console.error("Error loading or processing data:", err);
        throw err;
    }
};

// Create a new instance of a Neural Network
const network = new brain.NeuralNetwork({
    inputSize: 9, // 4 original inputs + number of categories
    hiddenLayers: 
    [5, 3, 3]
});
// Function to train the model
const trainModel = async () => {
  const data = await loadData();
    network.trainAsync(data, {
        iterations: 5000,
        errorThresh: 0.001,
        learningRate: 0.9,
        log: (stats) => console.log(stats),
        logPeriod: 100
    }).then(result => {
        console.log('Training finished', result);
    });
};


// Function to preprocess input for prediction
const preprocessInput = (input) => {
    console.log(input)
    return [
        input.coverage,
        normalize(input.month, 1, 12),
        normalize(input.moneyNeeded, 0, MAX_MONEY_NEEDED),
        input.promoted ? 1 : 0,
        ...encodeCategory(input.category),
        normalize(input.daysUntilDeadline, 0, MAX_DAYS),
    ];
};

// Function to make predictions
const predictDaysRequired = (inputData) => {
    return network.run(inputData);
};

module.exports = {
    predictDaysRequired,
    preprocessInput,
    trainModel
};

trainModel();