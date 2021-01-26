import {basename, dirname, join, relative, resolve} from 'path';
import yaml from 'js-yaml';
import {default as fsWithCallbacks} from 'fs';

import transform, {Output} from '@doc-tools/transform';
import log from '@doc-tools/transform/lib/log';

import {YfmToc} from '../models';
import {ArgvService, PresetService, TocService} from '../services';
import {generateStaticMarkup, getPlugins, ResolverOptions, transformToc} from '../utils';

const fs = fsWithCallbacks.promises;

export interface FileTransformOptions {
    path: string;
    root?: string;
}

export const FileTransformer: Record<string, Function> = {
    '.yaml': async function ({path}: FileTransformOptions): Promise<Object> {
        const {input} = ArgvService.getConfig();
        const resolvedPath = resolve(input, path);
        let data = {};

        try {
            const content = await fs.readFile(resolvedPath, 'utf8');
            data = yaml.load(content) as string;
        } catch {
            log.error('');
        }

        return {
            result: {data},
        };
    },
    '.md': async function ({path}: FileTransformOptions): Promise<Output> {
        const {input, vars, ...options} = ArgvService.getConfig();
        const resolvedPath: string = resolve(input, path);
        const content: string = await fs.readFile(resolvedPath, 'utf8');

        /* Relative path from folder of .md file to root of user' output folder */
        const assetsPublicPath = relative(dirname(resolvedPath), resolve(input));

        const plugins = getPlugins();

        return transform(content, {
            ...options,
            plugins,
            vars: {
                ...PresetService.get(dirname(path)),
                ...vars,
            },
            root: resolve(input),
            path: resolvedPath,
            assetsPublicPath,
        });
    },
};

/**
 * Transforms markdown file to HTML format.
 * @param inputPath
 * @param fileExtension
 * @param outputPath
 * @param outputBundlePath
 * @return {string}
 */
export async function resolveMd2HTML(
    {inputPath, fileExtension, outputPath, outputBundlePath}: ResolverOptions,
): Promise<string> {
    const pathToDir: string = dirname(inputPath);
    const toc: YfmToc|null = TocService.getForPath(inputPath) || null;
    const tocBase: string = toc && toc.base ? toc.base : '';
    const pathToFileDir: string = pathToDir === tocBase ? '' : pathToDir.replace(`${tocBase}/`, '');
    const relativePathToIndex = relative(dirname(inputPath), `${tocBase}/`);

    const transformFn: Function = FileTransformer[fileExtension];
    const {result} = await transformFn({path: inputPath});
    const props = {
        data: {
            leading: inputPath.endsWith('.yaml'),
            toc: transformToc(toc, pathToDir) || {},
            ...result,
        },
        router: {
            pathname: join(relativePathToIndex, pathToFileDir, basename(outputPath)),
        },
        // TODO(vladimirfedin): CLOUDFRONT-3939
        lang: 'ru',
    };
    const outputDir = dirname(outputPath);
    const relativePathToBundle: string = relative(resolve(outputDir), resolve(outputBundlePath));

    return generateStaticMarkup(props, relativePathToBundle);
}
