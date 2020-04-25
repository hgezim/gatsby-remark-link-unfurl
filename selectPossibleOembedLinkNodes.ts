import { select, selectAll } from 'unist-util-select'
import { Node } from 'unist'

export const selectPossibleOembedLinkNodes = markdownAST => {
  return selectAll('paragraph link:only-child', markdownAST)
}
