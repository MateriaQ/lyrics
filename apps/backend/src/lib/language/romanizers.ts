import { romanize as ar } from "@romanizer/arabic";
import { romanize as hy } from "@romanizer/armenian";
import { romanize as bn } from "@romanizer/bengali";
import { romanize as ru } from "@romanizer/cyrillic";
import { romanize as ka } from "@romanizer/georgian";
import { romanize as got } from "@romanizer/gothic";
import { romanize as el } from "@romanizer/greek";
import { romanize as gu } from "@romanizer/gujarati";
import { romanize as he } from "@romanizer/hebrew";
import { romanize as hi } from "@romanizer/hindi";
import { romanize as ml } from "@romanizer/malayalam";
import { romanize as fa } from "@romanizer/persian";
import { romanize as pa } from "@romanizer/punjabi";
import { romanize as ta } from "@romanizer/tamil";
import { romanize as te } from "@romanizer/telugu";
import { romanize as ur } from "@romanizer/urdu";

import { romanize as zh } from "@/lib/language/romanizer/chinese";
import { romanize as ja } from "@/lib/language/romanizer/japanese";
import { romanize as ko } from "@/lib/language/romanizer/korean";

import type { SupportedLanguage } from "@/lib/language/detect";

type Fn = (text: string) => Promise<string | null> | string | null;
type RomanizerRecord = Record<SupportedLanguage, Fn>;

export const Romanizers: RomanizerRecord = {
  ar,
  bn,
  el,
  fa,
  got,
  gu,
  he,
  hi,
  hy,
  ja,
  ka,
  ko,
  ml,
  pa,
  ru,
  ta,
  te,
  ur,
  zh,
} as const satisfies RomanizerRecord;
