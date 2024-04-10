import { defineStore } from 'pinia'

  export const useNodeStore = defineStore({
    id: 'nodes',
    state: () => ({
      currentAccount: null,
      currentIsSpender: false,
      currentIsRecipient: false,
      lookingForRecipient: false,
      lookingForSpender: false,
    }),
    actions: {
      setCurrentAccount(node) {
        this.currentAccount=node;
      },
      startLookingForRecipient() {
        this.lookingForRecipient=true
      },
      stopLookingForRecipient() {
        this.lookingForRecipient=false
      },
      startLookingForSender() {
        this.lookingForSender=true
      },
      stopLookingForSender() {
        this.lookingForSender=false
      },
    }
    getters: {
        currentIsSpender: (state) => {
            return this.currentAccount._type === "Conference";
        }
        currentIsRecipient: (state) => {
            return this.currentAccount._type !== "Conference";
        }
    }
  })