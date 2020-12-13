'use strict';
const {
    USER_NAME: userName,
    USER_ID: userId,
    REGION: region,
    GET_USER_LAMBDA,
} = process.env;

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region });
const { get } = require('lodash');
const { getAlexaResponse, roundAbs } = require('./helpers');

const getUser = async id => {
    const payload = {
        body: { id }
    };
    return await lambda.invoke({
        FunctionName: GET_USER_LAMBDA,
        Payload: JSON.stringify(payload, null, 2),
        InvocationType: "RequestResponse"
    }).promise();
}

const hasProfit = money => money >= 0;

const getPrice = (stockData, name) => {
    const { price } = stockData.find(stock => stock.name.includes(name)) || {};
    return price;
};

const getAlexaPhrase = async (currentData, previousData, originalData) => {
    const pause = ', , ,';
    let originalPrice = 0;
    let totalPrice = 0;
    let phrase = await originalData.reduce((phrase, stock) => {
        const currentPrice = getPrice(currentData, stock.name);
        const previousPrice = getPrice(previousData, stock.name);
        const currentIncome = currentPrice - previousPrice;

        originalPrice += stock.qty * stock.price;
        totalPrice += stock.qty * currentPrice;

        phrase += `${!phrase.length ? `Hello, ${userName}!` : ' and'}
            ${pause}
            ${stock.name} stock went ${hasProfit(currentIncome) ? 'up' : 'down'}
            ${pause} 
            ${!!currentIncome ? `by $${roundAbs(currentIncome)} ${pause}` : ''}
            and now it costs $${currentPrice} 
            ${pause}`;


        return phrase;
    }, '');

    const income = totalPrice - originalPrice;

    return phrase + `In total, you ${hasProfit(income) ? 'earn' : 'lost'} $${roundAbs(income)}!`;
}

module.exports.getStockData = async (event, context, callback) => {
    try {
        const data = await getUser(userId);

        const payload = await JSON.parse(data.Payload);
    
        const userData = await JSON.parse(payload.body);

        const currentData = await get(userData, 'currentData.stockData');

        const previousData = await get(userData, 'previousData.stockData');

        const originalData = await get(userData, 'originalData');

        const alexaPhrase = await getAlexaPhrase(currentData, previousData, originalData);

        const alexaResponse = await getAlexaResponse(alexaPhrase);

        callback(null, alexaResponse);
    } catch (error) {
        console.error(error);
        context.fail(`Exception: ${error}`)
    }
};


