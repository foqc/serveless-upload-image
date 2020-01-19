'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid/v4');
const s3 = new AWS.S3();
const imageType = 'image/jpeg';

const bucket = process.env.Bucket;

module.exports.handler = async event => {
  try {

    const buffer = new Buffer(event.body, 'base64');
    const key = uuid()

    const response = await s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: imageType,
      ContentEncoding: imageType
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: e.message
      })
    };
  }
};