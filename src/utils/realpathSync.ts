/* istanbul ignore file */

import fs from 'node:fs';

/* Only used for mocking purposes */
function realpathSync(path: string): string {
    return fs.realpathSync(path);
}

export default realpathSync;
