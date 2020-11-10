import MagicString from 'magic-string';
import { Comment } from 'svast';
import { end_offset, start_offset } from '../utils/node-utils';

/**
 * Removes comment
 */
export function handleComment(str: MagicString, node: Comment): void {
    str.remove(start_offset(node), end_offset(node));
}
