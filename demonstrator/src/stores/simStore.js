import { defineStore } from 'pinia'
import  { useNodeStore } from './nodeStore'

export const useSimStore = defineStore({
    id: 'simulation',
    state: () => ({
      startingSpendingBalance:26400,
      startingAwardedBalance:100,
      transactionAmount: null,
      beta: 0.5,
      epsilon: 0.01,
      nPapers: null,
      nAcceptedPapers: null,
      nReviews: null,
      nAcceptedReviews: null,
      sumAcceptedCollaterals: null,
      progress:0,
      confRunning: false,
      loaderIntervalId: null,
      riskAffinity: 0.1,
      step: 0,
      stepNames: [
        "Put Collaterals", 
        // "Put Collaterals",
        // "Reward Contributions",
        "Reward Contributions",
        "Reset"
      ],
      status:"_",
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
      resetSpendableTokens(amount) {
        const nodeStore = useNodeStore()
        nodeStore.confNode.spend_balance = amount
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
              .reduce((tmp, coll) => tmp + coll.amount, 0) + this.epsilon
          const reward = (this.beta * totalSpendable / nTotalContributions) + 
              (1-this.beta) * totalSpendable * contributionCollateral / 
              (this.sumAcceptedCollaterals + (this.epsilon * nTotalContributions))
          return reward
      },
      async runConference() {
        const nodeStore = useNodeStore()
        this.confRunning=true
        if (this.step==0) {
          this.putCollaterals("Paper")
          this.step++
          await nodeStore.visualizeTransactions(2, 1200)
          nodeStore.resetViz()
        }
        else if (this.step==1) {
          this.rewardContributions("Paper")
          this.step++
          await nodeStore.visualizeTransactions(10, 1700)
          nodeStore.resetViz()
        }
        else if (this.step==2) {
          this.resetSpendableTokens(12400)
          this.step=0
          // this.confRunning=false
        }
      },
      rewardContributions(type) {
        const nodeStore = useNodeStore()
        this.sumAcceptedCollaterals = nodeStore.acceptedCollateralsSum
        const spendable = nodeStore.confNode.spend_balance
        for (const node of nodeStore.graphData.nodes) {
            if (node._type[0]==type && node.accepted==1) {
                const reward = this.calculateResourceReward(node, nodeStore, this.nAcceptedPapers, spendable)
                this.sendTokens(nodeStore.confNode, node, reward)
                nodeStore.sendTokens(node, reward)
            }
          }
        this.unblockCollaterals(type)

        nodeStore.graphViz.nodeColor((node) => {
            if (node.accepted==null || node.accepted==1) {
                return nodeStore.nodeColorOn[node._type[0]]
            }
            else {
                return "rgba(254, 217, 183, 0.6)"
            }
        })
      },
      putCollaterals(type) {
        const nodeStore = useNodeStore()
        for (const node of nodeStore.graphData.nodes) {
            if (node._type[0]==type) {
                for (const childNodeId of nodeStore.children[node.id]) {
                  const childNode = nodeStore.idToNode[childNodeId]

                  if (childNode._type[0]=="Author") {
                    const coll = this.calculateCollateral(node, childNode)
                    if (coll > 0) {
                      this.bidTokens(childNode, nodeStore.confNode, node, coll)
                      nodeStore.bidTokens(childNode, node, coll)
                    }
                  }
                }
            }
        }
      },
      calculateCollateral(resource, author) {
        const maxCollateral = this.riskAffinity * author.award_balance
        const confidence = resource.avg_score/10
        const rng = Math.random()
        const coll = Math.floor(rng*confidence*maxCollateral)
        return rng<=0.4?0:coll
      },
      unblockCollaterals(type) {
        const nodeStore = useNodeStore()
        for (let fromIndex = nodeStore.confNode.collaterals.from.length - 1; fromIndex >= 0; fromIndex--) {
          const coll = nodeStore.confNode.collaterals.from[fromIndex]
          const forResource = nodeStore.idToNode[coll.reason]
          if (forResource._type[0]==type) {
            if (forResource.accepted==0) nodeStore.idToNode[coll.account].award_balance-=coll.amount
            this.removeCollateralEntry(coll, forResource, nodeStore)
          }
        }
      },
      removeCollateralEntry(collateralEntry, forResource, nodeStore) {
        let from = nodeStore.confNode.collaterals.from
        let to = nodeStore.idToNode[collateralEntry.account].collaterals.to
        for (let toIndex = to.length - 1; toIndex >= 0; toIndex--) {
          if (to[toIndex].reason==forResource.id) {
            to.splice(toIndex, 1)
          }
        }
        from.splice(from.indexOf(collateralEntry), 1)
      }
    },
    getters: {
      stepName: (state) => {return state.stepNames[state.step]}
    }
})