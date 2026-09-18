import { Img, Section } from "react-email";
import { LOGO_PATH } from "@/constants";
import { baseUrl } from "@/emails/components/constants";

interface EmailHeaderProps {
  companyName: string;
}

export const EmailHeader = ({ companyName }: EmailHeaderProps) => (
  <Section className="mobile:px-4 px-6 py-6">
    <Img
      src={`${baseUrl}${LOGO_PATH}`}
      alt={`${companyName} Logo`}
      width="32"
      height="32"
      className="block"
    />
  </Section>
);
