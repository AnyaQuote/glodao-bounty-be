module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', '26adb2bdd37450eeb71df36f64d0fdaf'),
    },
  },
  url: 'https://diversity-api.contracts.dev'
});
