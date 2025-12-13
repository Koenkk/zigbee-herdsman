/**
 * Scores a string against a pattern for fuzzy matching.
 *
 * The score is higher for more accurate matches. A score of 0 indicates no match.
 *
 * Scoring logic:
 * - A bonus is awarded for each matched character.
 * - A bonus is awarded for consecutive matched characters (a "combo").
 * - A large bonus is given if a character matches the beginning of a word (e.g., 'U' in "someUtils" or 's' in "some_utils").
 * - A bonus is given for matching character case.
 * - A penalty is applied for each character in the target string that is skipped.
 *
 * @param pattern The pattern to search for (e.g., "mtHandS").
 * @param str The string to score against the pattern (e.g., "moveToHueAndSaturation").
 * @returns The match score, or 0 if there is no match.
 */
export function fuzzyMatch(pattern: string, str: string): number {
    if (pattern.length === 0) {
        return 1; // Or some other value indicating a trivial match
    }

    if (str.length === 0) {
        return 0;
    }

    let score = 0;
    let patternIndex = 0;
    let strIndex = 0;
    let lastMatchIndex = -1;
    let inCombo = false;

    const SCORE_MATCH = 10;
    const SCORE_COMBO = 15;
    const SCORE_WORD_START = 20;
    const SCORE_CASE_MATCH = 5;
    const PENALTY_SKIP = -1;

    while (strIndex < str.length && patternIndex < pattern.length) {
        const patternChar = pattern[patternIndex];
        const strChar = str[strIndex];

        if (patternChar.toLowerCase() === strChar.toLowerCase()) {
            score += SCORE_MATCH;

            // Bonus for case-sensitive match
            if (patternChar === strChar) {
                score += SCORE_CASE_MATCH;
            }

            // Bonus for being a word start
            const prevStrChar = strIndex > 0 ? str[strIndex - 1] : " ";
            const isWordStart =
                (prevStrChar === "_" || prevStrChar === " " || (prevStrChar.toLowerCase() === prevStrChar && strChar.toUpperCase() === strChar)) &&
                strChar.toLowerCase() !== strChar;
            if (isWordStart) {
                score += SCORE_WORD_START;
            }

            // Bonus for consecutive matches
            if (lastMatchIndex === strIndex - 1) {
                if (inCombo) {
                    score += SCORE_COMBO;
                } else {
                    inCombo = true;
                }
            } else {
                inCombo = false;
            }

            lastMatchIndex = strIndex;
            patternIndex += 1;
        } else {
            score += PENALTY_SKIP;
        }

        strIndex += 1;
    }

    // If the entire pattern was not found, it's not a match.
    if (patternIndex !== pattern.length) {
        return 0;
    }

    // Normalize score against the length of the string to penalize longer, less-specific matches.
    const finalScore = score / str.length;

    return finalScore > 0 ? finalScore : 0;
}
