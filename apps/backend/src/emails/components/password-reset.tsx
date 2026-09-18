import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";
import { MateriaqFonts } from "@/emails/components/materiaq-fonts";
import { materiaqTailwindConfig } from "@/emails/components/theme";
import { EmailHeader } from "@/emails/components/email-header";
import { EmailFooter } from "@/emails/components/email-footer";
import { HERO_RESET_IMAGE } from "@/constants";
import { baseUrl } from "@/emails/components/constants";

interface PasswordResetEmailProps {
  companyName: string;
  name: string;
  url: string;
}

export const PasswordResetEmail = ({ companyName, name, url }: PasswordResetEmailProps) => (
  <Tailwind config={materiaqTailwindConfig}>
    <Html>
      <Head>
        <MateriaqFonts />
      </Head>

      <Body className="bg-bg-2 font-14 m-0 p-4 font-sans">
        <Preview>Reset your {companyName} password</Preview>
        <Container className="bg-bg mx-auto max-w-[640px] rounded-xl">
          <EmailHeader companyName={companyName} />

          {/* Hero Image */}
          <Section className="mobile:px-4 px-6">
            <Img
              src={`${baseUrl}${HERO_RESET_IMAGE}`}
              alt="Reset your password"
              width={592}
              className="block w-full max-w-[592px] rounded-lg"
            />
          </Section>

          {/* Main Content */}
          <Section className="mobile:px-4 mobile:py-10 px-6 py-14">
            <Section className="mobile:mb-8 mb-12">
              <Text className="font-56 font-condensed mobile:font-40 text-fg m-0 uppercase">
                Forgot the chorus?
              </Text>
              <Text className="font-14 text-fg-2 m-0 mt-[18px] font-sans">Hi {name},</Text>
              <Text className="font-14 text-fg-2 m-0 mt-2 font-sans">
                Even the best artists forget their lyrics sometimes. We received a request to reset
                your password for {companyName}.
              </Text>
              <Text className="font-14 text-fg-2 m-0 mt-2 font-sans">
                Click the button below to set a new password and get back to syncing drops and
                contributing to the community.
              </Text>
              <Text className="font-13 text-fg-3 m-0 mt-[18px] font-sans">
                If you didn&apos;t request a password reset, you can safely ignore and delete this
                email. Your account remains completely secure.
              </Text>
            </Section>

            <Button
              href={url}
              className="bg-fg font-15 text-bg inline-block px-5 py-3.5 text-center font-sans font-medium rounded-lg"
            >
              Create New Password
            </Button>
          </Section>

          <EmailFooter companyName={companyName} />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

PasswordResetEmail.PreviewProps = {
  companyName: "MateriaQ",
  name: "A Simple User",
  url: "https://materiaq.com/reset-password?token=123",
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
