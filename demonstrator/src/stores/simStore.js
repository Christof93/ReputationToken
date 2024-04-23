import { defineStore } from 'pinia'
import  { useNodeStore } from '../stores/nodeStore'

export const useSimStore = defineStore({
    id: 'simulation',
    state: () => ({
        startingSpendingBalance:26400,
        startingAwardedBalance:100,
        transactionAmount: null,
    }),
    actions: {
        sendTokens() {
            const nodeStore = useNodeStore()
            if (nodeStore.accountIsSpender) {
                nodeStore.currentAccount.spend_balance -= this.transactionAmount
              // find recipients
              const recipients = nodeStore.findRecipients(nodeStore.currentResource)
              const individual_reward = this.transactionAmount/recipients.length
              for (const recipient of recipients) {
                recipient.award_balance += individual_reward
              }
            }
            else if (nodeStore.accountIsDepositor) {
              // send to conference
              const recipient = nodeStore.confNode
              nodeStore.currentAccount.collaterals["to"].push({"account":recipient.id, "amount": this.transactionAmount, "reason":nodeStore.currentResource.id})
              recipient.collaterals["from"].push({"account":nodeStore.currentAccount.id, "amount": this.transactionAmount, "reason":nodeStore.currentResource.id})
            }
        },
    },
    getters: {

    }
})