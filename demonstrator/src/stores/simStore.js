import { defineStore } from 'pinia'
import  { useNodeStore } from '../stores/nodeStore'

export const useSimStore = defineStore({
    id: 'simulation',
    state: () => ({
        startingSpendingBalance:26400,
        startingAwardedBalance:100,
        transactionAmount: null,
        beta: 0.5,
        nPapers: null,
        nReviews: null,
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
                fromNode.collaterals["to"].push({"account":toNode.id, "amount": transactionAmount, "reason":resourceNode.id})
                toNode.collaterals["from"].push({"account":fromNode.id, "amount": transactionAmount, "reason":resourceNode.id})
            }
        },
        calculateResourceReward(resourceNode, nodeStore, nTotalContributions, totalSpendable) {
            const contributionCollateral = nodeStore.confNode.collaterals.from
                .filter((coll)=> coll.reason==resourceNode.id)
                .reduce((tmp, coll) => tmp + coll.amount, 0) + 1
            const reward = (this.beta * totalSpendable / nTotalContributions) + 
                ((1-this.beta) * totalSpendable * contributionCollateral) / (nodeStore.allCollateralsSum + nTotalContributions)
            return reward
        },
        runConference() {
            const nodeStore = useNodeStore()
            const spendable = nodeStore.confNode.spend_balance
            for (const node of nodeStore.graphData.nodes) {
                if (node._type[0]=="Paper") {
                    const reward = this.calculateResourceReward(node, nodeStore, this.nPapers, spendable)
                    this.sendTokens(nodeStore.confNode, node, reward)
                    nodeStore.sendTokens(node, reward)
                }
            }
            nodeStore.visualizeTransactions()
        }
    },
    getters: {
       
    }
})