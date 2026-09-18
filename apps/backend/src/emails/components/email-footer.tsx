import { Column, Img, Link, Row, Section, Text } from "react-email";
import {
  DISCORD_SOCIAL_LINK,
  GITHUB_SOCIAL_LINK,
  SOCIAL_DISCORD_ICON,
  SOCIAL_GITHUB_ICON,
  SOCIAL_WEBSITE_ICON,
  SOCIAL_X_ICON,
  WEBSITE_LINK,
  X_LINK,
} from "@/constants";
import { baseUrl } from "@/emails/components/constants";

interface EmailFooterProps {
  companyName: string;
}

export const EmailFooter = ({ companyName }: EmailFooterProps) => (
  <Section className="mobile:px-4 mobile:py-12 border-stroke border-t px-6 py-16">
    <Text className="font-13 text-fg-2 m-0 max-w-[320px] font-sans">
      {companyName} is an open-source platform built to bring you closer to the music through
      community-driven, perfectly synced lyrics.
    </Text>
    <Row align="left">
      <Column className="w-full align-top">
        <Section align="left" className="mt-8 w-[152px]">
          <Row align="left">
            <Column className="w-[20px] pr-6">
              <Link href={X_LINK} className="inline-block">
                <Img
                  src={`${baseUrl}${SOCIAL_X_ICON}`}
                  alt="X"
                  width="20"
                  height="20"
                  className="block"
                />
              </Link>
            </Column>
            <Column className="w-[20px] pr-6">
              <Link href={GITHUB_SOCIAL_LINK} className="inline-block">
                <Img
                  src={`${baseUrl}${SOCIAL_GITHUB_ICON}`}
                  alt="GitHub"
                  width="20"
                  height="20"
                  className="block"
                />
              </Link>
            </Column>
            <Column className="w-[20px] pr-6">
              <Link href={DISCORD_SOCIAL_LINK} className="inline-block">
                <Img
                  src={`${baseUrl}${SOCIAL_DISCORD_ICON}`}
                  alt="Discord"
                  width="20"
                  height="20"
                  className="block"
                />
              </Link>
            </Column>
            <Column className="w-[20px]">
              <Link href={WEBSITE_LINK} className="inline-block">
                <Img
                  src={`${baseUrl}${SOCIAL_WEBSITE_ICON}`}
                  alt="Website"
                  width="20"
                  height="20"
                  className="block"
                />
              </Link>
            </Column>
          </Row>
        </Section>
      </Column>
    </Row>
  </Section>
);
