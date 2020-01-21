"use strict";
const AWS = require("aws-sdk");
const uuid = require("uuid/v4");
const s3 = new AWS.S3();
const formParser = require("./formParser");

const bucket = process.env.Bucket;
const MAX_SIZE = 10000000;

const PNG_MIME_TYPE = "image/png";
const JPEG_MIME_TYPE = "image/jpeg";
const JPG_MIME_TYPE = "image/jpg";

const MIME_TYPES = [PNG_MIME_TYPE, JPEG_MIME_TYPE, JPG_MIME_TYPE];

const isAllowedSize = size => size <= MAX_SIZE;
const isAllowedMimeType = mimeType => MIME_TYPES.find(type => type === mimeType);
const isAllowedFile = (size, mimeType) =>
  isAllowedSize(size) && isAllowedMimeType(mimeType);

module.exports.handler = async event => {
  try {
    const formData = await formParser.parser(event);
    const file = formData.files[0];
    if (!isAllowedFile(file.content.byteLength, file.contentType))
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "File size or type not allowed"
        })
      };
    const key = `${uuid()}_${file.filename}`;

    const response = await new Promise((resolve, reject) => {
      s3.upload(
        {
          Bucket: bucket,
          Key: key,
          Body: file.content,
          ContentType: file.contentType
        },
        function(err, data) {
          if (err) reject();
          resolve(data);
        }
      );
    });

    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: response.Bucket,
      Key: key
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        mimeType: file.contentType,
        originalKey: response.key,
        bucket: response.Bucket,
        fileName: file.filename,
        originalPath: signedUrl,
        originalSize: file.content.byteLength
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: e.message
      })
    };
  }
};
