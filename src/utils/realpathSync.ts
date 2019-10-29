/* istanbul ignore file */
import fs from 'fs';

/* Only used for mocking purposes */
function realpathSync(path: string): string {
    if (path.startsWith('tcp:')) {
        return path;
    }
    return fs.realpathSync(path);
}

export default realpathSync;