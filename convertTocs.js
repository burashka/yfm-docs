const {readFileSync, writeFileSync} = require('fs');

const walkSync = require('walk-sync');
const {dump, load} = require('js-yaml');

const tocFilePaths = walkSync('/home/euspenskiy/WebstormProjects/docs', {
    directories: false,
    includeBasePath: false,
    globs: [
        '**/*.yaml',
    ],
});

for (const path of tocFilePaths) {
    const fullPath = `/home/euspenskiy/WebstormProjects/docs/${path}`;
    console.log(fullPath);

    try {
        const content = readFileSync(fullPath, 'utf8');
        writeFileSync(fullPath, dump(load(content)));
    } catch (e) {
        console.error(e);
    }
}
