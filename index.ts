import { unfurl } from 'unfurl.js'
const fs = require('fs')
const path = require('path')
import { selectPossibleOembedLinkNodes } from './selectPossibleOembedLinkNodes'
import logResults from './logResults.js'
import { tranformsLinkNodeToOembedNode } from './transformLinkToOembedNode'
import { IOembed } from './interfaces'
import { Node } from 'unist'

export default async (
  {
    markdownAST,
    markdownNode,
    cache,
    reporter,
  }: { markdownAST: any; markdownNode: any; cache: any; reporter: any },
  rawOptions: any
) => {
  try {
    const options = rawOptions

    let processedUrlsJSON = {}

    if (fs.existsSync(options.processedUrlsFile)) {
      const processedUrlsFile = fs.readFileSync(options.processedUrlsFile)
      processedUrlsJSON = JSON.parse(processedUrlsFile)
    } else {
      fs.mkdirSync(path.dirname(options.processedUrlsFile), { recursive: true })
      fs.writeFileSync(options.processedUrlsFile, '{}')
    }

    const nodes = selectPossibleOembedLinkNodes(markdownAST)

    if (nodes.length > 0) {
      const results = await Promise.all(
        nodes.map((node: any) => processNode(node, options, processedUrlsJSON))
      )
      fs.writeFileSync(
        options.processedUrlsFile,
        JSON.stringify(processedUrlsJSON, null, 2)
      )
      logResults(results, markdownNode, reporter)
    }
  } catch (error) {
    reporter.error(`gatsby-remark-oembed: Error processing links`, error)
  }
}

// For each node this is the process
const processNode = async (
  node: any,
  options: any,
  processedUrl: { [key: string]: IOembed }
): Promise<Node> => {
  try {
    const metaData = await unfurl(node.url)

    if (!processedUrl[node.url]) {
      processedUrl[node.url] = {
        title:
          metaData.twitter_card?.title ??
          metaData.open_graph?.title ??
          metaData.title,
        description:
          metaData.twitter_card?.description ??
          metaData.open_graph?.description ??
          metaData.description,
        url: metaData.twitter_card?.url ?? metaData.open_graph?.url,
        video: metaData.open_graph?.videos?.[0] || undefined,
        // audio: ,
        image:
          metaData.twitter_card?.images?.[0] ||
          metaData.open_graph?.images?.[0] ||
          undefined,
        logo: metaData.favicon,
        site:
          metaData.oEmbed?.provider_name ||
          metaData.open_graph?.site_name ||
          metaData.twitter_card?.site ||
          undefined,
        // iframe
      }
    }

    return tranformsLinkNodeToOembedNode(node, processedUrl[node.url])
  } catch (error) {
    error.url = node.url
    return error
  }
}
