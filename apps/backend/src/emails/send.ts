import env from "@/env";
import { render } from "react-email";
import { logger } from "@/logger";
import { transporter } from "@/emails/transporter";
import PasswordResetEmail from "@/emails/components/password-reset";
import ActivationEmail from "@/emails/components/activation";
import AdminAlertEmail from "@/emails/components/admin-alert";

type User = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
};

type SendEmailParams = {
  user: User;
  url: string;
  token: string;
};

const appName = "MateriaQ Lyrics";

export async function sendResetPasswordEmail({ url, user }: SendEmailParams) {
  try {
    const html = await render(PasswordResetEmail({ url, name: user.name, companyName: appName }));

    await transporter.sendMail({
      to: user.email,
      subject: `Reset your ${appName} password`,
      text: `Reset your password by clicking here: ${url}`,
      html,
    });
    logger.info({ email: user.email }, "Password reset email sent successfully.");
  } catch (err) {
    logger.error({ err, email: user.email }, "Failed to send password reset email.");
  }
}

export async function sendVerificationEmail({ user, url }: SendEmailParams) {
  try {
    const html = await render(ActivationEmail({ url, companyName: appName }));

    await transporter.sendMail({
      to: user.email,
      subject: `Verify your ${appName} account`,
      text: `Verify your email by clicking here: ${url}`,
      html,
    });
    logger.info({ email: user.email }, "Verification email sent successfully.");
  } catch (err) {
    logger.error({ err, email: user.email }, "Failed to send verification email.");
  }
}

export async function sendAdminAlert({ subject, message }: { subject: string; message: string }) {
  try {
    const html = await render(
      AdminAlertEmail({
        companyName: appName,
        title: subject,
        message,
      }),
    );

    await transporter.sendMail({
      to: env.ADMIN_MAIL,
      subject: `[${appName} Admin Alert] ${subject}`,
      text: message,
      html,
    });

    logger.info({ subject }, "Admin alert email sent successfully.");
  } catch (err) {
    logger.error({ err, subject }, "Failed to send admin alert email.");
  }
}
