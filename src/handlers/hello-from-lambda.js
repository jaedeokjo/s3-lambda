const AWS = require("aws-sdk");
const sharp = require("sharp"); // Used for image resizing

const s3 = new AWS.S3()
const sns = new AWS.SNS({ apiVersion: '2012-11-05' })
const sourceBucketName = process.env.SOURCE_BUCKETNAME
const destinationBucketName = process.env.DESTINATION_BUCKETNAME
const snsTopicName = process.env.SNS_TOPICNAME

exports.helloFromLambdaHandler = async (event) => {
    console.log(JSON.stringify(event))

    let s3EventString = null
    let s3FullEvent = null
    try {
        s3EventString = event.Records[0].body
        s3FullEvent = JSON.parse(s3EventString)
    } catch (e) {
        console.log("Can't get s3 event body and parse string")
        console.log(e)
    }
    let s3Event = null
    let updatedKeyName = null
    try {
        s3Event = s3FullEvent.Records[0].s3
        updatedKeyName = s3Event.object.key
    } catch (e) {
        console.log("Can't get s3 event and key")
        console.log(e)
    }

    let s3Object = null
    let data = null
    let result = null
    // 원본 버킷으로부터 파일 읽기
    try {
        s3Object = await s3.getObject({
            Bucket: sourceBucketName,
            Key: updatedKeyName
        }).promise()
    } catch (e) {
        console.log("Get error while getting object from s3")
        console.log(e)
    }
    // // 이미지 리사이즈, sharp 라이브러리가 필요합니다.
    try {
        data = await sharp(s3Object.Body)
            .resize(200)
            .jpeg({ mozjpeg: true })
            .toBuffer()
    } catch (e) {
        console.log("Get error while converting image")
        console.log(e)
    }
    // // 대상 버킷으로 파일 쓰기
    try {
        result = await s3.putObject({
            Bucket: destinationBucketName,
            Key: updatedKeyName,
            ContentType: 'image/jpeg',
            Body: data,
            ACL: 'public-read'
        }).promise()
    } catch (e) {
        console.log("Get error while saving images")
        console.log(e)
    }

    try {
        await sns.publish({
            TopicArn: snsTopicName,
            Subject: "thumbnail updated",
            Message: updatedKeyName
        }).promise()
    } catch (e) {
        console.log("Get error while publishing notification")
        console.log(e)
    }

    return { statusCode: 200, body: result };
}
