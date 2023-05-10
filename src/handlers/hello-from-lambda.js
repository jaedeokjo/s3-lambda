const AWS = require("aws-sdk");
const sharp = require("sharp"); // Used for image resizing

const s3 = new AWS.S3()
const sns = new AWS.SNS({ apiVersion: '2012-11-05' })

exports.helloFromLambdaHandler = async () => {
    // 원본 버킷으로부터 파일 읽기
    const s3Object = await s3.getObject({
        Bucket: "devops4-serverless-photo-src-bucket",
        Key: "example1.jpg"
    }).promise()

    // // 이미지 리사이즈, sharp 라이브러리가 필요합니다.
    const data = await sharp(s3Object.Body)
        .resize(200)
        .jpeg({ mozjpeg: true })
        .toBuffer()

    // // 대상 버킷으로 파일 쓰기
    const result = await s3.putObject({
        Bucket: "devops4-serverless-photo-src-bucket",
        Key: "example1_thumbnail.jpg",
        ContentType: 'image/jpeg',
        Body: data,
        ACL: 'public-read'
    }).promise()

    try {
        await sns.publish({
            TopicArn: "arn:aws:sns:ap-northeast-2:214883190683:MyTopic",
            Subject: "띵동",
            Message: "힘들다 진짜.."
        }).promise()
    } catch (e) {
        console.log(e)
    }

    return { statusCode: 200, body: result };
}
