import { defineStore } from 'pinia'
import  { useNodeStore } from './nodeStore'

export const useSimStore = defineStore({
    id: 'simulation',
    state: () => ({
      startingSpendingBalance:26400,
      startingAwardedBalance:100,
      transactionAmount: null,
      beta: 0.5,
      nPapers: null,
      nAcceptedPapers: null,
      nReviews: null,
      nAcceptedReviews: null,
      progress:0,
      confRunning: false,
      loaderIntervalId: null,
    }),
    actions: {
      sendTokens(fromNode, toNode, transactionAmount) {
          const nodeStore = useNodeStore()
          fromNode.spend_balance -= transactionAmount
          // find recipients
          const recipients = nodeStore.findRecipients(toNode)
          const individual_reward = transactionAmount/recipients.length
          for (const recipient of recipients) {
              recipient.award_balance += individual_reward
          }
      },
      bidTokens(fromNode, toNode, resourceNode, transactionAmount) {
          if (fromNode.collaterals.to.reduce((sum, coll) => sum + coll.amount, 0) + transactionAmount <= fromNode.award_balance) {
              fromNode.collaterals["to"].push({"account": toNode.id, "amount": transactionAmount, "reason": resourceNode.id})
              toNode.collaterals["from"].push({"account": fromNode.id, "amount": transactionAmount, "reason": resourceNode.id})
          }
      },
      calculateResourceReward(resourceNode, nodeStore, nTotalContributions, totalSpendable) {
          const contributionCollateral = nodeStore.confNode.collaterals.from
              .filter((coll)=> coll.reason==resourceNode.id)
              .reduce((tmp, coll) => tmp + coll.amount, 0) + 1
          const reward = (this.beta * totalSpendable / nTotalContributions) + 
              ((1-this.beta) * totalSpendable * contributionCollateral) / (nodeStore.acceptedCollateralsSum + nTotalContributions)
          return reward
      },
      async runConference() {
        this.confRunning=true
        this.rewardContributions("Paper")
      },
      async rewardContributions(type) {
        const nodeStore = useNodeStore()
        const spendable = nodeStore.confNode.spend_balance
        for (const node of nodeStore.graphData.nodes) {
            if (node._type[0]==type && node.accepted==1) {
                const reward = this.calculateResourceReward(node, nodeStore, this.nAcceptedPapers, spendable)
                this.sendTokens(nodeStore.confNode, node, reward)
                nodeStore.sendTokens(node, reward)
                this.unblockCollaterals(node, false)
            }
            else if (node._type[0]==type && node.accepted==0) {
                this.unblockCollaterals(node, true)
            }
        }
        nodeStore.graphViz.nodeColor((node) => {
            if (node.accepted==null || node.accepted==1) {
                return nodeStore.nodeColorOn[node._type[0]]
            }
            else {
                return "rgba(254, 217, 183, 0.6)"
            }
        })
        await nodeStore.visualizeTransactions()
        nodeStore.transactionLinks = []
        this.progress=100
        setTimeout(()=>{
            this.confRunning=false
            this.progress=0
            nodeStore.graphViz.linkWidth(nodeStore.graphViz.linkWidth())
        }, 2500)
      },
      async putCollaterals(type) {
        const nodeStore = useNodeStore()

        for (const node of nodeStore.graphData.nodes) {
            if (node._type[0]==type && node.accepted==1) {
                const reward = this.calculateCollateral(node)
                this.bidTokens(nodeStore.confNode, node, reward)
                nodeStore.bidTokens(node, reward)
            }
        }
      },
      unblockCollaterals(forResource, burn) {
        const nodeStore = useNodeStore()
        for (const coll of nodeStore.confNode.collaterals.from) {
            if (coll.reason==forResource.id) {
                if (burn) nodeStore.idToNode[coll.account].award_balance-=coll.amount
                this.removeCollateralEntry(coll, forResource, nodeStore)
            }
        }
      },
      removeCollateralEntry(collateralEntry, forResource, nodeStore) {
        let from =  nodeStore.confNode.collaterals.from
        from.splice(from.indexOf(collateralEntry), 1)
        let to = nodeStore.idToNode[collateralEntry.account].collaterals.to
        for (const colli in to) {
            if (to[colli].reason==forResource.id) {
                to.splice(colli,1)
            }
        }
      }
    },
    getters: {
       
    }
})