import { select, selectAll } from 'unist-util-select'
import { Node } from 'unist'

export const selectPossibleLinkNodes = markdownAST => {
  return selectAll('paragraph link:only-child', markdownAST)
}
