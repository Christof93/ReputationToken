import { defineStore } from 'pinia'

export const useNodeStore = defineStore({
  id: 'nodes',
  state: () => ({
    startingSpendingBalance:26400,
    startingAwardedBalance:100,
    transactionAmount: null,
    transactionLinks: [],
    currentAccount: null,
    currentResource: null,
    lookingForRecipient: false,
    lookingForSpender: false,
    graphViz: null,
    nodeColorOff: {
      "Conference": "rgba(230, 230, 233, 0.1)",
      "Paper": "rgba(234, 234, 237, 0.1)",
      "Author": "rgba(236, 236, 239, 0.1)",
      "Review": "rgba(244, 244, 246, 0.1)",
      "Reviewer": "rgba(237, 237, 240, 0.1)",
    },
    nodeColorOn: {
      "Author": "rgb(0, 129, 167)",
      "Reviewer": "rgb(76, 149, 108)",
      "Review": "rgb(253, 252, 220)",
      "Conference": "rgb(240, 113, 103)",
      "Paper": "rgb(254, 217, 183)",
    },
    nodeInfo: {},
    graphData: null,
  }),
  actions: {
    setCurrentAccount(node) {
      this.currentAccount=node;
    },
    sendTokens() {
      console.log(this.currentAccount.id)
      console.log(this.currentResource.id)
      console.log(this.transactionAmount)
      if (this.currentIsSpender) {
        this.currentAccount.spend_balance -= this.transactionAmount
        // find recipients
        // this.currentRecipient.award_balance += this.transactionAmount
      }
      else if (this.currentIsDepositor) {
        // find recipients
        // this.currentAccount.collaterals["to"][this.currentRecipient.id] += this.transactionAmount
        // this.currentRecipient.collaterals["from"][this.currentAccount.id] += this.transactionAmount
      }
      visualizeTransaction(this)
    },
    startLookingForRecipient() {
      this.lookingForRecipient=true
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
    stopLookingForRecipient() {
      this.lookingForRecipient=false
      if (this.graphViz!==null) {
        this.graphViz.nodeColor((node) => {
          return this.nodeColorOn[node._type[0]]
        })
      }
    },
    startLookingForSpender() {
      this.lookingForSpender=true
      this.currentResource=null
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
  }
})

export function isCorrectCategory(store, node) {
  if (node.id==store.currentSpender?.id||node.id==store.currentIsRecipient?.id) {return false}
  if (store.lookingForSpender) {
    return ["Reviewer","Author", "Conference"].includes(node._type[0])      
  }
  else if (store.lookingForRecipient) {
    if (store.currentAccount._type[0]=="Conference") {
      return ["Paper","Review"].includes(node._type[0])
    }
    else {
      return node._type[0]=="Conference"
    }
  }
  return false
}

async function visualizeTransaction(store) {
  const data = store.graphViz.graphData();
  if (store.accountIsSpender) {
    store.transactionLinks = findSpenderPaths(store.currentResource, data.links)
    console.log(store.transactionLinks)
  }
  else if (store.accountIsDepositor) {
    store.transactionLinks = findTransactionPaths(store.currentAccount.id, store.currentResource.id, data.links)
    console.log(store.transactionLinks)
  }
  store.graphViz.linkWidth(store.graphViz.linkWidth())
  const delay = (ms) => new Promise(res => setTimeout(res, ms))
  function compare( a, b ) {
    if ( a.source._type[0] < b.source._type[0] ){
      return -1;
    }
    if ( a.source._type[0] > b.source._type[0] ){
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

function findDepositorPaths(resourceNode, links, authors=true) {
  let pathsToConf = []
  for (const link of links) {
    if (link.source.id == resourceNode.id && link._type =="_GETS_HAS_REVIEW") {
      pathsToConf.push(link)
      pathsToConf = pathsToConf.concat(findDepositorPaths(link.source, links, false))
    }
    else if (link.source.id==resourceNode.id && link._type =="_IS_SUBMITTED_TO") {
      pathsToConf.push(link)
    }
    else if (authors && link.target.id==resourceNode.id && link._type=="_GETS_HAS_AUTHOR") {
      pathsToConf.push(link)
    }
  } 
  return pathsToConf
}