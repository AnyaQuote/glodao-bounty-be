// e5651f89-7669-4385-89da-90571faf78c0
// 0x5b864D9f2Bfc80f7c60c2F4eF7CBa61a1730F999

const axios = require("axios");
const FormData = require("form-data");
const captcha_secret_key = process.env.HCAPTCHA_SECRET_KEY;
const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

const verifyCaptchaToken = async (token) => {
  const form = new FormData();
  form.append("secret", captcha_secret_key);
  form.append("response", token);
  const { data } = await axiosInstance.post(
    "https://hcaptcha.com/siteverify",
    form,
    {
      headers: form.getHeaders(),
    }
  );
  return data;
};

module.exports = {
  verifyCaptchaToken,
};
