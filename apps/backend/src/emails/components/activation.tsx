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
import { HERO_ACTIVATION_IMAGE } from "@/constants";
import { baseUrl } from "@/emails/components/constants";

interface ActivationEmailProps {
  companyName: string;
  url: string;
}

export const ActivationEmail = ({ companyName, url }: ActivationEmailProps) => (
  <Tailwind config={materiaqTailwindConfig}>
    <Html>
      <Head>
        <MateriaqFonts />
      </Head>

      <Body className="bg-bg-2 font-14 m-0 p-4 font-sans">
        <Preview>Verify your email to join MateriaQ Lyrics</Preview>
        <Container className="bg-bg mx-auto max-w-[640px] rounded-xl">
          <EmailHeader companyName={companyName} />

          {/* Hero Image */}
          <Section className="mobile:px-4 px-6">
            <Img
              src={`${baseUrl}${HERO_ACTIVATION_IMAGE}`}
              alt="Welcome to MateriaQ"
              width={592}
              className="block w-full max-w-[592px] rounded-xl"
            />
          </Section>

          {/* Main Content */}
          <Section className="mobile:px-4 mobile:py-10 px-6 py-14">
            <Section className="mobile:mb-8 mb-12">
              <Text className="font-56 font-condensed mobile:font-40 text-fg m-0 uppercase">
                Mic check, 1, 2...
              </Text>
              <Text className="font-14 text-fg-2 m-0 mt-[18px] font-sans">
                Let&apos;s get you into the ultimate community for music lovers at {companyName}.
              </Text>
              <Text className="font-14 text-fg-2 m-0 mt-2 font-sans">
                Just confirm your email address to unlock lyric syncing, contributions, and your
                favorite tracks.
              </Text>
              <Text className="font-13 text-fg-3 m-0 mt-[18px] font-sans">
                If you didn&apos;t request this account, you can safely ignore and delete this
                email.
              </Text>
            </Section>
            <Button
              href={url}
              className="bg-fg font-15 text-bg inline-block px-5 py-3.5 text-center font-sans font-medium rounded-lg"
            >
              Verify My Account
            </Button>
          </Section>

          <EmailFooter companyName={companyName} />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

ActivationEmail.PreviewProps = {
  companyName: "MateriaQ",
  url: "https://materiaq.com/verify?token=123",
} satisfies ActivationEmailProps;

export default ActivationEmail;
