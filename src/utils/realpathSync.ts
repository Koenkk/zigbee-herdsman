/* istanbul ignore file */
import fs from 'fs';
import { basename } from 'path';

function realpathSync(path: string): string {
    try {
        return fs.realpathSync(path);
    } catch (error) {
        // On windows, the path is usually a COM port name or something like `\\.\COM4`, which cannot be resolved as above.
        // In this case, we just use the basename of the path (e.g. COM4 in the example above)
        const resolvedPath = basename(path);
        logger.debug(`Failed to resolve path: '${error}', using basename '${resolvedPath}' instead`, NS);
        return resolvedPath;
    }
}

export default realpathSync;
