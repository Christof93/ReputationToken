<script setup>
import { onMounted } from 'vue'
import  { useNodeStore } from '../stores/nodeStore'
import  { useSimStore } from '../stores/simStore'
import  { useSettingsStore } from '../stores/settingsStore'
import ReputationTokenIcon from './IconReputationToken.vue'
const nodeStore = useNodeStore()
const simStore = useSimStore()
const settings = useSettingsStore()

async function sendTokensFromWallet() {
  if (nodeStore.accountIsSpender) {
    nodeStore.sendTokens(nodeStore.currentResource, simStore.transactionAmount);
    simStore.sendTokens(nodeStore.confNode, nodeStore.currentResource, simStore.transactionAmount)
  }
  else if (nodeStore.accountIsDepositor) {
    nodeStore.bidTokens(nodeStore.currentAccount, nodeStore.currentResource, simStore.transactionAmount)
    simStore.bidTokens(nodeStore.currentAccount, nodeStore.confNode, nodeStore.currentResource, simStore.transactionAmount)
  }
  await nodeStore.visualizeTransactions(10, 1400)
  nodeStore.transactionLinks=[]
  nodeStore.resetViz()
}
function progress_loader() {
  return setInterval(() => {
    if (simStore.progress<=90) {
      simStore.progress+=4
    }
  }, 500)
}
function toggleReviews() {
  if (settings.showReviews) {
    console.log(nodeStore.graphData)
    nodeStore.graphViz.graphData(nodeStore.graphData)
  }
  else {
    nodeStore.filterNodes((n)=>{return !["Reviewer","Review"].includes(n._type[0])})
  }
}
function dNum(num) {
  return Number.parseFloat(num).toFixed(2)
}
onMounted(()=> {
  simStore.loaderIntervalId=progress_loader()
})

</script>
<template>
  <div width="320" class="controls left">
    <v-col cols="12">
      <v-card
        width="320"
        class="fill-height"
      >
        <v-card-title>
          Reputation Token Interface 
        </v-card-title>
      </v-card>
      <v-card
        width="320"
        class="fill-height"
      >
        <v-card-subtitle>
          Simulation
          <v-btn
            icon="mdi-information-outline"
            @click="settings.showSimulationInfo = !settings.showSimulationInfo"
            size="small"
            class = "ml-3"
          ></v-btn>
          <v-btn
            icon="mdi-cog"
            @click="settings.showVizSettings = !settings.showVizSettings"
            size="small"
          ></v-btn>
        </v-card-subtitle>
        <v-expand-transition>
            <div v-show="settings.showSimulationInfo">
              <v-divider></v-divider>
              <v-card-text>
                I'm a thing. But, like most politicians, he promised more than he could deliver. You won't have time for sleeping, soldier, not with all the bed making you'll be doing. Then we'll go with that data file! Hey, you add a one and two zeros to that or we walk! You're going to do his laundry? I've got to find a way to escape.
              </v-card-text>
            </div>
          </v-expand-transition>
        <v-expand-transition>
            <div v-show="settings.showVizSettings">
              <v-divider></v-divider>
              <v-card-text>
                <v-switch
                  v-model="settings.showReviews"
                  v-on:update:modelValue="toggleReviews"
                  color="indigo"
                  label="Show Reviews"
                  hide-details
                ></v-switch>
              </v-card-text>
            </div>
          </v-expand-transition>
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
          </template>
        </v-slider>
      </v-card-text>
      <v-card-text>
        <v-btn :disabled="nodeStore.loading || simStore.confRunning" block v-on:click="simStore.confRunning=!simStore.confRunning" :append-icon="simStore.confRunning?'mdi-menu-down':'mdi-play'" class="bg-green-lighten-1">
        Run Conference!
        </v-btn>
        <v-progress-linear
          color="green-lighten-1"
          :class="simStore.confRunning || nodeStore.loading?'':'d-none'"
          height="10"
          :model-value="simStore.progress"
          rounded
          striped
        ></v-progress-linear>
        <v-btn 
          :disabled="nodeStore.vizInProgress"
          :class="simStore.confRunning?'':'d-none'"
          block 
          v-on:click="simStore.runConference" 
          append-icon="mdi-play">
          {{ simStore.stepName }}
        </v-btn>
      </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12">
        <v-card
        width="320"
        class="fill-height"
        title="Wallet"
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
                {{ nodeStore.currentAccount==null?0:dNum(nodeStore.currentAccount.spend_balance) }} 
              </v-chip> 
              <ReputationTokenIcon class="inline-icon"/>
            </div>
            <div class="text-body-1">Awarded Tokens: 
              <v-chip append-icon="mdi-outstars"> 
                {{ nodeStore.currentAccount==null?0:dNum(nodeStore.currentAccount.award_balance) }} 
              </v-chip>
              <ReputationTokenIcon class="inline-icon"/>
            </div>
            <div class="text-body-1">Total Collaterals: 
              <v-chip append-icon="mdi-outstars"> 
                {{ dNum(nodeStore.totalAccountCollaterals) }}  
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
                >{{ nodeStore.sendTransactionText }}</v-btn>
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
