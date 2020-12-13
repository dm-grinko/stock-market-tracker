'use strict';
require('dotenv-yaml').config({ path: './env.yml' });
require('colors');

const { 
    TABLE: TableName,
    REGION: region,
    PROFILE: profile,
    USER_ID: id,
    ALEXA_LAMBDA
} = process.env;

const filename = './functions/stocks.json';

const fs = require('fs');
const AWS = require('aws-sdk');
AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
AWS.config.update({ region });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.setPromisesDependency(require('bluebird'));

const exec = () => {
    try {
        fs.readFile(filename, 'utf8', async (err, data) => {
            console.log(`${data}`.red);
            const originalData = JSON.parse(data);
            const Item = { id, originalData };
            const params = { TableName, Item };
            await dynamoDb.put(params).promise();
            console.log(`${ALEXA_LAMBDA}`.yellow);
        })
    } catch (error) {
        console.error('error', error);
    }
}

exec();
