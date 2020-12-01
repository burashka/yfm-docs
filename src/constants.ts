import {dirname} from 'path';
const notes = require('@doc-tools/transform/lib/plugins/notes');
const attrs = require('@doc-tools/transform/lib/plugins/attrs');
const anchors = require('@doc-tools/transform/lib/plugins/anchors');
const code = require('@doc-tools/transform/lib/plugins/code');
const cut = require('@doc-tools/transform/lib/plugins/cut');
const deflist = require('@doc-tools/transform/lib/plugins/deflist');
const imsize = require('@doc-tools/transform/lib/plugins/imsize');
const meta = require('@doc-tools/transform/lib/plugins/meta');
const sup = require('@doc-tools/transform/lib/plugins/sup');
const tabs = require('@doc-tools/transform/lib/plugins/tabs');
const video = require('@doc-tools/transform/lib/plugins/video');
const includes = require('@doc-tools/transform/lib/plugins/includes');
const links = require('@doc-tools/transform/lib/plugins/links');
const images = require('@doc-tools/transform/lib/plugins/images');

export const BUILD_FOLDER = 'build';
export const BUNDLE_FOLDER = '_bundle';
export const BUNDLE_FILENAME = 'app.js';
export const TMP_INPUT_FOLDER = '.tmp_input';
export const TMP_OUTPUT_FOLDER = '.tmp_output';
export const MAIN_TIMER_ID = 'Build time';

export enum Stage {
    NEW = 'new',
    PREVIEW = 'preview',
    TECH_PREVIEW = 'tech-preview',
    SKIP = 'skip',
}

export const BUILD_FOLDER_PATH = dirname(process.mainModule?.filename || '');

export const YFM_PLUGINS = [
    attrs,
    meta,
    deflist,
    includes,
    cut,
    links,
    images,
    notes,
    anchors,
    tabs,
    code,
    imsize,
    sup,
    video,
];
