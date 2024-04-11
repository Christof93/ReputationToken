import { defineStore } from 'pinia'

export const useNodeStore = defineStore({
  id: 'nodes',
  state: () => ({
    startingSpendingBalance:1000,
    startingAwardedBalance:100,
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
  }),
  actions: {
    setCurrentAccount(node) {
      this.currentAccount=node;
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