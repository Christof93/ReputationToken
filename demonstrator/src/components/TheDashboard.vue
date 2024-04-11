<script setup>
import  { useNodeStore } from '../stores/nodeStore'
import ReputationTokenIcon from './IconReputationToken.vue'
const nodeStore = useNodeStore()
</script>

<template>
    <div class="controls">
      <v-col>
        <v-card
        title="Reputation Token Wallet"
        width="400"
        >
        <v-card-text>
          <div>Account: {{ nodeStore.currentAccount?.id }}</div>
          <v-btn  v-on:click="nodeStore.startLookingForSpender">
            {{nodeStore.lookingForSpender? "Click on node to select":"Select Account"}}
          </v-btn>
          </v-card-text>
          <v-card-text>
            <div class="text-body-1">Spendable Tokens: {{ nodeStore.currentAccount==null?0:nodeStore.currentAccount.spendable_balance }} <font-awesome-icon :icon="['fas', 'circle-star']" /><ReputationTokenIcon class="inline-icon"/></div>
            <div class="text-body-1">Awarded Tokens: {{ nodeStore.currentAccount==null?0:nodeStore.currentAccount.awarded_balance }} <font-awesome-icon :icon="['fas', 'circle-star']" /><ReputationTokenIcon class="inline-icon"/></div>
            <div class="text-body-1">Total Collaterals: {{ nodeStore.currentAccount?.collaterals }} <font-awesome-icon :icon="['fas', 'circle-star']" /> <ReputationTokenIcon class="inline-icon"/></div>
          </v-card-text>
          <!-- <v-divider inset></v-divider> -->
          <v-card-text>
            <v-col>
              <v-btn :disabled="nodeStore.currentAccount==null" v-on:click="nodeStore.startLookingForRecipient">
                {{ nodeStore.lookingForRecipient? "Click on node to select":"Select recipent"}}
              </v-btn>
            </v-col>
            <v-col>
              <v-text-field label="Amount" variant="outlined"></v-text-field>
              <v-btn :disabled="(nodeStore.currentAccount==null||nodeStore.currentRecipient==null)" block >send to {{ nodeStore.currentRecipient?.id }}</v-btn>
            </v-col>

        </v-card-text>
        </v-card>        
      </v-col>
      <v-col>
        <v-card
            width="400"
            class="info"
          >
            <v-card-text v-for="(info, key) in nodeStore.nodeInfo">
              <br>{{ key }}:</br> {{ info }}
            </v-card-text>
          </v-card>
        </v-col>       
      </div>
    <div class="visualization">
      <GraphViz></GraphViz>
    </div>
</template>

<style scoped>
.controls {
  z-index: 1;
  position: fixed;
}
.inline-icon {
  height: 1.5em;
  margin-left:0.5em;
}
.info {
  opacity:0.75;
}
</style>
