import {default as fsWithCallbacks} from 'fs';
import walkSync from 'walk-sync';
import {resolve, join} from 'path';
import S3 from 'aws-sdk/clients/s3';
import mime from 'mime-types';
const util = require('util');

import {ArgvService} from '../services';
import {logger} from '../utils';

const fs = fsWithCallbacks.promises;

const DEFAULT_PREFIX = process.env.YFM_STORAGE_PREFIX ?? '';

/**
 * Publishes output files to S3 compatible storage
 * @return {void}
 */
export async function publishFiles() {
    const {
        output: outputFolderPath,
        ignore = [],
        storageEndpoint: endpoint,
        storageBucket: bucket,
        storagePrefix: prefix = DEFAULT_PREFIX,
        storageKeyId: accessKeyId,
        storageSecretKey: secretAccessKey,
    } = ArgvService.getConfig();

    const s3Client = new S3({
        endpoint, accessKeyId, secretAccessKey,
    });
    const upload = util.promisify(s3Client.upload);

    const filesToPublish: string[] = walkSync(resolve(outputFolderPath), {
        directories: false,
        includeBasePath: false,
        ignore,
    });

    return Promise.all(
        filesToPublish.map(async (pathToFile) => {
            const mimeType = mime.lookup(pathToFile);

            const params: S3.Types.PutObjectRequest = {
                ContentType: mimeType ? mimeType : undefined,
                Bucket: bucket,
                Key: join(prefix, pathToFile),
                Body: await fs.readFile(resolve(outputFolderPath, pathToFile)),
            };

            logger.upload(pathToFile);

            return upload(params);
        }),
    );
}
