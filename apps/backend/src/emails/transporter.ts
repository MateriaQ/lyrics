import env from "@/env";
import { createTransport } from "nodemailer";
import { logger } from "@/logger";

export const transporter = createTransport(
  {
    service: env.SMTP_SERVICE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  },
  { from: `"MateriaQ Lyrics" <${env.MAIL_FROM_ADDRESS}>` },
);

export const checkMailer = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (err) {
    logger.error(err, "Email service verification failed. Please check SMTP configuration.");
    return false;
  }
};
