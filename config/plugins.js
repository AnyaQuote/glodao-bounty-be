module.exports = ({ env }) => ({
  email: {
    provider: "sendgrid",
    providerOptions: {
      apiKey: env("SENDGRID_API_KEY"),
    },
    settings: {
      defaultFrom: env("EMAIL_DEFAULT_FROM"),
      defaultReplyTo: env("EMAIL_ADDRESS_REPLY"),
    },
  },
  // upload: {
  //   provider: "aws-s3",
  //   providerOptions: {
  //     accessKeyId: env("AWS_ACCESS_KEY_ID"),
  //     secretAccessKey: env("AWS_ACCESS_SECRET"),
  //     region: env("AWS_REGION"),
  //     params: {
  //       Bucket: env("AWS_BUCKET"),
  //     },
  //   },
  // },
});
