import {basename, dirname, extname, resolve} from 'path';
import shell from 'shelljs';
import {default as fsWithCallbacks} from 'fs';
import {bold} from 'chalk';

import log from '@doc-tools/transform/lib/log';

import {ArgvService, LeadingService, TocService} from '../services';
import {resolveMd2HTML, resolveMd2Md} from '../resolvers';
import {logger} from '../utils';

const fs = fsWithCallbacks.promises;

/**
 * Processes files of documentation (like index.yaml, *.md)
 * @param {string} tmpInputFolder
 * @param {string} outputBundlePath
 * @return {void}
 */
export async function processPages(tmpInputFolder: string, outputBundlePath: string) {
    const {
        input: inputFolderPath,
        output: outputFolderPath,
        outputFormat,
    } = ArgvService.getConfig();

    const pathFiles = TocService.getNavigationPaths();
    const length = pathFiles.length;

    const run = async (part: string[]) => (
        Promise.all(
            part.map(async (pathToFile) => {
                const pathToDir: string = dirname(pathToFile);
                const filename: string = basename(pathToFile);
                const fileExtension: string = extname(pathToFile);
                const fileBaseName: string = basename(filename, fileExtension);
                const outputDir: string = resolve(outputFolderPath, pathToDir);
                const resolvedPathToFile = resolve(inputFolderPath, pathToFile);

                const outputFileName = `${fileBaseName}.${outputFormat}`;
                const outputPath: string = resolve(outputDir, outputFileName);

                logger.proc(resolvedPathToFile.replace(tmpInputFolder, ''));

                try {
                    let outputFileContent = '';

                    shell.mkdir('-p', outputDir);

                    if (fileBaseName === 'index' && fileExtension === '.yaml') {
                        await LeadingService.filterFile(pathToFile);
                    }

                    if (outputFormat === 'md') {
                        if (fileExtension === '.yaml') {
                            const from = resolvedPathToFile;
                            const to = resolve(outputDir, filename);

                            await fs.copyFile(from, to);
                            return;
                        }

                        outputFileContent = await resolveMd2Md(pathToFile, outputDir);
                    }

                    if (outputFormat === 'html') {
                        if (fileExtension !== '.yaml' && fileExtension !== '.md') {
                            const from = resolvedPathToFile;
                            const to = resolve(outputDir, filename);

                            await fs.copyFile(from, to);
                            return;
                        }

                        outputFileContent = await resolveMd2HTML({
                            inputPath: pathToFile,
                            outputBundlePath,
                            fileExtension,
                            outputPath,
                            filename,
                        });
                    }

                    await fs.writeFile(outputPath, outputFileContent);
                } catch (e) {
                    console.error(e);
                    log.error(`No such file or has no access to ${bold(resolvedPathToFile)}`);
                }
            }),
        )
    );

    let i = 0;
    const SIZE = 4000;
    while (i * SIZE < length) {
        await run(pathFiles.slice(i * SIZE, ++i * SIZE));
    }
}
