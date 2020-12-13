'use strict';
const {
    REGION: region,
    YAHOO_REGION,
    YAHOO_URL: url, 
    YAHOO_KEY: key, 
    YAHOO_HOST: host, 
    YAHOO_USE_QUERY_STRING: useQueryString,
    USER_ID: userId,
    GET_USER_LAMBDA,
    UPDATE_USER_LAMBDA
} = process.env;

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region });

const axios = require('axios');

const { get } = require('lodash');

const { getCurrentDate, getCurrentTime } = require('./helpers');

const getSymbols = originalData => originalData.map(s => s.symbol).join(',');


const lambdaInvoke = async (payload, FunctionName) => (
    await lambda.invoke({
        FunctionName,
        Payload: JSON.stringify(payload, null, 2),
        InvocationType: "RequestResponse"
    }).promise()
)

const getUser = async id => {
    const payload = {
        body: { id }
    };
    return await lambdaInvoke(payload, GET_USER_LAMBDA);
}

const updateUser = async data => {
    const payload = {
        body: { data }
    };
    return await lambdaInvoke(payload, UPDATE_USER_LAMBDA);
}

const getOptions = originalData => ({
    headers: { 
        'x-rapidapi-key': key,
        'x-rapidapi-host': host,
        useQueryString,
    },
    params: { 
        symbols: getSymbols(originalData),
        region: YAHOO_REGION 
    }
})

const sendResponse = (data, callback) => {
    callback(null, {
        statusCode: data.statusCode || 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify(data)
    });
};

module.exports.updateStockDataCron = async (event, context, callback) => {
    try {
        const { section } = event;

        const data = await getUser(userId);

        const payload = await JSON.parse(data.Payload);
    
        const userData = await JSON.parse(payload.body);

        const originalData = await get(userData, 'originalData');

        const previousData = await get(userData, 'previousData');

        const options = await getOptions(originalData);
    
        const yahooData = await axios.get(url, options);

        const yahooResult = await get(yahooData, 'data.quoteResponse.result');

        const stockData = yahooResult.map(data => {
            const { longName: name, regularMarketPrice: price } = data;
            return { name, price };
        });

        const date = getCurrentDate();

        const time = getCurrentTime();

        let userPayload = { 
            ...userData,
            [section]: { stockData, date, time }
        };

        if ((section !== 'previousData') && !previousData) {
            userPayload.previousData = { stockData, date, time }
        }

        await updateUser(userPayload);

        sendResponse({ message: 'The request has succeeded', userPayload }, callback);
    } catch (error) {
        console.error(error);
        sendResponse(error, callback)
    }
};
