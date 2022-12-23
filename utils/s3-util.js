const s3Service = require('aws-sdk');
const log = require('../utils/logger');
const config = require('../configs/config');
const s3 = new s3Service.S3({
    secretAccessKey : config.AWS_SECRET_ACCESS_KEY ,
    accessKeyId : config.AWS_ACCESS_KEY_ID ,
    region : config.AWS_REGION_NAME
});
const fs = require('fs')
const path = require('path')
const deleteFile = async (data) => {
    log.info(`Start deleting file on S3: ${data}` );
     let getParams = {
         Bucket: config.AWS_BUCKET_NAME,
         Key: `${data.user_id}/${data.level}/${data.filename}`,
    };
    const dataStream = await s3.deleteObject(getParams).promise();
    return dataStream.Body;
};

// const getFile = async (name) => {
//     log.info(`Start getting file from S3: ${name}` );
//     let getParams = {
//         bucket: config.AWS_BUCKET_NAME,
//         Key: name
//     };
//     const dataStream = s3.getObject(getParams).promise();
//     let result = await dataStream
//     return result.Body;
//
// };
function getFile (key) {
    return new Promise((resolve, reject) => {
        const destPath = `./public/tmp/${path.basename(key)}`
        const params = { Bucket: config.AWS_BUCKET_NAME, Key: key }
        const s3Stream = s3.getObject(params).createReadStream();
        const fileStream = fs.createWriteStream(destPath);
        s3Stream.on('error', reject);
        fileStream.on('error', reject);
        fileStream.on('close', () => { resolve(destPath);});
        s3Stream.pipe(fileStream);
    });
}
async function getBASE64NoUser (data,res) {
        const options = {
            Bucket: config.AWS_BUCKET_NAME,
            Key : `all/${data.level}/${data.filename}`,
        };
    const fileStream = await s3.getObject(options).createReadStream();
    res.set('Content-Type',data.file_type)
    fileStream.pipe(res);

}
async function getBASE64 (data,res) {
       const options = {
            Bucket: config.AWS_BUCKET_NAME,
            Key : `${data.user_id}/${data.level}/${data.filename}`,
        };
    const fileStream = await s3.getObject(options).createReadStream();
    res.set('Content-Type','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    fileStream.pipe(res);

}
async function getBASE64Dia (data) {
    const options = {
        Bucket: config.AWS_BUCKET_NAME,
        Key : `${data.user_id}/${data.level}/${data.filename}`,
    };
    const fileStream = await s3.getObject(options).promise();
    console.log(fileStream);
    return fileStream.Body.toString('base64');
    // let result;
    // await s3.getObject({ Bucket: config.AWS_BUCKET_NAME, Key: `${data.user_id}/${data.level}/${data.filename}` }, function(err, data)
    // {
    //     console.log(err);
    //     if (!err) {
    //         // console.log('data.Body',data.Body);
    //         // console.log('base64',data.Body.toString('base64'));
    //         // console.log('HELLO WORLD',Buffer.from('HELLO WORLD'));
    //         result = data.Body.toString('base64')
    //         return data.Body.toString('base64');
    //     }
    //
    // });
    // return result;
}
async function getFileBuffer (data) {
    const options = {
        Bucket: config.AWS_BUCKET_NAME,
        Key : `${data.user_id}/${data.level}/${data.filename}`,
    };
    const fileStream = await s3.getObject(options).promise();
    return fileStream.Body;
}
async function getPreFileBuffer (data) {
    const options = {
        Bucket: config.AWS_BUCKET_NAME,
        Key : `all/${data.level}/${data.filename}`,
    };
    const fileStream = await s3.getObject(options).promise();
    return fileStream.Body;
}
async function updateFile (data, newData) {
    let getParams = {
        Bucket: config.AWS_BUCKET_NAME,
        Key: `${data.user_id}/${data.level}/${data.filename}`,
    };
    await s3.deleteObject(getParams).promise();
    const newParams = {
        Bucket: config.AWS_BUCKET_NAME,
        Key: `${data.user_id}/${data.level}/${data.filename}`,
        Body: newData
    };
    let result = await s3.upload(newParams).promise();
    return result.Body;
}

module.exports = {
    getFile,
    deleteFile,
    getBASE64,
    getBASE64Dia,
    getBASE64NoUser,
    getFileBuffer,
    getPreFileBuffer,
    updateFile
};
