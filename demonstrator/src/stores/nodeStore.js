import { defineStore } from 'pinia'
import  { useSimStore } from '../stores/simStore'
export const useNodeStore = defineStore({
  id: 'nodes',
  state: () => ({
    transactionLinks: [],
    currentAccount: null,
    currentResource: null,
    lookingForResource: false,
    lookingForSpender: false,
    confNode: null,
    graphViz: null,
    nodeColorOff: {
      "Conference": "rgba(0, 0, 17, 0.5)",
      "Paper": "rgba(0, 0, 17, 0.5)",
      "Author": "rgba(0, 0, 17, 0.5)",
      "Review": "rgba(0, 0, 17, 0.5)",
      "Reviewer": "rgba(0, 0, 17, 0.5)",
    },
    nodeColorOn: {
      "Author": "rgb(0, 129, 167)",
      "Reviewer": "rgb(76, 149, 108)",
      "Review": "rgb(253, 252, 220)",
      "Conference": "rgb(240, 113, 103)",
      "Paper": "rgb(254, 217, 183)",
    },
    linkOrder: {
      "_IS_SUBMITTED_TO":5,
      "_HAS_AUTHOR":2,
      "_HAS_REVIEW":1,
      "_GETS_IS_SUBMITTED_TO":0,
      "_GETS_HAS_AUTHOR":3,
      "_GETS_HAS_REVIEW":4,
    },
    nodeInfo: {},
    graphData: null,
    children: {},
  }),
  actions: {
    sendTokens() {
      visualizeTransaction(this)
    },
    startLookingForResource() {
      this.lookingForResource=true
      this.transactionLinks = []
      if (this.graphViz!==null) {
        this.graphViz.nodeColor((node) => {
          if (isCorrectCategory(this, node)) {
            return this.nodeColorOn[node._type[0]]
          }
          else {
            return this.nodeColorOff[node._type[0]]
          }
        })
      }
    },
    stopLookingForResource() {
      this.lookingForResource=false
      if (this.graphViz!==null) {
        this.graphViz.nodeColor((node) => {
          return this.nodeColorOn[node._type[0]]
        })
      }
    },
    startLookingForSpender() {
      this.lookingForSpender=true
      this.currentResource=null
      this.transactionLinks = []
      if (this.graphViz!==null) {
        this.graphViz.nodeColor((node) => {
          if (isCorrectCategory(this, node)) {
            return this.nodeColorOn[node._type[0]]
          }
          else {
            return this.nodeColorOff[node._type[0]]
          }
        })
      }
    },
    stopLookingForSpender() {
      this.lookingForSpender=false
      if (this.graphViz!==null) {
        this.graphViz.nodeColor((node) => {
          return this.nodeColorOn[node._type[0]]
        })
      }
    },
  },
  getters: {
      currentRecipient: (state) => state.accountIsDepositor?"Conference":"Authors",
      getNodeSizeMap: (state) => 
        (num_nodes) => {
          return {
            "Conference":num_nodes,
            "Paper":20,
            "Author":10,
            "Review":3,
            "Reviewer":2,
          }
      },
      accountIsSpender: (state) => {
        return state.currentAccount?._type[0]=="Conference"
      },
      accountIsDepositor: (state) => {
        return ["Reviewer","Author"].includes(state.currentAccount?._type[0])
      },
      findRecipients: (state) => (resourceNode) => {
        let recipientNodes = []
        for (const link of state.graphData.links) {
          if (link._type =="_HAS_AUTHOR" && link.source.id==resourceNode.id) {
            recipientNodes.push(link.target)
          }
        }
        return recipientNodes
      },
      totalAccountCollaterals: (state) => {
        console.log(state.currentAccount)
        if (state.currentAccount!=null && state.accountIsSpender) {
          console.log(state.currentAccount.collaterals)
          return state.currentAccount.collaterals.from.reduce((tmpSum, coll) => {return tmpSum + coll.amount}, 0)
        }
        else if (state.currentAccount!=null && state.accountIsDepositor) {
          return state.currentAccount.collaterals.to.reduce((tmpSum, coll) => {return tmpSum - coll.amount}, 0)
        }
        else {
          return null
        }
      },
  }
})

export function isCorrectCategory(store, node) {
  if (node.id==store.currentSpender?.id||node.id==store.currentIsRecipient?.id) {return false}
  if (store.lookingForSpender) {
    return ["Reviewer","Author", "Conference"].includes(node._type[0])      
  }
  else if (store.lookingForResource) {
    if (store.accountIsDepositor) {
      return ["Paper","Review"].includes(node._type[0]) && store.children[store.currentAccount.id].includes(node.id)
    }
    else {
      return ["Paper","Review"].includes(node._type[0])
    }
  }
  return false
}

async function visualizeTransaction(store) {
  const data = store.graphViz.graphData();
  if (store.accountIsSpender) {
    store.transactionLinks = findSpenderPaths(store.currentResource, data.links)
  }
  else if (store.accountIsDepositor) {
    console.log(store.currentResource.id)
    store.transactionLinks = findDepositorPaths(store.currentAccount, store.currentResource, data.links)
  }
  store.graphViz.linkWidth(store.graphViz.linkWidth())
  const delay = (ms) => new Promise(res => setTimeout(res, ms))
  function compare( a, b ) {
    if ( store.linkOrder[a._type] < store.linkOrder[b._type] ){
      return -1;
    }
    if ( store.linkOrder[a._type] > store.linkOrder[b._type] ){
      return 1;
    }
    return 0;
  }
  store.transactionLinks.sort(compare)
  for (const transactionL of store.transactionLinks) {
    await delay(1)
    store.graphViz.emitParticle(transactionL)
    await delay(1000)
  }
}

function findSpenderPaths(resourceNode, links, authors=true) {
  let pathsToConf = []
  for (const link of links) {
    if (link.target.id == resourceNode.id && link._type =="_HAS_REVIEW") {
      pathsToConf.push(link)
      pathsToConf = pathsToConf.concat(findSpenderPaths(link.source, links, false))
    }
    else if (link.target.id==resourceNode.id && link._type =="_GETS_IS_SUBMITTED_TO") {
      pathsToConf.push(link)
    }
    else if (authors && link.source.id==resourceNode.id && link._type=="_HAS_AUTHOR") {
      pathsToConf.push(link)
    }
  } 
  return pathsToConf
}
function getRootPath(node, resourceNode, links, pathsToRoot = []) {
  let nextTarget = null
  for (const link of links) {
    if (link._type=="_GETS_HAS_AUTHOR" && resourceNode!=null) {
      if (link.target.id==resourceNode.id && link.source.id==node.id) {
        pathsToRoot.push(link)
        nextTarget=link.target
        break
      }
    }
    else if (["_GETS_HAS_REVIEW", "_IS_SUBMITTED_TO"].includes(link._type)) {
      if (link.source.id == node.id) {
        pathsToRoot.push(link)
        nextTarget=link.target
        break
      }
    }
  }
  if (nextTarget!=null) {
    pathsToRoot = getRootPath(nextTarget, null, links, pathsToRoot)
  }
  return pathsToRoot
}
function findDepositorPaths(senderNode, resourceNode, links) {
  let pathsToConf = getRootPath(senderNode, resourceNode, links)
  return pathsToConf
}