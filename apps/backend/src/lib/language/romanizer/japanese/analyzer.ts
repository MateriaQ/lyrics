import Kuromoji from "kuromoji.js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

import { PRE_PROCESS_MAP } from "@/lib/language/romanizer/japanese/map";
import { logger } from "@/logger";

interface KuromojiToken {
  word_id: number;
  word_type: string;
  word_position: number;
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  reading: string;
  pronunciation: string;
}

type ParsedToken = Omit<KuromojiToken, "word_id" | "word_type" | "word_position"> & {
  verbose: {
    word_id: number;
    word_type: string;
    word_position: number;
  };
};

const LOCAL_DICT_PATH = resolve(import.meta.dirname, "./kuromoji-dict");
const preProcess = getReplacer();

let analyzerInstance: any | null = null;
let initPromise: Promise<void> | null = null;

export const analyzer = {
  init,
  parse,
  validate,
};

async function validate(): Promise<boolean> {
  if (!existsSync(LOCAL_DICT_PATH)) {
    logger.fatal(`Kuromoji dictionary directory missing at: ${LOCAL_DICT_PATH}`);
    return false;
  }

  try {
    await init();
    logger.info("Kuromoji analyzer validated and initialized");
    return true;
  } catch (err) {
    logger.fatal(err, "Kuromoji analyzer validation failed during initialization");
    return false;
  }
}

function init(): Promise<void> {
  if (analyzerInstance) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = new Promise((resolvePromise, rejectPromise) => {
    Kuromoji.builder({ dicPath: LOCAL_DICT_PATH }).build((err: Error | null, analyzer: any) => {
      if (err) {
        logger.error(err, `Failed to initialize Kuromoji analyzer at ${LOCAL_DICT_PATH}`);
        initPromise = null;
        return rejectPromise(err);
      }

      analyzerInstance = analyzer;
      resolvePromise();
    });
  });

  return initPromise;
}

async function parse(text = ""): Promise<ParsedToken[]> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (!analyzerInstance) {
    await init();
  }

  const preProcessedText = preProcess(trimmed.normalize("NFKC"));
  const tokens = analyzerInstance.tokenize(preProcessedText) as KuromojiToken[];

  return tokens.map(({ word_id, word_type, word_position, ...rest }) => ({
    ...rest,
    verbose: {
      word_id,
      word_position,
      word_type,
    },
  }));
}

function getReplacer(): (text: string) => string {
  const keys = Object.keys(PRE_PROCESS_MAP).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return (t: string) => t;

  const pattern = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  // fallow-ignore-next-line security-sink -- pattern built
  const regex = new RegExp(`(${pattern})`, "g");
  return (text: string) => text.replace(regex, (match) => PRE_PROCESS_MAP[match] || match);
}
