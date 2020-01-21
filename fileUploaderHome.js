"use strict";
const AWS = require("aws-sdk");
const uuid = require("uuid/v4");
const Busboy = require("busboy");
const s3 = new AWS.S3();

const bucket = process.env.Bucket;

const parse = (event) => new Promise((resolve, reject) => {
  const busboy = new Busboy({
    headers: {
      "content-type":
        event.headers["content-type"] || event.headers["Content-Type"]
    }
  });
  const result = {
    files: []
  };
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    const uploadFile = {};
    file.on("data", data => {
      uploadFile.content = data;
    });
    file.on("end", () => {
      if (uploadFile.content) {
        uploadFile.filename = filename;
        uploadFile.contentType = mimetype;
        uploadFile.encoding = encoding;
        uploadFile.fieldname = fieldname;
        result.files.push(uploadFile);
      }
    });
  });
  busboy.on("field", (fieldname, value) => {
    result[fieldname] = value;
  });
  busboy.on("error", error => {
    reject(error);
  });
  busboy.on("finish", () => {
    resolve(result);
  });
  busboy.write(event.body, event.isBase64Encoded ? "base64" : "binary");
  busboy.end();
});


module.exports.handler = async event => {
  try {
    console.log("1st.... ", event);
    const formData = await parse(event);
    console.log("2nd.... ", formData);
    const file = formData.files[0];
    const key = uuid();
    // With a buffer
    const response = await s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: file.content,
        ContentType: file.contentType
      })
      .promise();
    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: e.message,
        crash: true
      })
    };
  }
};