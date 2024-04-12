import { defineStore } from 'pinia'

export const useNodeStore = defineStore({
  id: 'nodes',
  state: () => ({
    startingSpendingBalance:26400,
    startingAwardedBalance:100,
    transactionAmount: null,
    currentAccount: null,
    currentRecipient: null,
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
      console.log(this.currentRecipient.id)
      console.log(this.transactionAmount)
      if (this.currentIsSpender) {
        this.currentAccount.spend_balance -= this.transactionAmount
        this.currentRecipient.award_balance += this.transactionAmount
      }
      else if (this.currentIsDepositor) {
        this.currentAccount.collaterals["to"][this.currentRecipient.id] += this.transactionAmount
        this.currentRecipient.collaterals["from"][this.currentAccount.id] += this.transactionAmount
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
      this.currentRecipient=null
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
        return store.currentAccount._type[0]=="Conference"
      },
      accountIsDepositor: (state) => {
        return ["Reviewer","Author"].includes(store.currentAccount._type[0])
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
      return ["Reviewer","Author"].includes(node._type[0])
    }
    else {
      return node._type[0]=="Conference"
    }
  }
  return false
}

function visualizeTransaction(store) {
  const data = store.graphViz.graphData();
  data.links.push({"source":store.currentAccount.id, "target":store.currentRecipient.id})
  store.graphViz(data)
}