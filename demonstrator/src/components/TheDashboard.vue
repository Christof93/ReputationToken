<script setup>
import  { useNodeStore } from '../stores/nodeStore'
import  { useSimStore } from '../stores/simStore'
import ReputationTokenIcon from './IconReputationToken.vue'
const nodeStore = useNodeStore()
const simStore = useSimStore()

async function sendTokensFromWallet() {
  if (nodeStore.accountIsSpender) {
    nodeStore.sendTokens(nodeStore.currentResource, simStore.transactionAmount);
    simStore.sendTokens(nodeStore.confNode, nodeStore.currentResource, simStore.transactionAmount)
  }
  else if (nodeStore.accountIsDepositor) {
    simStore.bidTokens(nodeStore.currentAccount, nodeStore.confNode, nodeStore.currentResource, simStore.transactionAmount)
    nodeStore.bidTokens(nodeStore.currentAccount, nodeStore.currentResource, simStore.transactionAmount)
  }
  await nodeStore.visualizeTransactions(nodeStore.transactionLinks)
  nodeStore.transactionLinks=[]
}
</script>

<template>
  <div width="320" class="controls left">
    <v-col cols="12">
      <v-card
        width="320"
        class="fill-height"
        title="Reputation Token Interface"
      >
        <v-card-text>
          <v-slider
            label="beta"
            v-model="simStore.beta"
            :max="1"
            :min="0"
            :step="0.01"
            class="align-center"
            hide-details
          >
          <template v-slot:append>
      <v-text-field
        v-model="simStore.beta"
        density="compact"
        style="width: 70px"
        hide-details
        single-line
      ></v-text-field>
    </template></v-slider>
  </v-card-text>
    <v-card-text>
          <v-btn  block v-on:click="simStore.runConference" append-icon="mdi-play" class="bg-green-lighten-1">
            Start Conference!
          </v-btn>
          </v-card-text>
        </v-card>
    </v-col>
    <v-col cols="12">
        <v-card
        width="320"
        class="fill-height"
        title="Inspect Wallet"
        >
        <v-card-text>
          <div>Account: {{ nodeStore.currentAccount?.id }}</div>
          <v-btn  v-on:click="nodeStore.startLookingForSpender">
            {{nodeStore.lookingForSpender? "Click on node to select":"Select Account"}}
          </v-btn>
          </v-card-text>
          <v-card-text>
            <div class="text-body-1">Spendable Tokens: 
              <v-chip append-icon="mdi-outstars"> 
                {{ nodeStore.currentAccount==null?0:nodeStore.currentAccount.spend_balance }} 
              </v-chip> 
              <ReputationTokenIcon class="inline-icon"/>
            </div>
            <div class="text-body-1">Awarded Tokens: 
              <v-chip append-icon="mdi-outstars"> 
                {{ nodeStore.currentAccount==null?0:nodeStore.currentAccount.award_balance }} 
              </v-chip>
              <ReputationTokenIcon class="inline-icon"/>
            </div>
            <div class="text-body-1">Total Collaterals: 
              <v-chip append-icon="mdi-outstars"> 
                {{ nodeStore.totalAccountCollaterals }}  
              </v-chip>
              <ReputationTokenIcon class="inline-icon"/>
            </div>
          </v-card-text>
          <!-- <v-divider inset></v-divider> -->
          <v-card-text>
            <v-col>
              <div>Resource: {{ nodeStore.currentResource?.id }}</div>
              <v-btn :disabled="nodeStore.currentAccount==null" v-on:click="nodeStore.startLookingForResource">
                {{ nodeStore.lookingForRecipient? "Click on node to select":"Select resource"}}
              </v-btn>
            </v-col>
            <v-col>
              <v-text-field label="Amount" variant="outlined" v-model="simStore.transactionAmount"></v-text-field>
              <v-btn 
                :disabled="(nodeStore.currentAccount==null||nodeStore.currentResource==null||simStore.transactionAmount==null)" block 
                v-on:click="sendTokensFromWallet"
                >send to {{ nodeStore.currentRecipient }}</v-btn>
              </v-col>
            <v-col>
              <div class="d-flex ga-2">
                <v-chip size="small" variant="flat" :color="nodeStore.nodeColorOn['Conference']">Conference</v-chip>  
                <v-chip size="small" variant="flat" :color="nodeStore.nodeColorOn['Author']">Author</v-chip>  
                <v-chip size="small" variant="flat" :color="nodeStore.nodeColorOn['Reviewer']">Reviewer</v-chip>  
              </div>
            </v-col>
          </v-card-text>
        </v-card>        
      </v-col>
      <v-col cols="12">
        <v-card
        width="320"
        class="info fill-height"
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
  top:0;
  bottom:0;
  position: fixed;
  overflow-y: auto;
  width:320;
}
.controls.right {
  right:0;
}
.controls.left {
  left:0;
}
.controls::-webkit-scrollbar { /* WebKit */
  width: 0;
  height: 0;
}
.inline-icon {
  height: 1.5em;
  margin-left:0.5em;
}
.info {
  opacity:0.75;
}
</style>
