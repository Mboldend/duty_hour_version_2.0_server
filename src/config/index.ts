import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  ip_address: process.env.IP_ADDRESS,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  stripe: {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    paymentSuccess: process.env.STRIPE_PAYMENT_SUCCESS_URL!,
    EMPLOYEE_CREATION_AFTER_PAYMENT_LINK:
      process.env.EMPLOYEE_CREATION_AFTER_PAYMENT_LINK!,
    EMPLOYEE_CREATION_AFTER_PAYMENT_LINK_Failed:
      process.env.EMPLOYEE_CREATION_AFTER_PAYMENT_LINK_Failed!,
    BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK:
      process.env.BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK!,
    BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK_Failed:
      process.env.BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK_Failed!,
  },
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    jwt_expire_in: process.env.JWT_EXPIRE_IN,
  },
  email: {
    from: process.env.EMAIL_FROM,
    user: process.env.EMAIL_USER,
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    pass: process.env.EMAIL_PASS,
  },
  super_admin: {
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
  },
};
