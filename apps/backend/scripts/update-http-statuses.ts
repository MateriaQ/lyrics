import { format } from "oxfmt";
import { Project, VariableDeclarationKind } from "ts-morph";

const PATHS = {
  codes: "src/lib/http/http-status-codes.ts",
  phrases: "src/lib/http/http-status-phrases.ts",
  tsconfig: "tsconfig.json",
};

const DATA_URL =
  "https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json";

interface JsonCodeComment {
  doc: string;
  description: string;
}

interface JsonCode {
  code: number;
  phrase: string;
  constant: string;
  comment: JsonCodeComment;
  isDeprecated?: boolean;
}

console.log(`Updating ${PATHS.codes} and ${PATHS.phrases}`);

const project = new Project({
  tsConfigFilePath: PATHS.tsconfig,
});

const response = await fetch(DATA_URL);

if (!response.ok) {
  throw new Error(`Error retrieving codes: ${response.statusText}`);
}

const Codes = (await response.json()) as JsonCode[];

const statusCodeFile = project.createSourceFile(PATHS.codes, {}, { overwrite: true });

statusCodeFile.insertStatements(0, "// Generated file. Do not edit\n");
statusCodeFile.insertStatements(
  1,
  `// Codes retrieved on ${new Date().toUTCString()} from ${DATA_URL}`,
);

Codes.forEach(({ code, constant, comment, isDeprecated }) => {
  statusCodeFile
    .addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: constant,
          initializer: code.toString(),
        },
      ],
    })
    .addJsDoc({
      description: `${isDeprecated ? "@deprecated\n" : ""}${comment.doc}\n\n${comment.description}`,
    });
});

const phrasesFile = project.createSourceFile(PATHS.phrases, {}, { overwrite: true });

phrasesFile.insertStatements(0, "// Generated file. Do not edit\n");
phrasesFile.insertStatements(
  1,
  `// Phrases retrieved on ${new Date().toUTCString()} from ${DATA_URL}`,
);

Codes.forEach(({ constant, phrase, comment, isDeprecated }) => {
  phrasesFile
    .addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: constant,
          initializer: `"${phrase}"`,
        },
      ],
    })
    .addJsDoc({
      description: `${isDeprecated ? "@deprecated\n" : ""}${comment.doc}\n\n${comment.description}`,
    });
});

await project.save();

const filesToFormat = [PATHS.codes, PATHS.phrases];

await Promise.all(
  filesToFormat.map(async (filePath) => {
    const file = Bun.file(filePath);
    const content = await file.text();

    const result = await format(filePath, content);
    const formattedContent = result.code ?? content;

    await Bun.write(filePath, formattedContent);
  }),
);

console.log(`Successfully generated and formatted ${PATHS.codes} and ${PATHS.phrases}`);
