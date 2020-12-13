'use strict';
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.setPromisesDependency(require('bluebird'));
const { isEmpty } = require('./helpers');
const { get } = require('lodash');
const { TABLE: TableName } = process.env;

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

module.exports.getUser = async (event, context, callback) => {    
    try {
        const { id } = event.body;

        if (!id) {
            throw { message: 'Missing required params from body', statusCode: 400 };
        }

        const params = { TableName, Key: { id } };
    
        const data = await dynamoDb.get(params).promise();
    
        const { Item } = data;
    
        if (!Item || isEmpty(Item)) {
            throw { message: 'Not found', statusCode: 400 };
        }
    
        sendResponse(Item, callback);
    } catch (error) {
        sendResponse(error, callback);
    }
};

module.exports.updateUser = async (event, context, callback) => {    
    try {
        const Item = get(event, 'body.data');

        if (!Item || isEmpty(Item)) {
            throw { message: 'Missing required params from body', statusCode: 400 };
        }
    
        const params = { TableName, Item };
    
        await dynamoDb.put(params).promise();

        sendResponse({ message: 'The request has succeeded' }, callback);
    } catch (error) {
        sendResponse(error, callback)
    }
};
