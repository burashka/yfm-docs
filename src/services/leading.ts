import {dirname, resolve} from 'path';
import {dump, load} from 'js-yaml';
import log from '@doc-tools/transform/lib/log';
import {default as fsWithCallbacks} from 'fs';

import {ArgvService, PresetService} from './index';
import {LeadingPage} from '../models';
import {filterFiles} from './utils';

const fs = fsWithCallbacks.promises;

async function filterFile(path: string) {
    const {
        input: inputFolderPath,
    } = ArgvService.getConfig();

    const pathToDir = dirname(path);
    const filePath = resolve(inputFolderPath, path);
    const content = await fs.readFile(filePath, 'utf8');
    const parsedIndex = load(content) as LeadingPage;

    const {vars} = ArgvService.getConfig();
    const combinedVars = {
        ...PresetService.get(pathToDir),
        ...vars,
    };

    /* Should remove all links with false expressions */
    try {
        parsedIndex.links = filterFiles(parsedIndex.links, 'links', combinedVars);
        await fs.writeFile(filePath, dump(parsedIndex));
    } catch (error) {
        log.error(`Error while filtering index file: ${path}. Error message: ${error}`);
    }
}

export default {
    filterFile,
};
