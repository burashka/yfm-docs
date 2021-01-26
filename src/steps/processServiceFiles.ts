import {dirname, resolve} from 'path';
import walkSync from 'walk-sync';
import {default as fsWithCallbacks} from 'fs';
import {load, dump} from 'js-yaml';
import shell from 'shelljs';

import {ArgvService, PresetService, TocService} from '../services';
import {logger} from '../utils';
import {DocPreset} from '../models';

const fs = fsWithCallbacks.promises;

/**
 * Processes services files (like toc.yaml, presets.yaml).
 * @return {void}
 */
export async function processServiceFiles() {
    const {
        input: inputFolderPath,
        output: outputFolderPath,
        varsPreset = '',
        ignore = [],
        outputFormat,
        applyPresets,
        resolveConditions,
    } = ArgvService.getConfig();

    const presetsFilePaths: string[] = walkSync(inputFolderPath, {
        directories: false,
        includeBasePath: false,
        globs: [
            '**/presets.yaml',
        ],
        ignore,
    });


    await Promise.all(
        presetsFilePaths.map(async (path) => {
            logger.proc(path);

            const pathToPresetFile = resolve(inputFolderPath, path);
            const content = await fs.readFile(pathToPresetFile, 'utf8');
            const parsedPreset = load(content) as DocPreset;

            PresetService.add(parsedPreset, path, varsPreset);

            if (outputFormat === 'md' && (!applyPresets || !resolveConditions)) {
                /* Should save filtered presets.yaml only when --apply-presets=false or --resolve-conditions=false */
                const outputPath = resolve(outputFolderPath, path);
                const filteredPreset: Record<string, Object> = {
                    default: parsedPreset.default,
                };

                if (parsedPreset[varsPreset]) {
                    filteredPreset[varsPreset] = parsedPreset[varsPreset];
                }

                const outputPreset = dump(filteredPreset, {
                    lineWidth: 120,
                });

                shell.mkdir('-p', dirname(outputPath));

                return fs.writeFile(outputPath, outputPreset);
            }
        }),
    );

    const tocFilePaths: string[] = walkSync(inputFolderPath, {
        directories: false,
        includeBasePath: false,
        globs: [
            '**/toc.yaml',
        ],
        ignore,
    });

    await Promise.all(
        tocFilePaths.map(async (path) => {
            logger.proc(path);

            return TocService.add(path);
        }),
    );
}
