import { Body, Container, Head, Html, Preview, Section, Tailwind, Text } from "react-email";
import { MateriaqFonts } from "@/emails/components/materiaq-fonts";
import { materiaqTailwindConfig } from "@/emails/components/theme";
import { EmailHeader } from "@/emails/components/email-header";
import { EmailFooter } from "@/emails/components/email-footer";

export interface AdminAlertEmailProps {
  companyName: string;
  title: string;
  message: string;
}

export const AdminAlertEmail = ({ companyName, title, message }: AdminAlertEmailProps) => {
  return (
    <Tailwind config={materiaqTailwindConfig}>
      <Html>
        <Head>
          <MateriaqFonts />
        </Head>
        <Body className="bg-bg-2 font-14 m-0 p-4 font-sans">
          <Preview>{title}</Preview>
          <Container className="bg-bg border-stroke mx-auto max-w-[560px] rounded-xl border border-solid">
            <EmailHeader companyName={companyName} />

            <Section className="px-6 py-8">
              <Text className="font-11 text-fg-3 m-0 font-mono uppercase tracking-wider">
                System Alert
              </Text>
              <Text className="font-22 font-condensed text-fg m-0 mt-2 font-bold uppercase">
                {title}
              </Text>
              <Text className="font-14 text-fg-2 m-0 mt-4 leading-relaxed whitespace-pre-line font-sans">
                {message}
              </Text>
            </Section>

            <EmailFooter companyName={companyName} />
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

AdminAlertEmail.PreviewProps = {
  companyName: "MateriaQ Lyrics",
  title: "Token Expires in 3 Days",
  message:
    "The token will expire on Sun, 05 Apr 2026 00:00:00 GMT (3 days remaining).\n\nRotate and update THIS_TOKEN to prevent downtime.",
} satisfies AdminAlertEmailProps;

export default AdminAlertEmail;
